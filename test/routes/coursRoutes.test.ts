import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

jest.mock("../../src/controllers/CoursController", () => ({
  CoursController: {
    creer: jest.fn((req: any, res: any) => res.status(200).send("creer-ok")),
    supprimer: jest.fn((req: any, res: any) => res.status(200).send("supprimer-ok")),
    afficherQuestions: jest.fn((req: any, res: any) => res.status(200).send("questions-ok")),
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

  const router = require("../../src/routes/coursRoutes").default;
  app.use("/cours", router);
  return app;
};

const makeAppNoSession = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  const router = require("../../src/routes/coursRoutes").default;
  app.use("/cours", router);
  return app;
};

describe("coursRoutes", () => {
  const CoursController = require("../../src/controllers/CoursController").CoursController;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("POST /cours/creer without auth redirects to /signin", async () => {
    const app = makeApp();

    const res = await request(app).post("/cours/creer").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(CoursController.creer).not.toHaveBeenCalled();
  });

  test("POST /cours/supprimer without auth redirects to /signin", async () => {
    const app = makeApp();

    const res = await request(app).post("/cours/supprimer").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(CoursController.supprimer).not.toHaveBeenCalled();
  });

  test("POST /cours/creer with no session redirects to /signin", async () => {
    const app = makeAppNoSession();

    const res = await request(app).post("/cours/creer").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(CoursController.creer).not.toHaveBeenCalled();
  });

  test("POST /cours/creer with auth calls controller", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/cours/creer")
      .set("x-test-auth", "1")
      .send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("creer-ok");
    expect(CoursController.creer).toHaveBeenCalledTimes(1);
  });

  test("GET /cours/:groupId/questions without auth redirects to /signin", async () => {
    const app = makeApp();

    const res = await request(app).get("/cours/g-1/questions");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(CoursController.afficherQuestions).not.toHaveBeenCalled();
  });

  test("GET /cours/:groupId/questions with auth calls controller", async () => {
    const app = makeApp();

    const res = await request(app)
      .get("/cours/g-1/questions")
      .set("x-test-auth", "1");

    expect(res.status).toBe(200);
    expect(res.text).toBe("questions-ok");
    expect(CoursController.afficherQuestions).toHaveBeenCalledTimes(1);
  });

  test("POST /cours/supprimer with auth calls controller", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/cours/supprimer")
      .set("x-test-auth", "1")
      .send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("supprimer-ok");
    expect(CoursController.supprimer).toHaveBeenCalledTimes(1);
  });
});
