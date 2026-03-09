import { promises as fs } from "fs";
import path from "path";
import os from "os";

describe("coursStore - questions", () => {
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
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "questionsstore-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    store = require("../../src/core/coursStore");
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

    const questions = await store.recupererQuestionsDuCours("LOG210-A01");
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

  test("existeNomQuestion est insensible a la casse", async () => {
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "TestQ",
      enonce: "Test",
      reponse: true,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    });

    expect(await store.existeNomQuestion("LOG210-A01", "TestQ")).toBe(true);
    expect(await store.existeNomQuestion("LOG210-A01", "testq")).toBe(true);
    expect(await store.existeNomQuestion("LOG210-A01", "absent")).toBe(false);
  });

  test("recupererQuestionsDuCours retourne [] pour un cours absent", async () => {
    const questions = await store.recupererQuestionsDuCours("INEXISTANT");
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

  test("supprimerQuestionDuCours retire la question cible", async () => {
    await store.ajouterQuestionAuCours("LOG210-A01", {
      nom: "Q1",
      enonce: "Question 1",
      reponse: true,
      retroactionValide: "OK",
      retroactionInvalide: "Non",
      tags: ["x"],
      type: "VraiFaux",
    });

    await store.supprimerQuestionDuCours("LOG210-A01", "Q1");
    const questions = await store.recupererQuestionsDuCours("LOG210-A01");
    expect(questions).toEqual([]);
  });
});
