import { promises as fs } from "fs";
import os from "os";
import path from "path";

describe("questionnairesStore - exigences CU05", () => {
  let tmpDir: string;
  let store: any;

  beforeEach(async () => {
    jest.resetModules();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "questionnaires-store-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);

    jest.doMock("../../src/core/coursStore", () => ({
      recupererQuestionsDuCours: jest.fn(async (idGroupe: string) => {
        if (idGroupe === "g-1") {
          return [
            { nom: "Q1", tags: ["exam"] },
            { nom: "Q2", tags: ["exam"] },
            { nom: "Q3", tags: ["quiz"] },
          ];
        }
        if (idGroupe === "g-2") {
          return [{ nom: "Q4", tags: ["exam"] }];
        }
        return [];
      }),
    }));

    store = require("../../src/core/questionnairesStore");
    await store.viderQuestionnairesAuDemarrage();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test("cree un nouveau questionnaire associe au cours", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz 1", "Desc", true);
    await store.ajouterQuestionnaire("g-1", q);
    const questionnaires = await store.obtenirQuestionnairesAssocies("g-1");
    expect(questionnaires).toHaveLength(1);
    expect(questionnaires[0].nom).toBe("Quiz 1");
  });

  test("le questionnaire cree n'est pas associe a un autre cours", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz 1", "Desc", true);
    await store.ajouterQuestionnaire("g-1", q);
    const questionnairesAutreCours = await store.obtenirQuestionnairesAssocies("g-2");
    expect(questionnairesAutreCours).toHaveLength(0);
  });

  test("un questionnaire cree peut etre associe a 0 question", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz 0", "Aucune question", true);
    await store.ajouterQuestionnaire("g-1", q);
    const questionnaires = await store.obtenirQuestionnairesAssocies("g-1");
    const quiz0 = questionnaires.find((x: any) => x.nom === "Quiz 0");
    expect(quiz0.questions).toEqual([]);
  });

  test("un questionnaire cree peut etre associe a plusieurs questions", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz multi", "Desc", true);
    await store.ajouterQuestionnaire("g-1", q);
    const ok = await store.sauvegarderQuestionsQuestionnaire("g-1", "Quiz multi", ["Q1", "Q2"]);
    expect(ok).toBe(true);
    const questionnaires = await store.obtenirQuestionnairesAssocies("g-1");
    const quiz = questionnaires.find((x: any) => x.nom === "Quiz multi");
    expect(quiz.questions).toEqual(["Q1", "Q2"]);
  });

  test("impossible de creer un questionnaire avec un nom deja existant", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz unique", "Desc", true);
    await store.ajouterQuestionnaire("g-1", q);
    await expect(store.creerQuestionnaire("g-1", "Quiz unique", "Autre", false)).rejects.toThrow(
      /existe deja/i
    );
  });

  test("avec plusieurs cours/questionnaires, le nombre affiche par cours est bon", async () => {
    const q1 = await store.creerQuestionnaire("g-1", "Q-A", "", true);
    const q2 = await store.creerQuestionnaire("g-1", "Q-B", "", true);
    const q3 = await store.creerQuestionnaire("g-2", "Q-C", "", true);
    await store.ajouterQuestionnaire("g-1", q1);
    await store.ajouterQuestionnaire("g-1", q2);
    await store.ajouterQuestionnaire("g-2", q3);
    expect((await store.obtenirQuestionnairesAssocies("g-1")).length).toBe(2);
    expect((await store.obtenirQuestionnairesAssocies("g-2")).length).toBe(1);
  });

  test("le nombre de fois qu'une question est utilisee est calcule correctement", async () => {
    const qa = await store.creerQuestionnaire("g-1", "QA", "", true);
    const qb = await store.creerQuestionnaire("g-1", "QB", "", true);
    await store.ajouterQuestionnaire("g-1", qa);
    await store.ajouterQuestionnaire("g-1", qb);
    await store.sauvegarderQuestionsQuestionnaire("g-1", "QA", ["Q1", "Q2"]);
    await store.sauvegarderQuestionsQuestionnaire("g-1", "QB", ["Q1"]);

    const questionsExam = await store.obtenirQuestionsParTag("g-1", "exam");
    const q1 = questionsExam.find((q: any) => q.nom === "Q1");
    const q2 = questionsExam.find((q: any) => q.nom === "Q2");
    expect(q1.utilisationQuestionnaires).toBe(2);
    expect(q2.utilisationQuestionnaires).toBe(1);
  });

  test("description et etat d'un questionnaire peuvent etre modifies", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz mod", "Ancienne desc", true);
    await store.ajouterQuestionnaire("g-1", q);
    const ok = await store.modifierQuestionnaire(
      "g-1",
      "Quiz mod",
      "Quiz mod",
      "Nouvelle desc",
      false,
      []
    );
    expect(ok).toBe(true);
    const quiz = (await store.obtenirQuestionnairesAssocies("g-1")).find((x: any) => x.nom === "Quiz mod");
    expect(quiz.description).toBe("Nouvelle desc");
    expect(quiz.actif).toBe(false);
  });

  test("impossible de modifier le nom vers un nom deja existant", async () => {
    const q1 = await store.creerQuestionnaire("g-1", "Quiz 1", "", true);
    const q2 = await store.creerQuestionnaire("g-1", "Quiz 2", "", true);
    await store.ajouterQuestionnaire("g-1", q1);
    await store.ajouterQuestionnaire("g-1", q2);
    await expect(
      store.modifierQuestionnaire("g-1", "Quiz 2", "Quiz 1", "desc", true, [])
    ).rejects.toThrow(/existe deja/i);
  });

  test("une ou plusieurs questions peuvent etre associees a un questionnaire existant", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz assoc", "", true);
    await store.ajouterQuestionnaire("g-1", q);
    const ok = await store.modifierQuestionnaire("g-1", "Quiz assoc", "Quiz assoc", "", true, ["Q1", "Q2"]);
    expect(ok).toBe(true);
    const quiz = (await store.obtenirQuestionnairesAssocies("g-1")).find((x: any) => x.nom === "Quiz assoc");
    expect(quiz.questions).toEqual(["Q1", "Q2"]);
  });

  test("une ou plusieurs questions peuvent etre dissociees d'un questionnaire existant", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz dissoc", "", true);
    await store.ajouterQuestionnaire("g-1", q);
    await store.modifierQuestionnaire("g-1", "Quiz dissoc", "Quiz dissoc", "", true, ["Q1", "Q2", "Q3"]);
    await store.modifierQuestionnaire("g-1", "Quiz dissoc", "Quiz dissoc", "", true, ["Q2"]);
    const quiz = (await store.obtenirQuestionnairesAssocies("g-1")).find((x: any) => x.nom === "Quiz dissoc");
    expect(quiz.questions).toEqual(["Q2"]);
  });

  test("l'ordre des questions d'un questionnaire peut etre modifie", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz ordre", "", true);
    await store.ajouterQuestionnaire("g-1", q);
    await store.modifierQuestionnaire("g-1", "Quiz ordre", "Quiz ordre", "", true, ["Q1", "Q2", "Q3"]);
    await store.modifierQuestionnaire("g-1", "Quiz ordre", "Quiz ordre", "", true, ["Q3", "Q1", "Q2"]);
    const quiz = (await store.obtenirQuestionnairesAssocies("g-1")).find((x: any) => x.nom === "Quiz ordre");
    expect(quiz.questions).toEqual(["Q3", "Q1", "Q2"]);
  });

  test("impossible de modifier un questionnaire deja repondu", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz bloque", "", true);
    q.resultatsEtudiants = [{ courrielEtudiant: "etudiant@ets.ca", note: 80 }];
    await store.ajouterQuestionnaire("g-1", q);
    await expect(
      store.modifierQuestionnaire("g-1", "Quiz bloque", "Quiz bloque", "x", true, [])
    ).rejects.toThrow(/realise par au moins un etudiant/i);
  });

  test("pour au moins deux questionnaires distincts, on peut supprimer un questionnaire d'un cours", async () => {
    const q1 = await store.creerQuestionnaire("g-1", "Quiz A", "", true);
    const q2 = await store.creerQuestionnaire("g-1", "Quiz B", "", true);
    await store.ajouterQuestionnaire("g-1", q1);
    await store.ajouterQuestionnaire("g-1", q2);
    expect(await store.supprimerQuestionnaire("g-1", "Quiz A")).toBe(true);
    const restants = await store.obtenirQuestionnairesAssocies("g-1");
    expect(restants.map((q: any) => q.nom)).toEqual(["Quiz B"]);
  });

  test("les questions associees avant suppression existent encore dans la banque", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz banque", "", true);
    await store.ajouterQuestionnaire("g-1", q);
    await store.sauvegarderQuestionsQuestionnaire("g-1", "Quiz banque", ["Q1", "Q2"]);
    await store.supprimerQuestionnaire("g-1", "Quiz banque");
    const q1 = await store.obtenirQuestionParNom("g-1", "Q1");
    const q2 = await store.obtenirQuestionParNom("g-1", "Q2");
    expect(q1).toBeDefined();
    expect(q2).toBeDefined();
  });

  test("impossible de supprimer un questionnaire quand au moins un etudiant l'a realise", async () => {
    const q = await store.creerQuestionnaire("g-1", "Quiz protege", "", true);
    q.resultatsEtudiants = [{ courrielEtudiant: "a@ets.ca", note: 90 }];
    await store.ajouterQuestionnaire("g-1", q);
    const verification = await store.verifierSupprimerQuestionnaire("g-1", "Quiz protege");
    expect(verification.confirmation).toBe(false);
  });
});

