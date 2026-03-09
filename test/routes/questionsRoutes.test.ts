import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

jest.mock("../../src/controllers/QuestionsController", () => ({
  QuestionsController: {
    consulterQuestionsCours: jest.fn((req: any, res: any) => res.status(200).json({ success: true, questions: [] })),
    selectionnerQuestion: jest.fn((req: any, res: any) => res.status(200).json({ success: true })),
    modifierQuestion: jest.fn((req: any, res: any) => res.status(200).json({ success: true })),
    supprimerQuestion: jest.fn((req: any, res: any) => res.status(200).json({ success: true })),
    confirmerSuppressionQuestion: jest.fn((req: any, res: any) => res.status(200).json({ success: true })),
    ajouterQuestionVraiFaux: jest.fn((req: any, res: any) => res.status(200).send("vrai-faux-ok-fr")),
    ajouterQuestionChoixMultiple: jest.fn((req: any, res: any) => res.status(200).send("choix-multiple-ok-fr")),
    ajouterQuestionNumerique: jest.fn((req: any, res: any) => res.status(200).send("numerique-ok-fr")),
    ajouterQuestionReponseCourte: jest.fn((req: any, res: any) => res.status(200).send("reponse-courte-ok-fr")),
    ajouterQuestionMiseEnCorrespondance: jest.fn((req: any, res: any) => res.status(200).send("mec-ok-fr")),
    ajouterQuestionEssai: jest.fn((req: any, res: any) => res.status(200).send("essai-ok-fr")),
  },
}));

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use((req: any, _res: any, next: any) => {
    const authed = req.header("x-test-auth") === "1";
    req.session = authed ? { token: "t" } : {};
    next();
  });

  const router = require("../../src/routes/questionsRoutes").default;
  app.use("/questions", router);
  return app;
};

const makeAppNoSession = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  const router = require("../../src/routes/questionsRoutes").default;
  app.use("/questions", router);
  return app;
};

describe("questionsRoutes", () => {
  const QuestionsController = require("../../src/controllers/QuestionsController").QuestionsController;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("POST /questions/:idGroupe/ajouter-vrai-faux sans auth redirige vers /signin", async () => {
    const app = makeApp();

    const res = await request(app).post("/questions/g-1/ajouter-vrai-faux").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(QuestionsController.ajouterQuestionVraiFaux).not.toHaveBeenCalled();
  });

  test("POST /questions/:idGroupe/ajouter-vrai-faux sans session redirige vers /signin", async () => {
    const app = makeAppNoSession();

    const res = await request(app).post("/questions/g-1/ajouter-vrai-faux").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(QuestionsController.ajouterQuestionVraiFaux).not.toHaveBeenCalled();
  });

  test("POST /questions/:idGroupe/ajouter-choix-multiple sans auth redirige vers /signin", async () => {
    const app = makeApp();

    const res = await request(app).post("/questions/g-1/ajouter-choix-multiple").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(QuestionsController.ajouterQuestionChoixMultiple).not.toHaveBeenCalled();
  });

  test("POST /questions/:idGroupe/ajouter-vrai-faux avec auth appelle le controleur", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/questions/g-1/ajouter-vrai-faux")
      .set("x-test-auth", "1")
      .send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("vrai-faux-ok-fr");
    expect(QuestionsController.ajouterQuestionVraiFaux).toHaveBeenCalledTimes(1);
  });

  test("POST /questions/:idGroupe/ajouter-choix-multiple avec auth appelle le controleur", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/questions/g-1/ajouter-choix-multiple")
      .set("x-test-auth", "1")
      .send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("choix-multiple-ok-fr");
    expect(QuestionsController.ajouterQuestionChoixMultiple).toHaveBeenCalledTimes(1);
  });
});
