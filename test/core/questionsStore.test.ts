import { QuestionVraiFaux, QuestionChoixMultiple } from "../../src/types/questionTypes";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

describe("QuestionsStore - CU02a", () => {
  let tmpDir: string;
  let store: any;
  
  beforeEach(async () => {
    jest.resetModules();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "questionsstore-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    store = require("../../src/core/questionsStore");
    await store.clearQuestionsOnStartup();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
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

      await store.addQuestion(groupId, question);

      const allData = await store.getAllQuestions();
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

      await store.addQuestion(groupId, q1);
      await store.addQuestion(groupId, q2);

      const allData = await store.getAllQuestions();
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

      await store.addQuestion(groupId, question);

      await expect(
        store.addQuestion(groupId, {
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

      await store.addQuestion("COURS-01", question1);
      await store.addQuestion("COURS-02", question2);

      const allData = await store.getAllQuestions();
      expect(allData).toHaveLength(2);
      expect(allData[0].group_id).toBe("COURS-01");
      expect(allData[1].group_id).toBe("COURS-02");
      expect(allData[0].questions[0].nom).toBe("Q1");
      expect(allData[1].questions[0].nom).toBe("Q1");
    });

    test("CU02a-t5 : Valider l'unicité du nom avec store.questionNameExists()", async () => {
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

      expect(await store.questionNameExists(groupId, "TestQ")).toBe(false);

      await store.addQuestion(groupId, question);
      expect(await store.questionNameExists(groupId, "TestQ")).toBe(true);

      expect(await store.questionNameExists(groupId, "testq")).toBe(true);
    });
  });

  test("getAllQuestions returns empty array when questionsStore is not an array", async () => {
    const filePath = path.join(process.cwd(), "data", "questions.json");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ questionsStore: { bad: true } }), "utf-8");

    const allData = await store.getAllQuestions();
    expect(allData).toEqual([]);
  });

  test("getQuestionsForCours returns empty when group not found", async () => {
    const groupId = "LOG210-A01";
    const question: QuestionVraiFaux = {
      nom: "Q1",
      ["\u00e9nonc\u00e9"]: "TypeScript est un langage?",
      reponse: true,
      retroaction: "Oui!",
      retroactionValide: "Oui!",
      retroactionInvalide: "Non",
      tags: ["typescript"],
      type: "VraiFaux",
    };

    await store.addQuestion(groupId, question);

    const { getQuestionsForCours } = require("../../src/core/questionsStore");
    const missing = await getQuestionsForCours("OTHER");
    expect(missing).toEqual([]);
  });

  test("getAllQuestions creates file when missing", async () => {
    const filePath = path.join(process.cwd(), "data", "questions.json");
    try {
      await fs.rm(filePath, { force: true });
    } catch {}

    const all = await store.getAllQuestions();
    const exists = await fs.readFile(filePath, "utf-8");

    expect(all).toEqual([]);
    expect(JSON.parse(exists)).toEqual({ questionsStore: [] });
  });

  test("addQuestion throws when name already exists in same course", async () => {
    const groupId = "LOG210-A01";
    const question: QuestionVraiFaux = {
      nom: "Q1",
      ["\u00e9nonc\u00e9"]: "TypeScript est un langage?",
      reponse: true,
      retroaction: "Oui!",
      retroactionValide: "Oui!",
      retroactionInvalide: "Non",
      tags: ["typescript"],
      type: "VraiFaux",
    };

    await store.addQuestion(groupId, question);

    await expect(store.addQuestion(groupId, question)).rejects.toThrow("existe");
  });
});

