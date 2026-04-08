import { jest } from "@jest/globals";

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  return res;
};

describe("EtudiantQuestionnairesController", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test("afficherQuestionnairesCours: redirige vers signin si non authentifie", async () => {
    const ctrl = require("../../src/controllers/EtudiantQuestionnairesController").EtudiantQuestionnairesController;
    const res = makeRes();

    await ctrl.afficherQuestionnairesCours({ params: { idCours: "g-1" }, session: {} }, res);

    expect(res.redirect).toHaveBeenCalledWith("/signin");
  });

  test("afficherQuestionnairesCours: 404 si cours introuvable", async () => {
    const coursStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce(undefined);

    const ctrl = require("../../src/controllers/EtudiantQuestionnairesController").EtudiantQuestionnairesController;
    const res = makeRes();
    const req: any = {
      params: { idCours: "g-1" },
      session: { token: "t", role: "student", user: { id: "s1", first_name: "A", last_name: "B" } },
    };

    await ctrl.afficherQuestionnairesCours(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Cours introuvable");
  });

  test("afficherQuestionnairesCours: 403 si etudiant non inscrit", async () => {
    const coursStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce({ idGroupe: "g-1", etudiants: [] });

    const ctrl = require("../../src/controllers/EtudiantQuestionnairesController").EtudiantQuestionnairesController;
    const res = makeRes();
    const req: any = {
      params: { idCours: "g-1" },
      session: { token: "t", role: "student", user: { id: "s1", first_name: "A", last_name: "B" } },
    };

    await ctrl.afficherQuestionnairesCours(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("demarrerQuestionnaire: success cree tentative et redirige", async () => {
    const coursStore = require("../../src/core/CoursModele");
    const qModule = require("../../src/core/QuestionnaireModele");

    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce({
      idGroupe: "g-1",
      etudiants: [{ email: "s1" }],
    });
    jest.spyOn(qModule.QuestionnaireModele, "obtenirQuestionnairesAssocies").mockResolvedValueOnce([
      { nom: "Quiz", actif: true, questions: ["Q1"], resultatsEtudiants: [] },
    ]);
    jest.spyOn(coursStore, "obtenirQuestionsDuCours").mockResolvedValueOnce([
      { nom: "Q1", enonce: "2+2?", reponseAttendue: 4, retroactionValide: "ok", retroactionInvalide: "no" },
    ]);

    const ctrl = require("../../src/controllers/EtudiantQuestionnairesController").EtudiantQuestionnairesController;
    const res = makeRes();
    const req: any = {
      params: { idCours: "g-1" },
      body: { nomQuestionnaire: "Quiz" },
      session: { token: "t", role: "student", user: { id: "s1", first_name: "A", last_name: "B" } },
    };

    await ctrl.demarrerQuestionnaire(req, res);

    expect(req.session.tentativeQuestionnaire).toBeDefined();
    expect(res.redirect).toHaveBeenCalledWith("/cours/g-1/questionnaires/etudiant/passer");
  });

  test("repondreQuestion: reponse invalide redirige avec erreur", async () => {
    const ctrl = require("../../src/controllers/EtudiantQuestionnairesController").EtudiantQuestionnairesController;
    const res = makeRes();
    const req: any = {
      params: { idCours: "g-1" },
      body: { reponse: "" },
      session: {
        token: "t",
        role: "student",
        user: { id: "s1", first_name: "A", last_name: "B" },
        tentativeQuestionnaire: {
          idGroupe: "g-1",
          nomQuestionnaire: "Quiz",
          etudiantId: "s1",
          typeId: 1,
          contientCorrectionManuelle: false,
          indexQuestionCourante: 0,
          questions: [
            {
              nom: "Q1",
              enonce: "VF",
              type: "VraiFaux",
              retroactionValide: "ok",
              retroactionInvalide: "no",
              donnees: { type: "VraiFaux", bonneReponse: true },
            },
          ],
          reponses: [],
        },
      },
    };

    await ctrl.repondreQuestion(req, res);

    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("erreur="));
  });

  test("afficherResultat: rend la vue si resultat en session", async () => {
    const coursStore = require("../../src/core/CoursModele");
    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce({ idGroupe: "g-1" });

    const ctrl = require("../../src/controllers/EtudiantQuestionnairesController").EtudiantQuestionnairesController;
    const res = makeRes();
    const req: any = {
      params: { idCours: "g-1" },
      session: {
        token: "t",
        role: "student",
        user: { id: "s1", first_name: "A", last_name: "B" },
        resultatQuestionnaire: {
          idGroupe: "g-1",
          nomQuestionnaire: "Quiz",
          notePourcentage: 100,
          detailsCorrection: [],
          statutGlobal: "corrige_automatiquement",
          contientCorrectionManuelle: false,
          noteTransmiseSgb: true,
          messageErreurSgb: "",
        },
      },
    };

    await ctrl.afficherResultat(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "resultat-questionnaire",
      expect.objectContaining({ idCours: "g-1" })
    );
  });
});
