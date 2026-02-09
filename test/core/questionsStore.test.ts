import {
  addQuestion,
  questionNameExists,
  clearQuestionsOnStartup,
  getAllQuestions,
} from "../../src/core/questionsStore";
import { QuestionVraiFaux, QuestionChoixMultiple } from "../../src/types/questionTypes";

describe("QuestionsStore - CU02a", () => {
  
  beforeEach(async () => {
    await clearQuestionsOnStartup();
  });

  describe("CU02a - Ajouter Question", () => {
    
    test("CU02a-t1 : Ajouter une question vrai/faux avec succès", async () => {
      const groupId = "LOG210-A01";
      const question: QuestionVraiFaux = {
        nom: "Q1",
        énoncé: "TypeScript est un langage?",
        reponse: true,
        retroaction: "Oui!",
        retroactionValide: "Oui!",
        retroactionInvalide: "Non",
        tags: ["typescript"],
        type: "VraiFaux",
      };

      await addQuestion(groupId, question);

      const allData = await getAllQuestions();
      expect(allData).toHaveLength(1);
      expect(allData[0].group_id).toBe(groupId);
      expect(allData[0].questions).toHaveLength(1);
      expect(allData[0].questions[0].nom).toBe("Q1");
      expect(allData[0].questions[0].type).toBe("VraiFaux");
    });

    test("CU02a-t2 : Ajouter deux questions au même cours", async () => {
      const groupId = "LOG210-A01";
      
      const q1: QuestionVraiFaux = {
        nom: "Q1",
        énoncé: "Question 1",
        reponse: true,
        retroaction: "OK",
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: [],
        type: "VraiFaux",
      };

      const q2: QuestionChoixMultiple = {
        nom: "Q2",
        énoncé: "Question 2",
        seulementUnChoix: true,
        reponses: [
          { text: "A", estBonneReponse: true, retroaction: "Bon" },
          { text: "B", estBonneReponse: false, retroaction: "Mauvais" },
        ],
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: [],
        type: "ChoixMultiple",
      };

      await addQuestion(groupId, q1);
      await addQuestion(groupId, q2);

      const allData = await getAllQuestions();
      expect(allData[0].questions).toHaveLength(2);
      expect(allData[0].questions[0].nom).toBe("Q1");
      expect(allData[0].questions[1].nom).toBe("Q2");
    });

    test("CU02a-t3 : Rejeter les doublons de nom (insensible à la casse)", async () => {
      const groupId = "LOG210-A01";
      const question: QuestionVraiFaux = {
        nom: "Question1",
        énoncé: "Test",
        reponse: true,
        retroaction: "OK",
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: [],
        type: "VraiFaux",
      };

      await addQuestion(groupId, question);

      await expect(
        addQuestion(groupId, {
          ...question,
          énoncé: "Question différente",
        })
      ).rejects.toThrow("existe déjà");
    });

    test("CU02a-t4 : Permettre le même nom dans des cours différents", async () => {
      const question1: QuestionVraiFaux = {
        nom: "Q1",
        énoncé: "Enoncé cours 1",
        reponse: true,
        retroaction: "OK",
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: [],
        type: "VraiFaux",
      };

      const question2: QuestionVraiFaux = {
        nom: "Q1",
        énoncé: "Enoncé cours 2",
        reponse: false,
        retroaction: "OK",
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: [],
        type: "VraiFaux",
      };

      await addQuestion("COURS-01", question1);
      await addQuestion("COURS-02", question2);

      const allData = await getAllQuestions();
      expect(allData).toHaveLength(2);
      expect(allData[0].group_id).toBe("COURS-01");
      expect(allData[1].group_id).toBe("COURS-02");
      expect(allData[0].questions[0].nom).toBe("Q1");
      expect(allData[1].questions[0].nom).toBe("Q1");
    });

    test("CU02a-t5 : Valider l'unicité du nom avec questionNameExists()", async () => {
      const groupId = "LOG210-A01";
      const question: QuestionVraiFaux = {
        nom: "TestQ",
        énoncé: "Test",
        reponse: true,
        retroaction: "OK",
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: [],
        type: "VraiFaux",
      };

      expect(await questionNameExists(groupId, "TestQ")).toBe(false);

      await addQuestion(groupId, question);
      expect(await questionNameExists(groupId, "TestQ")).toBe(true);

      expect(await questionNameExists(groupId, "testq")).toBe(true);
    });
  });
});
