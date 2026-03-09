import request from "supertest";
import express, { Express } from "express";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const createMockApp = (QuestionsController: any): Express => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req: any, _res, next) => {
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

  app.post("/:idGroupe/ajouter-vrai-faux", QuestionsController.ajouterQuestionVraiFaux);
  app.post("/:idGroupe/ajouter-choix-multiple", QuestionsController.ajouterQuestionChoixMultiple);

  return app;
};

describe("QuestionsController - CU02a", () => {
  let app: Express;
  let tmpDir: string;
  let QuestionsController: any;
  let coursStore: any;

  beforeEach(async () => {
    jest.resetModules();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "questionscontroller-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    QuestionsController = require("../../src/controllers/QuestionsController").QuestionsController;
    coursStore = require("../../src/core/coursStore");
    app = createMockApp(QuestionsController);
    await coursStore.viderStoreAuDemarrage();
    await coursStore.ajouterCoursStocke({
      idGroupe: "LOG210-A01",
      jour: "Lun",
      heure: "10:00",
      activite: "Cours",
      mode: "Presentiel",
      local: "A-101",
      idEnseignant: "teacher1",
      etudiants: [],
      questions: [],
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    jest.dontMock("../../src/core/coursStore");
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test("CU02a-API-t1 : Ajouter une question vrai/faux avec succes", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q1",
        enonce: "TypeScript est un langage?",
        reponse: true,
        retroactionValide: "Correct!",
        retroactionInvalide: "Incorrect!",
        tags: ["typescript"],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.question.nom).toBe("Q1");
    expect(response.body.question.type).toBe("VraiFaux");
  });

  test("CU02a-API-t2 : Rejeter si champ obligatoire manquant", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q1",
        reponse: true,
        retroactionValide: "OK",
        retroactionInvalide: "Non",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Champs manquants");
  });

  test("CU02a-API-t3 : Rejeter les doublons (409 Conflict)", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q1",
        enonce: "Question 1",
        reponse: true,
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: ["tag"],
      });

    const response = await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q1",
        enonce: "Question differente",
        reponse: false,
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: ["tag"],
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain("existe");
  });

  test("CU02a-Autre-t1 : Ajouter une question choix multiple", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-choix-multiple")
      .send({
        nom: "QCM1",
        enonce: "Quelle est la reponse?",
        seulementUnChoix: true,
        reponses: [
          { texte: "A", estBonneReponse: true, retroaction: "Correct" },
          { texte: "B", estBonneReponse: false, retroaction: "Incorrect" },
        ],
        retroactionValide: "Bien!",
        retroactionInvalide: "Essaye encore",
        tags: ["science"],
      });

    expect(response.status).toBe(201);
    expect(response.body.question.type).toBe("ChoixMultiple");
    expect(response.body.question.seulementUnChoix).toBe(true);
  });

  describe("QuestionsController - Unit branches", () => {
    const makeRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    const loadController = (overrides?: {
      ajouterQuestionAuCours?: jest.Mock;
      existeNomQuestion?: jest.Mock;
    }) => {
      const ajouterQuestionAuCours = overrides?.ajouterQuestionAuCours ?? jest.fn().mockResolvedValue(undefined);
      const existeNomQuestion = overrides?.existeNomQuestion ?? jest.fn().mockResolvedValue(false);

      let Controller: any;
      jest.isolateModules(() => {
        jest.doMock("../../src/core/coursStore", () => ({
          ajouterQuestionAuCours,
          existeNomQuestion,
          existeNomQuestionEnExcluant: jest.fn().mockResolvedValue(false),
          recupererQuestionParNom: jest.fn().mockResolvedValue(undefined),
          recupererQuestionsDuCours: jest.fn().mockResolvedValue([]),
          supprimerQuestionDuCours: jest.fn().mockResolvedValue(undefined),
          modifierQuestionDuCours: jest.fn().mockResolvedValue(undefined),
        }));
        Controller = require("../../src/controllers/QuestionsController").QuestionsController;
      });

      return { QuestionsController: Controller, ajouterQuestionAuCours, existeNomQuestion };
    };

    afterEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
      jest.dontMock("../../src/core/coursStore");
    });

    test("ajouterQuestionVraiFaux: missing teacher or idGroupe -> 400", async () => {
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
        params: { idGroupe: "g1" },
        body: { nom: "", enonce: "", reponse: "" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ajouterQuestionVraiFaux: duplicate name -> 409", async () => {
      const { QuestionsController } = loadController({
        existeNomQuestion: jest.fn().mockResolvedValue(true),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1" },
        body: { nom: "Q1", enonce: "E", reponse: true, tags: ["x"] },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test("ajouterQuestionVraiFaux: add throws -> 500", async () => {
      const { QuestionsController } = loadController({
        ajouterQuestionAuCours: jest.fn().mockRejectedValue(new Error("boom")),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1" },
        body: { nom: "Q1", enonce: "E", reponse: "true", tags: ["x"] },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "boom" });
    });

    test("ajouterQuestionChoixMultiple: missing fields -> 400", async () => {
      const { QuestionsController } = loadController();
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1" },
        body: { nom: "", enonce: "" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionChoixMultiple(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
