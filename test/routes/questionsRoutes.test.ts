import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

jest.mock("../../src/controllers/QuestionsController", () => ({
  QuestionsController: {
    ajouterQuestionVraiFaux: jest.fn((req: any, res: any) => res.status(200).send("vf-ok")),
    ajouterQuestionAutreType: jest.fn((req: any, res: any) => res.status(200).send("autre-ok")),
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

  test("POST /questions/:groupId/ajouter-vrai-faux without auth redirects to /signin", async () => {
    const app = makeApp();

    const res = await request(app).post("/questions/g-1/ajouter-vrai-faux").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(QuestionsController.ajouterQuestionVraiFaux).not.toHaveBeenCalled();
  });

  test("POST /questions/:groupId/ajouter-vrai-faux with no session redirects to /signin", async () => {
    const app = makeAppNoSession();

    const res = await request(app).post("/questions/g-1/ajouter-vrai-faux").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(QuestionsController.ajouterQuestionVraiFaux).not.toHaveBeenCalled();
  });

  test("POST /questions/:groupId/ajouter-autre-type without auth redirects to /signin", async () => {
    const app = makeApp();

    const res = await request(app).post("/questions/g-1/ajouter-autre-type").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(QuestionsController.ajouterQuestionAutreType).not.toHaveBeenCalled();
  });

  test("POST /questions/:groupId/ajouter-vrai-faux with auth calls controller", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/questions/g-1/ajouter-vrai-faux")
      .set("x-test-auth", "1")
      .send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("vf-ok");
    expect(QuestionsController.ajouterQuestionVraiFaux).toHaveBeenCalledTimes(1);
  });

  test("POST /questions/:groupId/ajouter-autre-type with auth calls controller", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/questions/g-1/ajouter-autre-type")
      .set("x-test-auth", "1")
      .send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("autre-ok");
    expect(QuestionsController.ajouterQuestionAutreType).toHaveBeenCalledTimes(1);
  });
});
