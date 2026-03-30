import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

jest.mock("../../src/controllers/EtudiantQuestionnairesController", () => ({
  EtudiantQuestionnairesController: {
    afficherQuestionnairesCours: jest.fn((req: any, res: any) => res.status(200).send("liste-ok")),
    demarrerQuestionnaire: jest.fn((req: any, res: any) => res.status(200).send("demarrer-ok")),
    afficherQuestionCourante: jest.fn((req: any, res: any) => res.status(200).send("passer-ok")),
    repondreQuestion: jest.fn((req: any, res: any) => res.status(200).send("repondre-ok")),
    afficherResultat: jest.fn((req: any, res: any) => res.status(200).send("resultat-ok")),
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
  const router = require("../../src/routes/etudiantQuestionnairesRoutes").default;
  app.use("/cours", router);
  return app;
};

describe("etudiantQuestionnairesRoutes", () => {
  const ctrl = require("../../src/controllers/EtudiantQuestionnairesController").EtudiantQuestionnairesController;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GET /cours/:id/questionnaires/etudiant sans auth -> redirection", async () => {
    const app = makeApp();
    const res = await request(app).get("/cours/g-1/questionnaires/etudiant");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(ctrl.afficherQuestionnairesCours).not.toHaveBeenCalled();
  });

  test("GET /cours/:id/questionnaires/etudiant avec auth -> controleur", async () => {
    const app = makeApp();
    const res = await request(app).get("/cours/g-1/questionnaires/etudiant").set("x-test-auth", "1");
    expect(res.status).toBe(200);
    expect(ctrl.afficherQuestionnairesCours).toHaveBeenCalledTimes(1);
  });

  test("POST /cours/:id/questionnaires/etudiant/demarrer avec auth -> controleur", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/cours/g-1/questionnaires/etudiant/demarrer")
      .set("x-test-auth", "1")
      .send({ nomQuestionnaire: "Quiz" });
    expect(res.status).toBe(200);
    expect(ctrl.demarrerQuestionnaire).toHaveBeenCalledTimes(1);
  });

  test("POST /cours/:id/questionnaires/etudiant/repondre avec auth -> controleur", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/cours/g-1/questionnaires/etudiant/repondre")
      .set("x-test-auth", "1")
      .send({ reponse: "true" });
    expect(res.status).toBe(200);
    expect(ctrl.repondreQuestion).toHaveBeenCalledTimes(1);
  });

  test("GET /cours/:id/questionnaires/etudiant/resultat avec auth -> controleur", async () => {
    const app = makeApp();
    const res = await request(app).get("/cours/g-1/questionnaires/etudiant/resultat").set("x-test-auth", "1");
    expect(res.status).toBe(200);
    expect(ctrl.afficherResultat).toHaveBeenCalledTimes(1);
  });
});
