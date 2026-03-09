import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

const loadApp = (routerFactory: () => express.Router) => {
  let app: any;
  jest.isolateModules(() => {
    jest.doMock("morgan", () => () => (_req: any, _res: any, next: any) => next());
    jest.doMock("../src/core/coursStore", () => ({
      viderStoreAuDemarrage: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("../src/core/questionnairesStore", () => ({
      viderQuestionnairesAuDemarrage: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("../src/routes/indexRoutes", () => ({
      __esModule: true,
      default: routerFactory(),
    }));
    jest.doMock("../src/routes/coursRoutes", () => ({
      __esModule: true,
      default: express.Router(),
    }));
    jest.doMock("../src/routes/questionsRoutes", () => ({
      __esModule: true,
      default: express.Router(),
    }));
    jest.doMock("../src/routes/questionnairesRoutes", () => ({
      __esModule: true,
      default: express.Router(),
    }));

    app = require("../src/app").default;
  });
  return app;
};

describe("app", () => {
  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    // Hide Node.js deprecation warnings during tests.
    (process as any).noDeprecation = true;
  });

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
    jest.resetModules();
  });

  test("handleErrors uses statusCode and flashes message", async () => {
    let flashSpy: jest.Mock | undefined;
    const router = express.Router();
    router.get("/boom", (req: any, _res, next) => {
      flashSpy = jest.fn();
      req.flash = flashSpy;
      const err: any = new Error("boom");
      err.statusCode = 418;
      next(err);
    });

    const app = loadApp(() => router);
    const res = await request(app).get("/boom");

    expect(res.status).toBe(418);
    expect(res.body).toEqual({ error: "boom" });
    expect(flashSpy).toHaveBeenCalledWith("error", "boom");
  });

  test("handleErrors uses error.status when provided", async () => {
    const router = express.Router();
    router.get("/unauthorized", (_req, _res, next) => {
      const err: any = new Error("nope");
      err.status = 401;
      next(err);
    });

    const app = loadApp(() => router);
    const res = await request(app).get("/unauthorized");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "nope" });
  });

  test("handleErrors defaults to 500", async () => {
    const router = express.Router();
    router.get("/fail", (_req, _res, next) => {
      next(new Error("fail"));
    });

    const app = loadApp(() => router);
    const res = await request(app).get("/fail");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "fail" });
  });

  test("handleErrors: flash throws and error has no message -> still returns 500", async () => {
    const router = express.Router();
    router.get("/flash-throws", (req: any, _res, next) => {
      req.flash = () => {
        throw new Error("flash-fail");
      };
      next("plain-error");
    });

    const app = loadApp(() => router);
    const res = await request(app).get("/flash-throws");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "plain-error" });
  });

  test("handleErrors: nullish error still returns 500 with 'undefined' message", () => {
    const app = loadApp(() => express.Router());
    const layer = (app as any)._router.stack.find((l: any) => l?.handle?.length === 4);
    expect(layer).toBeTruthy();

    const req: any = {};
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    layer.handle(undefined, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "undefined" });
  });

  test("handleErrors: error object without message uses String(error)", () => {
    const app = loadApp(() => express.Router());
    const layer = (app as any)._router.stack.find((l: any) => l?.handle?.length === 4);
    expect(layer).toBeTruthy();

    const req: any = { flash: jest.fn() };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    layer.handle({ message: undefined }, req, res, jest.fn());

    expect(req.flash).toHaveBeenCalledWith("error", "[object Object]");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "[object Object]" });
  });

  test("handleErrors: undefined error with flash uses String(error)", () => {
    const app = loadApp(() => express.Router());
    const layer = (app as any)._router.stack.find((l: any) => l?.handle?.length === 4);
    expect(layer).toBeTruthy();

    const req: any = { flash: jest.fn() };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    layer.handle(undefined, req, res, jest.fn());

    expect(req.flash).toHaveBeenCalledWith("error", "undefined");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "undefined" });
  });
});
