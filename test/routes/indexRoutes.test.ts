import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

jest.mock("../../src/controllers/AuthController", () => ({
  AuthController: {
    getSignin: jest.fn((req: any, res: any) => res.status(200).send("get-signin-ok")),
    postSignin: jest.fn((req: any, res: any) => res.status(200).send("post-signin-ok")),
    signout: jest.fn((req: any, res: any) => res.status(200).send("signout-ok")),
  },
}));

jest.mock("../../src/controllers/HomeController", () => ({
  HomeController: {
    index: jest.fn((req: any, res: any) => res.status(200).send("home-index-ok")),
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

  const router = require("../../src/routes/indexRoutes").default;
  app.use("/", router);
  return app;
};

const makeAppNoSession = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  const router = require("../../src/routes/indexRoutes").default;
  app.use("/", router);
  return app;
};

describe("indexRoutes", () => {
  const AuthController = require("../../src/controllers/AuthController").AuthController;
  const HomeController = require("../../src/controllers/HomeController").HomeController;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GET / redirects to /signin", async () => {
    const app = makeApp();

    const res = await request(app).get("/");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
  });

  test("GET /signin calls AuthController.getSignin", async () => {
    const app = makeApp();

    const res = await request(app).get("/signin");

    expect(res.status).toBe(200);
    expect(res.text).toBe("get-signin-ok");
    expect(AuthController.getSignin).toHaveBeenCalledTimes(1);
  });

  test("POST /signin calls AuthController.postSignin", async () => {
    const app = makeApp();

    const res = await request(app).post("/signin").send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("post-signin-ok");
    expect(AuthController.postSignin).toHaveBeenCalledTimes(1);
  });

  test("GET /signout calls AuthController.signout", async () => {
    const app = makeApp();

    const res = await request(app).get("/signout");

    expect(res.status).toBe(200);
    expect(res.text).toBe("signout-ok");
    expect(AuthController.signout).toHaveBeenCalledTimes(1);
  });

  test("GET /index without auth redirects to /signin", async () => {
    const app = makeApp();

    const res = await request(app).get("/index");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(HomeController.index).not.toHaveBeenCalled();
  });

  test("GET /index with no session redirects to /signin", async () => {
    const app = makeAppNoSession();

    const res = await request(app).get("/index");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(HomeController.index).not.toHaveBeenCalled();
  });

  test("GET /index with auth calls HomeController.index", async () => {
    const app = makeApp();

    const res = await request(app).get("/index").set("x-test-auth", "1");

    expect(res.status).toBe(200);
    expect(res.text).toBe("home-index-ok");
    expect(HomeController.index).toHaveBeenCalledTimes(1);
  });
});
