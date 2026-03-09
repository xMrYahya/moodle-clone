import request from "supertest";
import express, { Express } from "express";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const createMockApp = (QuestionsController: any): Express => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req: any, _res, next) => {
    req.session = {
      token: "mock-token",
      user: {
        id: "teacher1",
        first_name: "John",
        last_name: "Doe",
      },
    };
    next();
  });

  app.post("/:idGroupe/ajouter-vrai-faux", QuestionsController.ajouterQuestionVraiFaux);
  app.post("/:idGroupe/ajouter-choix-multiple", QuestionsController.ajouterQuestionChoixMultiple);
  app.post("/:idGroupe/ajouter-numerique", QuestionsController.ajouterQuestionNumerique);
  app.post("/:idGroupe/ajouter-reponse-courte", QuestionsController.ajouterQuestionReponseCourte);
  app.post("/:idGroupe/ajouter-mise-en-correspondance", QuestionsController.ajouterQuestionMiseEnCorrespondance);
  app.post("/:idGroupe/ajouter-essai", QuestionsController.ajouterQuestionEssai);
  app.get("/:idGroupe/questions", QuestionsController.consulterQuestionsCours);
  app.get("/:idGroupe/questions/:nom", QuestionsController.selectionnerQuestion);
  app.post("/:idGroupe/questions/:nom/modifier", QuestionsController.modifierQuestion);
  app.get("/:idGroupe/questions/:nom/suppression", QuestionsController.supprimerQuestion);
  app.post("/:idGroupe/questions/:nom/suppression", QuestionsController.confirmerSuppressionQuestion);

  return app;
};

describe("QuestionsController - CU02", () => {
  let app: Express;
  let tmpDir: string;
  let QuestionsController: any;
  let coursStore: any;

  beforeEach(async () => {
    jest.resetModules();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "questionscontroller-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    QuestionsController = require("../../src/controllers/QuestionsController").QuestionsController;
    coursStore = require("../../src/core/coursStore");
    app = createMockApp(QuestionsController);
    await coursStore.viderStoreAuDemarrage();
    await coursStore.ajouterCoursStocke({
      idGroupe: "LOG210-A01",
      jour: "Lun",
      heure: "10:00",
      activite: "Cours",
      mode: "Presentiel",
      local: "A-101",
      idEnseignant: "teacher1",
      etudiants: [],
      questions: [],
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    jest.dontMock("../../src/core/coursStore");
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test("CU02b-API-t1 : Consulter les questions du cours", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q-liste",
        enonce: "Question liste",
        reponse: true,
        tags: ["tag-liste"],
      });

    const response = await request(app).get("/LOG210-A01/questions");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.questions)).toBe(true);
    expect(response.body.questions).toEqual(
      expect.arrayContaining([expect.objectContaining({ nom: "Q-liste" })])
    );
  });

  test("CU02a-API-t1 : Ajouter une question vrai/faux avec succes", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q1",
        enonce: "TypeScript est un langage?",
        reponse: true,
        retroactionValide: "Correct!",
        retroactionInvalide: "Incorrect!",
        tags: ["typescript"],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.question.nom).toBe("Q1");
    expect(response.body.question.type).toBe("VraiFaux");
  });

  test("CU02a-API-t2 : Rejeter si champ obligatoire manquant", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q1",
        reponse: true,
        retroactionValide: "OK",
        retroactionInvalide: "Non",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Champs manquants");
  });

  test("CU02a-API-t3 : Rejeter les doublons (409 Conflict)", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q1",
        enonce: "Question 1",
        reponse: true,
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: ["tag"],
      });

    const response = await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q1",
        enonce: "Question differente",
        reponse: false,
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: ["tag"],
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain("existe");
  });

  test("CU02a-Autre-t1 : Ajouter une question choix multiple", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-choix-multiple")
      .send({
        nom: "QCM1",
        enonce: "Quelle est la reponse?",
        seulementUnChoix: true,
        reponses: [
          { texte: "A", estBonneReponse: true, retroaction: "Correct" },
          { texte: "B", estBonneReponse: false, retroaction: "Incorrect" },
        ],
        retroactionValide: "Bien!",
        retroactionInvalide: "Essaye encore",
        tags: ["science"],
      });

    expect(response.status).toBe(201);
    expect(response.body.question.type).toBe("ChoixMultiple");
    expect(response.body.question.seulementUnChoix).toBe(true);
  });

  test("CU02a-CM-t2 : Rejeter choix multiple sans reponses", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-choix-multiple")
      .send({
        nom: "QCM-sans-reponses",
        enonce: "Aucune reponse",
        seulementUnChoix: true,
        tags: ["science"],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("reponses");
  });

  test("CU02a-Autre-t2 : Ajouter une question numerique", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-numerique")
      .send({
        nom: "QN1",
        enonce: "2 + 2 = ?",
        reponse: "4",
        retroactionValide: "Bravo",
        retroactionInvalide: "Faux",
        tags: ["math"],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.question.type).toBe("Numerique");
    expect(response.body.question.reponseAttendue).toBe(4);
  });

  test("CU02a-Numerique-t2 : Rejeter question numerique invalide", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-numerique")
      .send({
        nom: "QN-invalid",
        enonce: "Nombre invalide",
        reponse: "abc",
        tags: ["math"],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("reponse");
  });

  test("CU02a-RC-t1 : Ajouter une question reponse courte", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-reponse-courte")
      .send({
        nom: "QRC1",
        enonce: "Capitale du Quebec?",
        reponse: "Quebec",
        retroactionValide: "Bon",
        retroactionInvalide: "Non",
        tags: ["geo"],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.question.type).toBe("ReponseCourte");
    expect(response.body.question.reponseAttendue).toBe("Quebec");
  });

  test("CU02a-RC-t2 : Rejeter une reponse courte sans reponse", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-reponse-courte")
      .send({
        nom: "QRC-sans-reponse",
        enonce: "Question sans reponse",
        tags: ["geo"],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("reponse");
  });

  test("CU02a-MEC-t1 : Ajouter une question mise en correspondance", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-mise-en-correspondance")
      .send({
        nom: "QMEC1",
        enonce: "Associer les pays et capitales",
        paires: [
          { question: "France", reponse: "Paris" },
          { question: "Japon", reponse: "Tokyo" },
        ],
        retroactionValide: "Bon",
        retroactionInvalide: "Non",
        tags: ["geo"],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.question.type).toBe("MiseEnCorrespondance");
    expect(response.body.question.paires).toHaveLength(2);
  });

  test("CU02a-MEC-t2 : Rejeter MEC sans paires", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-mise-en-correspondance")
      .send({
        nom: "QMEC-sans-paires",
        enonce: "Question sans paires",
        tags: ["geo"],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("paires");
  });

  test("CU02a-Essai-t1 : Ajouter une question essai", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-essai")
      .send({
        nom: "QESSAI1",
        enonce: "Expliquez SOLID.",
        retroactionValide: "Merci",
        retroactionInvalide: "",
        tags: ["design"],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.question.type).toBe("Essai");
  });

  test("CU02a-Autre-t3 : Rejeter si tags manquants", async () => {
    const response = await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "QSansTags",
        enonce: "Question sans tags",
        reponse: true,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("tags");
  });

  test("CU02b-API-t2 : Selectionner une question existante", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q-select",
        enonce: "Question selection",
        reponse: true,
        tags: ["s"],
      });

    const response = await request(app).get("/LOG210-A01/questions/Q-select");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.question.nom).toBe("Q-select");
  });

  test("CU02b-API-t3 : Rejeter une question introuvable", async () => {
    const response = await request(app).get("/LOG210-A01/questions/inexistante");

    expect(response.status).toBe(404);
    expect(response.body.error).toContain("introuvable");
  });

  test("CU02c-API-t1 : Modifier une question vrai/faux", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q-modif",
        enonce: "Avant",
        reponse: true,
        tags: ["old"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/Q-modif/modifier")
      .send({
        nom: "Q-modif",
        enonce: "Apres",
        reponse: false,
        tags: ["new"],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.question.nom).toBe("Q-modif");
    expect(response.body.question.enonce).toBe("Apres");
    expect(response.body.question.reponse).toBe(false);
  });

  test("CU02c-API-t2 : Rejeter modification si nom deja utilise (409)", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q-A",
        enonce: "A",
        reponse: true,
        tags: ["a"],
      });

    await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q-B",
        enonce: "B",
        reponse: false,
        tags: ["b"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/Q-B/modifier")
      .send({
        nom: "Q-A",
        enonce: "B modifie",
        reponse: false,
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain("existe");
  });

  test("CU02c-API-t3 : Rejeter une valeur numerique invalide (400)", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-numerique")
      .send({
        nom: "QN-modif",
        enonce: "Combien?",
        reponse: "10",
        tags: ["n"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QN-modif/modifier")
      .send({
        type: "Numerique",
        nom: "QN-modif",
        enonce: "Combien?",
        reponse: "abc",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("numérique");
  });

  test("CU02c-CM-t1 : Modifier une question choix multiple", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-choix-multiple")
      .send({
        nom: "QCM-modif",
        enonce: "Avant CM",
        seulementUnChoix: true,
        reponses: [
          { texte: "A", estBonneReponse: true, retroaction: "ok" },
          { texte: "B", estBonneReponse: false, retroaction: "non" },
        ],
        tags: ["cm"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QCM-modif/modifier")
      .send({
        type: "ChoixMultiple",
        nom: "QCM-modif",
        enonce: "Apres CM",
        seulementUnChoix: false,
        reponses: [
          { texte: "A", estBonneReponse: true, retroaction: "ok" },
          { texte: "C", estBonneReponse: true, retroaction: "ok" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.question.type).toBe("ChoixMultiple");
    expect(response.body.question.enonce).toBe("Apres CM");
  });

  test("CU02c-CM-t2 : Rejeter modification choix multiple sans reponses", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-choix-multiple")
      .send({
        nom: "QCM-modif-err",
        enonce: "Avant CM",
        seulementUnChoix: true,
        reponses: [{ texte: "A", estBonneReponse: true, retroaction: "ok" }],
        tags: ["cm"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QCM-modif-err/modifier")
      .send({
        type: "ChoixMultiple",
        nom: "QCM-modif-err",
        enonce: "Apres CM",
        reponses: [],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("reponses");
  });

  test("CU02c-Numerique-t1 : Modifier une question numerique", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-numerique")
      .send({
        nom: "QN-modif-ok",
        enonce: "Avant num",
        reponse: "3",
        tags: ["num"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QN-modif-ok/modifier")
      .send({
        type: "Numerique",
        nom: "QN-modif-ok",
        enonce: "Apres num",
        reponse: "42",
      });

    expect(response.status).toBe(200);
    expect(response.body.question.type).toBe("Numerique");
    expect(response.body.question.reponseAttendue).toBe(42);
  });

  test("CU02c-RC-t1 : Modifier une question reponse courte", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-reponse-courte")
      .send({
        nom: "QRC-modif",
        enonce: "Avant RC",
        reponse: "A",
        tags: ["rc"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QRC-modif/modifier")
      .send({
        type: "ReponseCourte",
        nom: "QRC-modif",
        enonce: "Apres RC",
        reponse: "B",
      });

    expect(response.status).toBe(200);
    expect(response.body.question.type).toBe("ReponseCourte");
    expect(response.body.question.reponseAttendue).toBe("B");
  });

  test("CU02c-RC-t2 : Rejeter modification reponse courte sans reponse", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-reponse-courte")
      .send({
        nom: "QRC-modif-err",
        enonce: "Avant RC",
        reponse: "A",
        tags: ["rc"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QRC-modif-err/modifier")
      .send({
        type: "ReponseCourte",
        nom: "QRC-modif-err",
        enonce: "Apres RC",
        reponse: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("reponse");
  });

  test("CU02c-MEC-t1 : Modifier une question MEC", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-mise-en-correspondance")
      .send({
        nom: "QMEC-modif",
        enonce: "Avant MEC",
        paires: [{ question: "1", reponse: "un" }],
        tags: ["mec"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QMEC-modif/modifier")
      .send({
        type: "MiseEnCorrespondance",
        nom: "QMEC-modif",
        enonce: "Apres MEC",
        paires: [
          { question: "1", reponse: "one" },
          { question: "2", reponse: "two" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.question.type).toBe("MiseEnCorrespondance");
    expect(response.body.question.paires).toHaveLength(2);
  });

  test("CU02c-MEC-t2 : Rejeter modification MEC sans paires", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-mise-en-correspondance")
      .send({
        nom: "QMEC-modif-err",
        enonce: "Avant MEC",
        paires: [{ question: "1", reponse: "un" }],
        tags: ["mec"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QMEC-modif-err/modifier")
      .send({
        type: "MiseEnCorrespondance",
        nom: "QMEC-modif-err",
        enonce: "Apres MEC",
        paires: [],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("paires");
  });

  test("CU02c-Essai-t1 : Modifier une question essai", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-essai")
      .send({
        nom: "QESSAI-modif",
        enonce: "Avant Essai",
        tags: ["essay"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QESSAI-modif/modifier")
      .send({
        type: "Essai",
        nom: "QESSAI-modif",
        enonce: "Apres Essai",
      });

    expect(response.status).toBe(200);
    expect(response.body.question.type).toBe("Essai");
    expect(response.body.question.enonce).toBe("Apres Essai");
  });

  test("CU02d-API-t4 : Supprimer une question reponse courte", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-reponse-courte")
      .send({
        nom: "QRC-suppr",
        enonce: "Question RC a supprimer",
        reponse: "x",
        tags: ["rc"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QRC-suppr/suppression")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.questions.find((q: any) => q.nom === "QRC-suppr")).toBeUndefined();
  });

  test("CU02d-API-t5 : Supprimer une question MEC", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-mise-en-correspondance")
      .send({
        nom: "QMEC-suppr",
        enonce: "Question MEC a supprimer",
        paires: [{ question: "a", reponse: "b" }],
        tags: ["mec"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QMEC-suppr/suppression")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.questions.find((q: any) => q.nom === "QMEC-suppr")).toBeUndefined();
  });

  test("CU02d-API-t6 : Supprimer une question essai", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-essai")
      .send({
        nom: "QESSAI-suppr",
        enonce: "Question Essai a supprimer",
        tags: ["essay"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/QESSAI-suppr/suppression")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.questions.find((q: any) => q.nom === "QESSAI-suppr")).toBeUndefined();
  });

  test("CU02d-API-t1 : Preparer suppression d'une question", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q-suppr",
        enonce: "Question suppr",
        reponse: true,
        tags: ["sup"],
      });

    const response = await request(app).get("/LOG210-A01/questions/Q-suppr/suppression");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("Confirmation");
    expect(response.body.question.nom).toBe("Q-suppr");
  });

  test("CU02d-API-t2 : Confirmer suppression d'une question", async () => {
    await request(app)
      .post("/LOG210-A01/ajouter-vrai-faux")
      .send({
        nom: "Q-suppr-conf",
        enonce: "Question a supprimer",
        reponse: true,
        tags: ["sup"],
      });

    const response = await request(app)
      .post("/LOG210-A01/questions/Q-suppr-conf/suppression")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.questions)).toBe(true);
    expect(response.body.questions.find((q: any) => q.nom === "Q-suppr-conf")).toBeUndefined();
  });

  test("CU02d-API-t3 : Rejeter suppression si question introuvable", async () => {
    const response = await request(app).get("/LOG210-A01/questions/inexistante/suppression");

    expect(response.status).toBe(404);
    expect(response.body.error).toContain("introuvable");
  });

  describe("QuestionsController - Unit branches", () => {
    const makeRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    const loadController = (overrides?: {
      ajouterQuestionAuCours?: jest.Mock;
      existeNomQuestion?: jest.Mock;
      existeNomQuestionEnExcluant?: jest.Mock;
      recupererQuestionParNom?: jest.Mock;
      recupererQuestionsDuCours?: jest.Mock;
      supprimerQuestionDuCours?: jest.Mock;
      modifierQuestionDuCours?: jest.Mock;
    }) => {
      const ajouterQuestionAuCours = overrides?.ajouterQuestionAuCours ?? jest.fn().mockResolvedValue(undefined);
      const existeNomQuestion = overrides?.existeNomQuestion ?? jest.fn().mockResolvedValue(false);
      const existeNomQuestionEnExcluant = overrides?.existeNomQuestionEnExcluant ?? jest.fn().mockResolvedValue(false);
      const recupererQuestionParNom = overrides?.recupererQuestionParNom ?? jest.fn().mockResolvedValue(undefined);
      const recupererQuestionsDuCours = overrides?.recupererQuestionsDuCours ?? jest.fn().mockResolvedValue([]);
      const supprimerQuestionDuCours = overrides?.supprimerQuestionDuCours ?? jest.fn().mockResolvedValue(undefined);
      const modifierQuestionDuCours = overrides?.modifierQuestionDuCours ?? jest.fn().mockResolvedValue(undefined);

      let Controller: any;
      jest.isolateModules(() => {
        jest.doMock("../../src/core/coursStore", () => ({
          ajouterQuestionAuCours,
          existeNomQuestion,
          existeNomQuestionEnExcluant,
          recupererQuestionParNom,
          recupererQuestionsDuCours,
          supprimerQuestionDuCours,
          modifierQuestionDuCours,
        }));
        Controller = require("../../src/controllers/QuestionsController").QuestionsController;
      });

      return {
        QuestionsController: Controller,
        ajouterQuestionAuCours,
        existeNomQuestion,
        existeNomQuestionEnExcluant,
        recupererQuestionParNom,
        recupererQuestionsDuCours,
        supprimerQuestionDuCours,
        modifierQuestionDuCours,
      };
    };

    afterEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
      jest.dontMock("../../src/core/coursStore");
    });

    test("ajouterQuestionVraiFaux: missing teacher or idGroupe -> 400", async () => {
      const { QuestionsController } = loadController();
      const req: any = { session: {}, params: {}, body: {} };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ajouterQuestionVraiFaux: missing fields -> 400", async () => {
      const { QuestionsController } = loadController();
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1" },
        body: { nom: "", enonce: "", reponse: "" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ajouterQuestionVraiFaux: duplicate name -> 409", async () => {
      const { QuestionsController } = loadController({
        existeNomQuestion: jest.fn().mockResolvedValue(true),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1" },
        body: { nom: "Q1", enonce: "E", reponse: true, tags: ["x"] },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test("ajouterQuestionVraiFaux: add throws -> 500", async () => {
      const { QuestionsController } = loadController({
        ajouterQuestionAuCours: jest.fn().mockRejectedValue(new Error("boom")),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1" },
        body: { nom: "Q1", enonce: "E", reponse: "true", tags: ["x"] },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionVraiFaux(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "boom" });
    });

    test("ajouterQuestionChoixMultiple: missing fields -> 400", async () => {
      const { QuestionsController } = loadController();
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1" },
        body: { nom: "", enonce: "" },
      };
      const res = makeRes();

      await QuestionsController.ajouterQuestionChoixMultiple(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("consulterQuestionsCours: missing context -> 400", async () => {
      const { QuestionsController } = loadController();
      const req: any = { session: {}, params: {} };
      const res = makeRes();

      await QuestionsController.consulterQuestionsCours(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("selectionnerQuestion: introuvable -> 404", async () => {
      const { QuestionsController } = loadController({
        recupererQuestionParNom: jest.fn().mockResolvedValue(undefined),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1", nom: "inconnue" },
      };
      const res = makeRes();

      await QuestionsController.selectionnerQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("modifierQuestion: question absente -> 404", async () => {
      const { QuestionsController } = loadController({
        recupererQuestionParNom: jest.fn().mockResolvedValue(undefined),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1", nom: "Qx" },
        body: {},
      };
      const res = makeRes();

      await QuestionsController.modifierQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("modifierQuestion: conflit de nom -> 409", async () => {
      const { QuestionsController } = loadController({
        recupererQuestionParNom: jest.fn().mockResolvedValue({
          nom: "Q1",
          enonce: "e",
          type: "VraiFaux",
          reponse: true,
          retroactionValide: "rv",
          retroactionInvalide: "ri",
          tags: ["t"],
        }),
        existeNomQuestionEnExcluant: jest.fn().mockResolvedValue(true),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1", nom: "Q1" },
        body: { nom: "Q2", enonce: "e2", reponse: true },
      };
      const res = makeRes();

      await QuestionsController.modifierQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test("modifierQuestion: store throws -> 500", async () => {
      const { QuestionsController } = loadController({
        recupererQuestionParNom: jest.fn().mockResolvedValue({
          nom: "Q1",
          enonce: "e",
          type: "VraiFaux",
          reponse: true,
          retroactionValide: "rv",
          retroactionInvalide: "ri",
          tags: ["t"],
        }),
        modifierQuestionDuCours: jest.fn().mockRejectedValue(new Error("boom-modif")),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1", nom: "Q1" },
        body: { nom: "Q1", enonce: "e2", reponse: false },
      };
      const res = makeRes();

      await QuestionsController.modifierQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "boom-modif" });
    });

    test("confirmerSuppressionQuestion: store throws -> 500", async () => {
      const { QuestionsController } = loadController({
        recupererQuestionParNom: jest.fn().mockResolvedValue({ nom: "Q1" }),
        supprimerQuestionDuCours: jest.fn().mockRejectedValue(new Error("boom-suppression")),
      });
      const req: any = {
        session: { user: { id: "t1" } },
        params: { idGroupe: "g1", nom: "Q1" },
      };
      const res = makeRes();

      await QuestionsController.confirmerSuppressionQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "boom-suppression" });
    });
  });
});
