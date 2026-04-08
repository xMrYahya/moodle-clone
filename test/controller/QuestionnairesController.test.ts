import { jest } from "@jest/globals";

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  return res;
};

describe("QuestionnairesController", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test("gererQuestionnaires: 400 si idCours ou user manquant", async () => {
    const ctrl = require("../../src/controllers/QuestionnairesController").QuestionnairesController;
    const res = makeRes();

    await ctrl.gererQuestionnaires({ params: {}, session: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("idGroupe ou informations utilisateur manquantes");
  });

  test("gererQuestionnaires: rend la vue avec donnees de base", async () => {
    const coursStore = require("../../src/core/CoursModele");
    const qModule = require("../../src/core/QuestionnaireModele");

    jest.spyOn(coursStore, "obtenirCoursStockeParIdGroupe").mockResolvedValueOnce({
      idGroupe: "g-1",
      activite: "Cours",
      titreCours: "LOG210",
      etudiants: [],
    });
    jest.spyOn(coursStore, "obtenirQuestionsDuCours").mockResolvedValueOnce([{ nom: "Q1", tags: ["tag1"] }]);
    jest.spyOn(qModule.QuestionnaireModele, "obtenirQuestionnairesAssocies").mockResolvedValueOnce([]);
    jest.spyOn(qModule.QuestionnaireModele, "obtenirListeTagsDesQuestions").mockResolvedValueOnce(["tag1"]);
    jest.spyOn(qModule.QuestionnaireModele, "obtenirQuestionsParTag").mockResolvedValueOnce([{ nom: "Q1" }]);

    const ctrl = require("../../src/controllers/QuestionnairesController").QuestionnairesController;
    const res = makeRes();
    const req: any = {
      params: { idCours: "g-1" },
      query: { nomTag: "tag1" },
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };

    await ctrl.gererQuestionnaires(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "questionnaires",
      expect.objectContaining({
        idCours: "g-1",
        coursTitre: "LOG210",
        tags: ["tag1"],
      })
    );
  });

  test("ajouterQuestionnaire: redirect erreur si nom manquant", async () => {
    const ctrl = require("../../src/controllers/QuestionnairesController").QuestionnairesController;
    const res = makeRes();

    await ctrl.ajouterQuestionnaire({ params: { idCours: "g-1" }, body: {}, session: {} }, res);

    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("addQuestionnaire=1"));
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("Nom%20du%20questionnaire%20obligatoire"));
  });

  test("ajouterQuestionnaire: success initialise le temporaire et redirige", async () => {
    const coursStore = require("../../src/core/CoursModele");
    const qModule = require("../../src/core/QuestionnaireModele");

    jest.spyOn(qModule.QuestionnaireModele, "creerQuestionnaire").mockResolvedValueOnce({
      nom: "Quiz 1",
      description: "Desc",
      actif: true,
      questions: [],
      resultatsEtudiants: [],
    });
    jest.spyOn(qModule.QuestionnaireModele, "ajouterQuestionnaire").mockResolvedValueOnce(undefined);
    jest.spyOn(coursStore, "obtenirQuestionsDuCours").mockResolvedValueOnce([{ nom: "Q1" }]);

    const ctrl = require("../../src/controllers/QuestionnairesController").QuestionnairesController;
    const res = makeRes();
    const req: any = {
      params: { idCours: "g-1" },
      body: { nom: "Quiz 1", description: "Desc", actif: "1" },
      session: {},
    };

    await ctrl.ajouterQuestionnaire(req, res);

    expect(req.session.questionnaireTempParCours["g-1"]).toEqual(
      expect.objectContaining({ nomQuestionnaire: "Quiz 1", mode: "ajout" })
    );
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("/cours/g-1/questionnaires?succes="));
  });

  test("sauvegarderQuestionnaire: redirect erreur si aucun temporaire", async () => {
    const ctrl = require("../../src/controllers/QuestionnairesController").QuestionnairesController;
    const res = makeRes();
    const req: any = { params: { idCours: "g-1" }, session: {} };

    await ctrl.sauvegarderQuestionnaire(req, res);

    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("Aucun%20questionnaire%20temporaire"));
  });

  test("confirmerSuppression: redirect succes quand suppression OK", async () => {
    const qModule = require("../../src/core/QuestionnaireModele");
    jest.spyOn(qModule.QuestionnaireModele, "supprimerQuestionnaire").mockResolvedValueOnce(true);

    const ctrl = require("../../src/controllers/QuestionnairesController").QuestionnairesController;
    const res = makeRes();
    const req: any = {
      params: { idCours: "g-1" },
      body: { nomQuestionnaire: "Quiz" },
      session: { questionnaireTempParCours: {} },
    };

    await ctrl.confirmerSuppression(req, res);

    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("succes="));
  });
});
