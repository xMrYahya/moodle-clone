import request from "supertest";
import express, { Express } from "express";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const createMockApp = (QuestionsController: any): Express => {
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
  let tmpDir: string;
  let QuestionsController: any;
  let questionsStore: any;

  beforeEach(async () => {
    jest.resetModules();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "questionscontroller-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    QuestionsController = require("../../src/controllers/QuestionsController").QuestionsController;
    questionsStore = require("../../src/core/questionsStore");
    app = createMockApp(QuestionsController);
    await questionsStore.clearQuestionsOnStartup();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    jest.dontMock("../../src/core/questionsStore");
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
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
      expect(response.body.error).toContain("Champs manquants");
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

  describe("QuestionsController - Unit branches", () => {
    const makeRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    const loadController = (overrides?: {
      addQuestion?: jest.Mock;
      questionNameExists?: jest.Mock;
    }) => {
      const addQuestion = overrides?.addQuestion ?? jest.fn().mockResolvedValue(undefined);
      const questionNameExists = overrides?.questionNameExists ?? jest.fn().mockResolvedValue(false);

      let Controller: any;
      jest.isolateModules(() => {
        jest.doMock("../../src/core/questionsStore", () => ({
          addQuestion,
          questionNameExists,
        }));
        Controller = require("../../src/controllers/QuestionsController").QuestionsController;
      });

      return { QuestionsController: Controller, addQuestion, questionNameExists };
    };

    afterEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
      jest.dontMock("../../src/core/questionsStore");
    });

    test("ajouterQuestionVraiFaux: missing teacher or groupId -> 400", async () => {
      const { QuestionsController } = loadController();
      const req: any = { session: {}, params: {}, body: {} };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ajouterQuestionVraiFaux: missing fields -> 400", async () => {
      const { QuestionsController } = loadController();
      const req: any = {
        session: { user: { id: "t1" } },
        params: { groupId: "g1" },
        body: { nom: "", ["\u00e9nonc\u00e9"]: "", reponse: "" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ajouterQuestionVraiFaux: duplicate name -> 409", async () => {
      const { QuestionsController } = loadController({
        questionNameExists: jest.fn().mockResolvedValue(true),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { groupId: "g1" },
        body: { nom: "Q1", ["\u00e9nonc\u00e9"]: "E", reponse: true },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test("ajouterQuestionVraiFaux: tags array -> mapped to strings", async () => {
      const addQuestion = jest.fn().mockResolvedValue(undefined);
      const { QuestionsController } = loadController({ addQuestion });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { groupId: "g1" },
        body: {
          nom: "Q1",
          ["\u00e9nonc\u00e9"]: "E",
          reponse: true,
          tags: ["a", 2],
        },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      const question = addQuestion.mock.calls[0][1];
      expect(question.tags).toEqual(["a", "2"]);
    });

    test("ajouterQuestionVraiFaux: tags string -> parsed array", async () => {
      const addQuestion = jest.fn().mockResolvedValue(undefined);
      const { QuestionsController } = loadController({ addQuestion });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { groupId: "g1" },
        body: {
          nom: "Q1",
          ["\u00e9nonc\u00e9"]: "E",
          reponse: true,
          tags: "x, y, ,",
        },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      const question = addQuestion.mock.calls[0][1];
      expect(question.tags).toEqual(["x", "y"]);
    });

    test("ajouterQuestionVraiFaux: addQuestion throws -> 500", async () => {
      const { QuestionsController } = loadController({
        addQuestion: jest.fn().mockRejectedValue(new Error("boom")),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { groupId: "g1" },
        body: { nom: "Q1", ["\u00e9nonc\u00e9"]: "E", reponse: "true" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "boom" });
    });

    test("ajouterQuestionAutreType: missing teacher or groupId -> 400", async () => {
      const { QuestionsController } = loadController();
      const req: any = { session: {}, params: {}, body: {} };
      const res = makeRes();

      await QuestionsController.ajouterQuestionAutreType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ajouterQuestionAutreType: missing fields -> 400", async () => {
      const { QuestionsController } = loadController();
      const req: any = {
        session: { user: { id: "t1" } },
        params: { groupId: "g1" },
        body: { nom: "", ["\u00e9nonc\u00e9"]: "", type: "" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionAutreType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ajouterQuestionAutreType: duplicate name -> 409", async () => {
      const { QuestionsController } = loadController({
        questionNameExists: jest.fn().mockResolvedValue(true),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { groupId: "g1" },
        body: { nom: "Q1", ["\u00e9nonc\u00e9"]: "E", type: "Numerique" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionAutreType(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test("ajouterQuestionAutreType: tags string -> parsed array", async () => {
      const addQuestion = jest.fn().mockResolvedValue(undefined);
      const { QuestionsController } = loadController({ addQuestion });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { groupId: "g1" },
        body: { nom: "Q1", ["\u00e9nonc\u00e9"]: "E", type: "Numerique", tags: "x, y" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionAutreType(req, res);

      const question = addQuestion.mock.calls[0][1];
      expect(question.tags).toEqual(["x", "y"]);
    });

    test("ajouterQuestionAutreType: addQuestion throws -> 500", async () => {
      const { QuestionsController } = loadController({
        addQuestion: jest.fn().mockRejectedValue(new Error("boom")),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { groupId: "g1" },
        body: { nom: "Q1", ["\u00e9nonc\u00e9"]: "E", type: "Numerique" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionAutreType(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "boom" });
    });
  });
});
