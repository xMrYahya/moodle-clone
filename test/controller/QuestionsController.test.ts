import request from "supertest";
import express, { Express } from "express";
import { QuestionsController } from "../../src/controllers/QuestionsController";
import { clearQuestionsOnStartup } from "../../src/core/questionsStore";

const createMockApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req: any, res, next) => {
    req.session = {
      token: "mock-token",
      user: {
        id: "teacher1",
        first_name: "John",
        last_name: "Doe",
      },
    };
    next();
  });

  app.post("/:groupId/ajouter-vrai-faux", QuestionsController.ajouterQuestionVraiFaux);
  app.post("/:groupId/ajouter-autre-type", QuestionsController.ajouterQuestionAutreType);

  return app;
};

describe("QuestionsController - CU02a", () => {
  let app: Express;

  beforeEach(async () => {
    app = createMockApp();
    await clearQuestionsOnStartup();
  });

  describe("CU02a - Ajouter Question Vrai/Faux", () => {

    test("CU02a-API-t1 : Ajouter une question vrai/faux avec succès", async () => {
      const groupId = "LOG210-A01";
      const response = await request(app)
        .post(`/${groupId}/ajouter-vrai-faux`)
        .send({
          nom: "Q1",
          énoncé: "TypeScript est un langage?",
          reponse: true,
          retroactionVrai: "Correct!",
          retroactionFaux: "Incorrect!",
          tags: ["typescript"],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.question.nom).toBe("Q1");
      expect(response.body.question.type).toBe("VraiFaux");
    });

    test("CU02a-API-t2 : Rejeter si champ obligatoire manquant", async () => {
      const groupId = "LOG210-A01";
      const response = await request(app)
        .post(`/${groupId}/ajouter-vrai-faux`)
        .send({
          nom: "Q1",
          reponse: true,
          retroactionVrai: "OK",
          retroactionFaux: "Non",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("obligatoires");
    });

    test("CU02a-API-t3 : Rejeter les doublons (409 Conflict)", async () => {
      const groupId = "LOG210-A01";

      await request(app)
        .post(`/${groupId}/ajouter-vrai-faux`)
        .send({
          nom: "Q1",
          énoncé: "Question 1",
          reponse: true,
          retroactionVrai: "OK",
          retroactionFaux: "Non",
          tags: [],
        });

      const response = await request(app)
        .post(`/${groupId}/ajouter-vrai-faux`)
        .send({
          nom: "Q1",
          énoncé: "Question différente",
          reponse: false,
          retroactionVrai: "OK",
          retroactionFaux: "Non",
          tags: [],
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain("existe déjà");
    });
  });

  describe("CU02a - Ajouter Question Autre Type", () => {

    test("CU02a-Autre-t1 : Ajouter une question choix multiple", async () => {
      const groupId = "LOG210-A01";
      const response = await request(app)
        .post(`/${groupId}/ajouter-autre-type`)
        .send({
          nom: "QCM1",
          énoncé: "Quelle est la réponse?",
          type: "ChoixMultiple",
          seulementUnChoix: true,
          reponses: [
            { text: "A", estBonneReponse: true, retroaction: "Correct" },
            { text: "B", estBonneReponse: false, retroaction: "Incorrect" },
          ],
          retroactionValide: "Bien!",
          retroactionInvalide: "Essaye encore",
          tags: ["science"],
        });

      expect(response.status).toBe(201);
      expect(response.body.question.type).toBe("ChoixMultiple");
      expect(response.body.question.seulementUnChoix).toBe(true);
    });

    test("CU02a-Autre-t2 : Ajouter une question numérique", async () => {
      const groupId = "LOG210-A01";
      const response = await request(app)
        .post(`/${groupId}/ajouter-autre-type`)
        .send({
          nom: "Q-NUM",
          énoncé: "Quel est le résultat?",
          type: "Numerique",
          reponseAttendue: 42,
          retroactionValide: "Correct",
          retroactionInvalide: "Non",
          tags: ["math"],
        });

      expect(response.status).toBe(201);
      expect(response.body.question.type).toBe("Numerique");
      expect(response.body.question.reponseAttendue).toBe(42);
    });

    test("CU02a-Autre-t3 : Rejeter les doublons (409 Conflict)", async () => {
      const groupId = "LOG210-A01";

      await request(app)
        .post(`/${groupId}/ajouter-autre-type`)
        .send({
          nom: "QCM1",
          énoncé: "Question 1",
          type: "ChoixMultiple",
          seulementUnChoix: false,
          reponses: [],
          retroactionValide: "OK",
          retroactionInvalide: "Non",
          tags: [],
        });

      const response = await request(app)
        .post(`/${groupId}/ajouter-autre-type`)
        .send({
          nom: "QCM1",
          énoncé: "Question différente",
          type: "Numerique",
          reponseAttendue: 100,
          retroactionValide: "OK",
          retroactionInvalide: "Non",
          tags: [],
        });

      expect(response.status).toBe(409);
    });
  });
});
