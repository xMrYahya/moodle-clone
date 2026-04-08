import { jest } from "@jest/globals";

describe("CoursController", () => {
  const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.render = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    delete process.env.SGB_BASE_URL;
    jest.dontMock("../../src/core/sgbClient");
  });

  test("creer: missing teacher or idGroupe -> 400", async () => {
    jest.resetModules();
    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { /* no user */ }, body: {} };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Enseignant ou idGroupe manquant");
  });

  test("creer: schedule not found for this group -> 404", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getEtudiantsParGroupe")
      .mockResolvedValueOnce([]);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 1 }, token: "t" }, body: { idGroupe: "g-1" } };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Horaire introuvable pour ce groupe");
  });

  test("creer: success with direct course match -> ajouterCoursStocke called and redirect", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 1,
      group_id: "g-123",
      day: "Mon",
      hours: "10-11",
      activity: "Lecture",
      mode: "In-person",
      local: "A1",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [{ id: 123, titre: "Cours 123" }] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getEtudiantsParGroupe")
      .mockResolvedValueOnce([]);

    const coursStore = require("../../src/core/CoursModele");
    const ajouterCoursStockeSpy = jest.spyOn(coursStore, "ajouterCoursStocke").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 1 }, token: "t" }, body: { idGroupe: "g-123" } };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    expect(ajouterCoursStockeSpy).toHaveBeenCalledTimes(1);
    const arg = (ajouterCoursStockeSpy.mock.calls[0][0] as any);
    expect(arg.idCours).toBe("123");
    expect(arg.titreCours).toBe("Cours 123");
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("/index?succes="));
  });

  test("creer: success with fallback course match -> ajouterCoursStocke called and redirect", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 2,
      group_id: "g-XYZ",
      day: "Tue",
      hours: "9-10",
      activity: "TP",
      mode: "Online",
      local: "B2",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [{ id: 999, titre: "Cours-XYZ-special" }] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getEtudiantsParGroupe")
      .mockResolvedValueOnce([]);

    const coursStore = require("../../src/core/CoursModele");
    const ajouterCoursStockeSpy = jest.spyOn(coursStore, "ajouterCoursStocke").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 2 }, token: "t" }, body: { idGroupe: "g-XYZ" } };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    expect(ajouterCoursStockeSpy).toHaveBeenCalledTimes(1);
    const arg = (ajouterCoursStockeSpy.mock.calls[0][0] as any);
    expect(arg.idCours).toBe("999");
    expect(arg.titreCours).toBe("Cours-XYZ-special");
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("/index?succes="));
  });

  test("creer: no dash in idGroupe -> idCours undefined and redirect", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 3,
      group_id: "group",
      day: "Wed",
      hours: "8-9",
      activity: "Seminar",
      mode: "Hybrid",
      local: "C3",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getEtudiantsParGroupe")
      .mockResolvedValueOnce([]);

    const coursStore = require("../../src/core/CoursModele");
    const ajouterCoursStockeSpy = jest.spyOn(coursStore, "ajouterCoursStocke").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 3 }, token: "t" }, body: { idGroupe: "group" } };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    expect(ajouterCoursStockeSpy).toHaveBeenCalledTimes(1);
    const arg = (ajouterCoursStockeSpy.mock.calls[0][0] as any);
    expect(arg.idCours).toBeUndefined();
    expect(arg.titreCours).toBeUndefined();
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("/index?succes="));
  });

  test("creer: code present but no course match -> idCours is code", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 5,
      group_id: "g-777",
      day: "Fri",
      hours: "16-17",
      activity: "Workshop",
      mode: "In-person",
      local: "E5",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [{ id: 888, titre: "Other course" }] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getEtudiantsParGroupe")
      .mockResolvedValueOnce([]);

    const coursStore = require("../../src/core/CoursModele");
    const ajouterCoursStockeSpy = jest.spyOn(coursStore, "ajouterCoursStocke").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 5 }, token: "t" }, body: { idGroupe: "g-777" } };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    expect(ajouterCoursStockeSpy).toHaveBeenCalledTimes(1);
    const arg = (ajouterCoursStockeSpy.mock.calls[0][0] as any);
    expect(arg.idCours).toBe("777");
    expect(arg.titreCours).toBeUndefined();
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("/index?succes="));
  });

  test("creer: ajouterCoursStocke throws -> 500 with message", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 4,
      group_id: "g-7",
      day: "Thu",
      hours: "14-15",
      activity: "Lab",
      mode: "In-person",
      local: "D4",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getEtudiantsParGroupe")
      .mockResolvedValueOnce([]);

    const coursStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "ajouterCoursStocke").mockRejectedValueOnce(new Error("store-fail"));

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 4 }, token: "t" }, body: { idGroupe: "g-7" } };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("store-fail");
  });

  test("creer: getSchedules throws undefined -> 500 with fallback message", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockRejectedValueOnce(undefined);
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 6 }, token: "t" }, body: { idGroupe: "g-9" } };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Echec de creation");
  });

  test("creer: associates students and teacher to stored course", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 42,
      group_id: "g-42",
      day: "Mon",
      hours: "10-11",
      activity: "Cours",
      mode: "In-person",
      local: "A1",
    };
    const students = [
      { first_name: "Alice", last_name: "A", email: "a@x.com" },
      { first_name: "Bob", last_name: "B", email: "b@x.com" },
    ];
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getEtudiantsParGroupe")
      .mockResolvedValueOnce(students as any);

    const coursStore = require("../../src/core/CoursModele");
    const ajouterCoursStockeSpy = jest.spyOn(coursStore, "ajouterCoursStocke").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 42 }, token: "t" }, body: { idGroupe: "g-42" } };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    const arg = (ajouterCoursStockeSpy.mock.calls[0][0] as any);
    expect(arg.idEnseignant).toBe("42");
    expect(arg.etudiants).toEqual(students);
  });

  test("creer: ignores schedules from other teachers", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedules = [
      { teacher_id: 99, group_id: "g-1", day: "Mon", hours: "9-10", activity: "X", mode: "", local: "" },
      { teacher_id: 1, group_id: "g-1", day: "Tue", hours: "10-11", activity: "Y", mode: "", local: "" },
    ];
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: schedules });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getEtudiantsParGroupe")
      .mockResolvedValueOnce([]);

    const coursStore = require("../../src/core/CoursModele");
    const ajouterCoursStockeSpy = jest.spyOn(coursStore, "ajouterCoursStocke").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 1 }, token: "t" }, body: { idGroupe: "g-1" } };
    const res = makeRes();

    await CoursController.selectionnerGroupeCours(req, res);

    const arg = (ajouterCoursStockeSpy.mock.calls[0][0] as any);
    expect(arg.idEnseignant).toBe("1");
    expect(arg.activite).toBe("Y");
  });

  test("suppressionCours: missing idGroupe -> redirect to /index", async () => {
    jest.resetModules();
    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { body: {} };
    const res = makeRes();

    await CoursController.suppressionCours(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/index");
  });

  test("suppressionCours: success calls retirerCoursStocke and redirects", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/CoursModele");
    const removeSpy = jest.spyOn(coursStore, "retirerCoursStocke").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { body: { idCours: 55 } };
    const res = makeRes();

    await CoursController.suppressionCours(req, res);

    expect(removeSpy).toHaveBeenCalledWith("55");
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("/index?succes="));
  });

  test("suppressionCours: retirerCoursStocke throws -> 500 with message", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "retirerCoursStocke").mockRejectedValueOnce(new Error("remove-fail"));

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { body: { idCours: "x" } };
    const res = makeRes();

    await CoursController.suppressionCours(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("remove-fail");
  });

  test("suppressionCours: retirerCoursStocke throws undefined -> 500 with fallback message", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "retirerCoursStocke").mockRejectedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { body: { idCours: "y" } };
    const res = makeRes();

    await CoursController.suppressionCours(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Echec de suppression");
  });

  test("afficherDetailsCours: missing idGroupe or teacher -> 400", async () => {
    jest.resetModules();
    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const res = makeRes();

    await CoursController.afficherDetailsCours({ params: {}, session: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("idGroupe ou informations utilisateur manquantes");
  });

  test("afficherDetailsCours: idGroupe present but teacher missing -> 400", async () => {
    jest.resetModules();
    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const res = makeRes();

    await CoursController.afficherDetailsCours({ params: { idGroupe: "g-1" }, session: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("idGroupe ou informations utilisateur manquantes");
  });

  test("afficherDetailsCours: course not found -> 404", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { params: { idCours: "g-1" }, session: { user: { id: 1 } } };
    const res = makeRes();

    await CoursController.afficherDetailsCours(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Cours introuvable");
  });

  test("afficherDetailsCours: success renders with questions and modal flag", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/CoursModele");
    const questionsStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce({
      idGroupe: "g-2",
      activite: "Lab",
      idCours: "C-1",
      titreCours: "Cours 1",
      jour: "Mon",
      heure: "10-11",
      mode: "Online",
      local: "A",
      idEnseignant: "1",
      etudiants: [],
    });
    jest.spyOn(questionsStore, "obtenirQuestionsDuCours").mockResolvedValueOnce([
      { nom: "Q1", type: "VraiFaux" },
    ] as any);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = {
      params: { idCours: "g-2" },
      query: { addQuestion: "1" },
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };
    const res = makeRes();

    await CoursController.afficherDetailsCours(req, res);

    expect(res.render).toHaveBeenCalledWith("questions", expect.objectContaining({
      displayName: "John Doe",
      idGroupe: "g-2",
      coursId: "C-1",
      coursTitre: "Cours 1",
      afficherModalAjoutQuestion: true,
      questions: expect.arrayContaining([
        expect.objectContaining({ nom: "Q1", type: "VraiFaux" }),
      ]),
    }));
  });

  test("afficherDetailsCours: returns all questions for course", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/CoursModele");
    const questionsStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce({
      idGroupe: "g-10",
      activite: "Cours",
      idCours: "C-10",
      titreCours: "Cours 10",
      jour: "Mon",
      heure: "10-11",
      mode: "Online",
      local: "A",
      idEnseignant: "1",
      etudiants: [],
    });
    const questions = [
      { nom: "Q1", type: "VraiFaux" },
      { nom: "Q2", type: "ChoixMultiple" },
    ];
    jest.spyOn(questionsStore, "obtenirQuestionsDuCours").mockResolvedValueOnce(questions as any);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = {
      params: { idCours: "g-10" },
      query: {},
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };
    const res = makeRes();

    await CoursController.afficherDetailsCours(req, res);

    expect(res.render).toHaveBeenCalledWith("questions", expect.objectContaining({
      idGroupe: "g-10",
      questions: expect.arrayContaining([
        expect.objectContaining({ nom: "Q1", type: "VraiFaux" }),
        expect.objectContaining({ nom: "Q2", type: "ChoixMultiple" }),
      ]),
    }));
  });

  test("afficherDetailsCours: course title missing -> uses activity", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/CoursModele");
    const questionsStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce({
      idGroupe: "g-4",
      activite: "ActivityTitle",
      idCours: "C-4",
      titreCours: "",
      jour: "Mon",
      heure: "10-11",
      mode: "Online",
      local: "A",
      idEnseignant: "1",
      etudiants: [],
    });
    jest.spyOn(questionsStore, "obtenirQuestionsDuCours").mockResolvedValueOnce([]);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = {
      params: { idCours: "g-4" },
      query: {},
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };
    const res = makeRes();

    await CoursController.afficherDetailsCours(req, res);

    expect(res.render).toHaveBeenCalledWith("questions", expect.objectContaining({
      coursTitre: "ActivityTitle",
    }));
  });

  test("afficherDetailsCours: questions store throws -> 500 fallback", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/CoursModele");
    const questionsStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce({
      idGroupe: "g-3",
      activite: "Lab",
      idCours: "C-2",
      titreCours: "",
      jour: "Tue",
      heure: "10-11",
      mode: "Online",
      local: "A",
      idEnseignant: "1",
      etudiants: [],
    });
    jest.spyOn(questionsStore, "obtenirQuestionsDuCours").mockRejectedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = {
      params: { idCours: "g-3" },
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };
    const res = makeRes();

    await CoursController.afficherDetailsCours(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Echec du chargement des questions");
  });

  test("afficherDetailsCours: coursStore throws -> 500 with message", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockRejectedValueOnce(new Error("cours-fail"));

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = {
      params: { idCours: "g-5" },
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };
    const res = makeRes();

    await CoursController.afficherDetailsCours(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("cours-fail");
  });
});


