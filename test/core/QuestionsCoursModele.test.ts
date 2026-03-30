import { promises as fs } from "fs";
import path from "path";
import os from "os";

describe("Questions du CoursModele", () => {
  let tmpDir: string;
  let store: any;

  const coursBase = {
    idGroupe: "LOG210-A01",
    jour: "Lun",
    heure: "10:00",
    activite: "Cours",
    mode: "Presentiel",
    local: "A-101",
    idEnseignant: "teacher1",
    etudiants: [],
    questions: [],
  };

  beforeEach(async () => {
    jest.resetModules();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "questions-cours-modele-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    store = require("../../src/core/CoursModele");
    await store.viderStoreAuDemarrage();
    await store.ajouterCoursStocke(coursBase);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test("ajouterQuestionAuCours ajoute une question vrai/faux", async () => {
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "Q1",
      enonce: "TypeScript est un langage?",
      reponse: true,
      retroactionValide: "Oui",
      retroactionInvalide: "Non",
      tags: ["typescript"],
      type: "VraiFaux",
    });

    const questions = await store.obtenirQuestionsDuCours("LOG210-A01");
    expect(questions).toHaveLength(1);
    expect(questions[0].nom).toBe("Q1");
    expect(questions[0].type).toBe("VraiFaux");
  });

  test("ajouterQuestionAuCours rejette les doublons de nom", async () => {
    const question = {
      nom: "Question1",
      enonce: "Question 1",
      reponse: true,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    };

    await store.ajouterQuestionAuCours("LOG210-A01", question);
    await expect(store.ajouterQuestionAuCours("LOG210-A01", question)).rejects.toThrow("existe");
  });

  test("nomQuestionExiste est insensible a la casse", async () => {
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "TestQ",
      enonce: "Test",
      reponse: true,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    });

    expect(await store.nomQuestionExiste("LOG210-A01", "TestQ")).toBe(true);
    expect(await store.nomQuestionExiste("LOG210-A01", "testq")).toBe(true);
    expect(await store.nomQuestionExiste("LOG210-A01", "absent")).toBe(false);
  });

  test("obtenirQuestionsDuCours retourne [] pour un cours absent", async () => {
    const questions = await store.obtenirQuestionsDuCours("INEXISTANT");
    expect(questions).toEqual([]);
  });

  test("ajouterQuestionAuCours echoue si le cours n'existe pas", async () => {
    await expect(
      store.ajouterQuestionAuCours("INEXISTANT", {
        nom: "QX",
        enonce: "Question",
        reponse: true,
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: ["x"],
        type: "VraiFaux",
      })
    ).rejects.toThrow("Cours introuvable");
  });

  test("retirerQuestionDuCours retire la question cible", async () => {
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "Q1",
      enonce: "Question 1",
      reponse: true,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    });

    await store.retirerQuestionDuCours("LOG210-A01", "Q1");
    const questions = await store.obtenirQuestionsDuCours("LOG210-A01");
    expect(questions).toEqual([]);
  });

  test("obtenirQuestionParNom retrouve une question sans sensibilite a la casse", async () => {
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "QCase",
      enonce: "Question Case",
      reponse: true,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    });

    const trouvee = await store.obtenirQuestionParNom("LOG210-A01", "qcase");
    expect(trouvee).toBeDefined();
    expect(trouvee.nom).toBe("QCase");
  });

  test("nomQuestionExisteSauf ignore le nom exclu", async () => {
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "Q1",
      enonce: "Question 1",
      reponse: true,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    });

    expect(await store.nomQuestionExisteSauf("LOG210-A01", "Q1", "Q1")).toBe(false);
    expect(await store.nomQuestionExisteSauf("LOG210-A01", "Q1", "AUTRE")).toBe(true);
  });

  test("modifierQuestionDuCours met a jour la question cible", async () => {
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "QMod",
      enonce: "Ancien enonce",
      reponse: true,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    });

    await store.modifierQuestionDuCours("LOG210-A01", "QMod", {
      nom: "QMod",
      enonce: "Nouvel enonce",
      reponse: false,
      retroactionValide: "Bien",
      retroactionInvalide: "Oops",
      tags: ["y"],
      type: "VraiFaux",
    });

    const question = await store.obtenirQuestionParNom("LOG210-A01", "QMod");
    expect(question.enonce).toBe("Nouvel enonce");
    expect(question.reponse).toBe(false);
    expect(question.tags).toEqual(["y"]);
  });

  test("modifierQuestionDuCours rejette un nouveau nom deja existant", async () => {
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "Q1",
      enonce: "Question 1",
      reponse: true,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    });
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "Q2",
      enonce: "Question 2",
      reponse: false,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    });

    await expect(
      store.modifierQuestionDuCours("LOG210-A01", "Q2", {
        nom: "Q1",
        enonce: "Question 2 modifiee",
        reponse: false,
        retroactionValide: "OK",
        retroactionInvalide: "Non",
        tags: ["x"],
        type: "VraiFaux",
      })
    ).rejects.toThrow(/existe d[ée]ja/i);
  });

  test("retirerQuestionDuCours echoue si la question n'existe pas", async () => {
    await expect(store.retirerQuestionDuCours("LOG210-A01", "INEXISTANTE")).rejects.toThrow(
      "Question introuvable"
    );
  });
});


