import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

jest.mock("../../src/controllers/CoursController", () => ({
  CoursController: {
    selectionnerGroupeCours: jest.fn((req: any, res: any) => res.status(200).send("selection-reussie-fr")),
    retirerCours: jest.fn((req: any, res: any) => res.status(200).send("retrait-reussi-fr")),
    confirmerSuppressionCours: jest.fn((req: any, res: any) => res.status(200).send("confirmation-reussie-fr")),
    suppressionCours: jest.fn((req: any, res: any) => res.status(200).send("suppression-reussie-fr")),
    afficherDetailsCours: jest.fn((req: any, res: any) => res.status(200).send("details-reussis-fr")),
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

  test("POST /cours/selectionner-groupe-cours sans auth redirige vers /signin", async () => {
    const app = makeApp();

    const res = await request(app).post("/cours/selectionner-groupe-cours").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(CoursController.selectionnerGroupeCours).not.toHaveBeenCalled();
  });

  test("POST /cours/suppression-cours sans auth redirige vers /signin", async () => {
    const app = makeApp();

    const res = await request(app).post("/cours/suppression-cours").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(CoursController.suppressionCours).not.toHaveBeenCalled();
  });

  test("GET /cours/retirer-cours sans auth redirige vers /signin", async () => {
    const app = makeApp();

    const res = await request(app).get("/cours/retirer-cours?idGroupe=g-1");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(CoursController.retirerCours).not.toHaveBeenCalled();
  });

  test("POST /cours/selectionner-groupe-cours sans session redirige vers /signin", async () => {
    const app = makeAppNoSession();

    const res = await request(app).post("/cours/selectionner-groupe-cours").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(CoursController.selectionnerGroupeCours).not.toHaveBeenCalled();
  });

  test("POST /cours/selectionner-groupe-cours avec auth appelle le controleur", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/cours/selectionner-groupe-cours")
      .set("x-test-auth", "1")
      .send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("selection-reussie-fr");
    expect(CoursController.selectionnerGroupeCours).toHaveBeenCalledTimes(1);
  });

  test("GET /cours/:idGroupe/details-cours sans auth redirige vers /signin", async () => {
    const app = makeApp();

    const res = await request(app).get("/cours/g-1/details-cours");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signin");
    expect(CoursController.afficherDetailsCours).not.toHaveBeenCalled();
  });

  test("GET /cours/:idGroupe/details-cours avec auth appelle le controleur", async () => {
    const app = makeApp();

    const res = await request(app)
      .get("/cours/g-1/details-cours")
      .set("x-test-auth", "1");

    expect(res.status).toBe(200);
    expect(res.text).toBe("details-reussis-fr");
    expect(CoursController.afficherDetailsCours).toHaveBeenCalledTimes(1);
  });

  test("POST /cours/suppression-cours avec auth appelle le controleur", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/cours/suppression-cours")
      .set("x-test-auth", "1")
      .send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("suppression-reussie-fr");
    expect(CoursController.suppressionCours).toHaveBeenCalledTimes(1);
  });

  test("GET /cours/retirer-cours avec auth appelle le controleur", async () => {
    const app = makeApp();

    const res = await request(app)
      .get("/cours/retirer-cours?idGroupe=g-1")
      .set("x-test-auth", "1");

    expect(res.status).toBe(200);
    expect(res.text).toBe("retrait-reussi-fr");
    expect(CoursController.retirerCours).toHaveBeenCalledTimes(1);
  });
});


