import type { Response } from "express";

function makeRes() {
  const res: Partial<Response> & {
    redirect: jest.Mock;
    render: jest.Mock;
    status: jest.Mock;
    json: jest.Mock;
  } = {
    redirect: jest.fn(),
    render: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };

  // chain: res.status(200).json(...)
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res as unknown as Response & {
    redirect: jest.Mock;
    render: jest.Mock;
    status: jest.Mock;
    json: jest.Mock;
  };
}

describe("AuthController (100% coverage)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.SGB_BASE_URL;
  });

  /**
   * Helper qui:
   * - mock le module SgbClient
   * - importe ton AuthController (ce qui crée l'instance sgbClient)
   * - te retourne { AuthController, SgbClientMock, loginTeacherMock }
   */
  function loadControllerWithMockedSgbClient() {
    const loginTeacherMock = jest.fn();

    const SgbClientMock = jest.fn().mockImplementation((_baseUrl: string) => {
      return { loginTeacher: loginTeacherMock };
    });

    jest.doMock("../../src/core/sgbClient", () => ({
      SgbClient: SgbClientMock,
    }));

    // ⬇️ Ajuste ce path selon où est ton AuthController
    // ex: "../controllers/AuthController"
    const mod = require("../../src/controllers/AuthController");

    return {
      AuthController: mod.AuthController as typeof import("../../src/controllers/AuthController").AuthController,
      SgbClientMock,
      loginTeacherMock,
    };
  }

  test("module init: utilise fallback URL quand SGB_BASE_URL est undefined", () => {
    // env non défini => fallback
    const { SgbClientMock } = loadControllerWithMockedSgbClient();

    expect(SgbClientMock).toHaveBeenCalledTimes(1);
    expect(SgbClientMock).toHaveBeenCalledWith("http://localhost:3200");
  });

  test("module init: utilise process.env.SGB_BASE_URL quand défini", () => {
    process.env.SGB_BASE_URL = "http://example:9999";

    const { SgbClientMock } = loadControllerWithMockedSgbClient();

    expect(SgbClientMock).toHaveBeenCalledTimes(1);
    expect(SgbClientMock).toHaveBeenCalledWith("http://example:9999");
  });

  test("getSignin: si token déjà présent => redirect /index", () => {
    const { AuthController } = loadControllerWithMockedSgbClient();

    const req: any = { session: { token: "abc" } };
    const res = makeRes();

    AuthController.getSignin(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/index");
    expect(res.render).not.toHaveBeenCalled();
  });

  test("getSignin: si pas de token => render signin", () => {
    const { AuthController } = loadControllerWithMockedSgbClient();

    const req: any = { session: {} };
    const res = makeRes();

    AuthController.getSignin(req, res);

    expect(res.render).toHaveBeenCalledWith("signin", { title: "Moodle" });
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test("postSignin: succès => set session + 200 {ok:true}", async () => {
    const { AuthController, loginTeacherMock } = loadControllerWithMockedSgbClient();

    loginTeacherMock.mockResolvedValue({
      token: "t123",
      user: { id: 1, name: "Teacher" },
    });

    const req: any = {
      body: { email: "a@a.com", password: "pw" },
      session: {}, // important car le code assigne req.session.token etc.
    };
    const res = makeRes();

    await AuthController.postSignin(req, res);

    expect(loginTeacherMock).toHaveBeenCalledWith("a@a.com", "pw");

    expect(req.session.token).toBe("t123");
    expect(req.session.user).toEqual({ id: 1, name: "Teacher" });
    expect(req.session.email).toBe("a@a.com");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  test("postSignin: erreur avec message => 401 + message", async () => {
    const { AuthController, loginTeacherMock } = loadControllerWithMockedSgbClient();

    loginTeacherMock.mockRejectedValue(new Error("Bad credentials"));

    const req: any = {
      body: { email: "a@a.com", password: "wrong" },
      session: {},
    };
    const res = makeRes();

    await AuthController.postSignin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: "Bad credentials" });
  });

  test("postSignin: erreur sans message => 401 + 'Login failed'", async () => {
    const { AuthController, loginTeacherMock } = loadControllerWithMockedSgbClient();

    // e?.message undefined => fallback "Login failed"
    loginTeacherMock.mockRejectedValue({});

    const req: any = {
      body: { email: "a@a.com", password: "wrong" },
      session: {},
    };
    const res = makeRes();

    await AuthController.postSignin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: "Login failed" });
  });

  test("signout: destroy session => redirect /", () => {
    const { AuthController } = loadControllerWithMockedSgbClient();

    const res = makeRes();

    const destroyMock = jest.fn((cb: () => void) => cb());

    const req: any = {
      session: {
        destroy: destroyMock,
      },
    };

    AuthController.signout(req, res);

    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/");
  });
});
