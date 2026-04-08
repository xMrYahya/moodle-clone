import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

jest.mock("../../src/controllers/QuestionnairesController", () => ({
  QuestionnairesController: {
    gererQuestionnaires: jest.fn((req: any, res: any) => res.status(200).send("gerer-ok")),
    ajouterQuestionnaire: jest.fn((req: any, res: any) => res.status(200).send("ajouter-ok")),
    selectionnerTag: jest.fn((req: any, res: any) => res.status(200).send("tag-ok")),
    ajouterQuestion: jest.fn((req: any, res: any) => res.status(200).send("ajouter-question-ok")),
    selectionModifierQuestionnaire: jest.fn((req: any, res: any) => res.status(200).send("selection-modifier-ok")),
    retirerQuestion: jest.fn((req: any, res: any) => res.status(200).send("retirer-question-ok")),
    modifierOrdreQuestion: jest.fn((req: any, res: any) => res.status(200).send("ordre-ok")),
    modifierQuestionnaire: jest.fn((req: any, res: any) => res.status(200).send("modifier-ok")),
    verifierSupprimerQuestionnaire: jest.fn((req: any, res: any) => res.status(200).send("verifier-ok")),
    confirmerSuppression: jest.fn((req: any, res: any) => res.status(200).send("confirmer-ok")),
    sauvegarderQuestionnaire: jest.fn((req: any, res: any) => res.status(200).send("sauvegarder-ok")),
  },
}));

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use((req: any, _res: any, next: any) => {
    req.session = req.header("x-test-auth") === "1" ? { token: "t" } : {};
    next();
  });
  const router = require("../../src/routes/questionnairesRoutes").default;
  app.use("/cours", router);
  return app;
};

describe("questionnairesRoutes", () => {
  const ctrl = require("../../src/controllers/QuestionnairesController").QuestionnairesController;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GET /cours/:id/questionnaires sans auth -> redirection", async () => {
    const app = makeApp();
    const res = await request(app).get("/cours/g-1/questionnaires");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(ctrl.gererQuestionnaires).not.toHaveBeenCalled();
  });

  test("GET /cours/:id/questionnaires avec auth -> controleur", async () => {
    const app = makeApp();
    const res = await request(app).get("/cours/g-1/questionnaires").set("x-test-auth", "1");
    expect(res.status).toBe(200);
    expect(ctrl.gererQuestionnaires).toHaveBeenCalledTimes(1);
  });

  test("POST /cours/:id/questionnaires/ajouter avec auth -> controleur", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/cours/g-1/questionnaires/ajouter")
      .set("x-test-auth", "1")
      .send({ nom: "Quiz" });
    expect(res.status).toBe(200);
    expect(ctrl.ajouterQuestionnaire).toHaveBeenCalledTimes(1);
  });

  test("POST /cours/:id/questionnaires/sauvegarder avec auth -> controleur", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/cours/g-1/questionnaires/sauvegarder")
      .set("x-test-auth", "1")
      .send({});
    expect(res.status).toBe(200);
    expect(ctrl.sauvegarderQuestionnaire).toHaveBeenCalledTimes(1);
  });

  test("POST /cours/:id/questionnaires/confirmer-suppression avec auth -> controleur", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/cours/g-1/questionnaires/confirmer-suppression")
      .set("x-test-auth", "1")
      .send({ nomQuestionnaire: "Quiz" });
    expect(res.status).toBe(200);
    expect(ctrl.confirmerSuppression).toHaveBeenCalledTimes(1);
  });
});
