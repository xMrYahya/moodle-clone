import { promises as fs } from "fs";
import path from "path";
import { AnyQuestion, Question } from "../types/questionTypes";
import {
  convertirQuestionsModelesEnDonnees,
  deserialiserQuestionDepuisJson,
  deserialiserQuestionsDepuisJson,
  serialiserQuestionsPourStockage,
} from "./questionsFactory";
import { Cours } from "./Cours";

const STORE_PATH = path.join(process.cwd(), "data", "cours.json");

type CoursStockage = Omit<ReturnType<Cours["toPlainObject"]>, "questions"> & {
  questions?: unknown[];
};

async function assurerFichier() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify({ courses: [] }, null, 2), "utf-8");
  }
}

async function ecrireCoursStockes(courses: CoursStockage[]): Promise<void> {
  await fs.writeFile(STORE_PATH, JSON.stringify({ courses }, null, 2), "utf-8");
}

export class CoursModele {
  static async viderStoreAuDemarrage(): Promise<void> {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify({ courses: [] }, null, 2), "utf-8");
  }

  static async obtenirCoursStockes(): Promise<Cours[]> {
    await assurerFichier();
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const json = JSON.parse(raw);
    if (!Array.isArray(json.courses)) {
      return [];
    }

    return json.courses.map((cours: CoursStockage) =>
      new Cours({
        ...cours,
        etudiants: Array.isArray(cours?.etudiants) ? cours.etudiants : [],
        questions: convertirQuestionsModelesEnDonnees(
          deserialiserQuestionsDepuisJson(cours?.questions)
        ),
      })
    );
  }

  static async obtenirCoursStockesPourProf(idEnseignant: string): Promise<Cours[]> {
    const all = await CoursModele.obtenirCoursStockes();
    return all.filter((c) => String(c.idEnseignant) === String(idEnseignant));
  }

  static async obtenirCoursStockeParIdGroupe(idGroupe: string): Promise<Cours | undefined> {
    const all = await CoursModele.obtenirCoursStockes();
    return all.find((c) => c.idGroupe === String(idGroupe));
  }

  static async ajouterCoursStocke(cours: Cours | ReturnType<Cours["toPlainObject"]>): Promise<void> {
    const all = await CoursModele.obtenirCoursStockes();
    const instance = cours instanceof Cours ? cours : new Cours(cours);
    const exists = all.some((c) => c.idGroupe === instance.idGroupe);
    if (!exists) {
      all.push(instance);
      await ecrireCoursStockes(
        all.map((c) => ({
          ...c.toPlainObject(),
          questions: Array.isArray(c.questions) ? c.questions : [],
        }))
      );
    }
  }

  static async retirerCoursStocke(idGroupe: string): Promise<void> {
    const all = await CoursModele.obtenirCoursStockes();
    const next = all.filter((c) => c.idGroupe !== idGroupe);
    await ecrireCoursStockes(next.map((c) => c.toPlainObject()));
  }

  static async obtenirQuestionsDuCours(idGroupe: string): Promise<AnyQuestion[]> {
    const cours = await CoursModele.obtenirCoursStockeParIdGroupe(idGroupe);
    return cours?.questions ?? [];
  }

  static async nomQuestionExiste(idGroupe: string, nom: string): Promise<boolean> {
    const questions = await CoursModele.obtenirQuestionsDuCours(idGroupe);
    return questions.some((q) => String(q.nom).toLowerCase() === String(nom).toLowerCase());
  }

  static async nomQuestionExisteSauf(
    idGroupe: string,
    nom: string,
    nomAExclure: string
  ): Promise<boolean> {
    const questions = await CoursModele.obtenirQuestionsDuCours(idGroupe);
    const nomRecherche = String(nom).toLowerCase();
    const nomExclu = String(nomAExclure).toLowerCase();
    return questions.some(
      (question) =>
        String(question.nom).toLowerCase() === nomRecherche &&
        String(question.nom).toLowerCase() !== nomExclu
    );
  }

  static async obtenirQuestionParNom(idGroupe: string, nom: string): Promise<AnyQuestion | undefined> {
    const questions = await CoursModele.obtenirQuestionsDuCours(idGroupe);
    const nomRecherche = String(nom).toLowerCase();
    return questions.find((question) => String(question.nom).toLowerCase() === nomRecherche);
  }

  static async ajouterQuestionAuCours(idGroupe: string, question: AnyQuestion | Question): Promise<void> {
    const allCours = await CoursModele.obtenirCoursStockes();
    const indexCours = allCours.findIndex((cours) => String(cours.idGroupe) === String(idGroupe));
    if (indexCours === -1) {
      throw new Error(`Cours introuvable pour le groupe "${idGroupe}".`);
    }

    const nouveauModele: Question =
      question instanceof Question ? question : deserialiserQuestionDepuisJson(question);
    const questionsModeles = deserialiserQuestionsDepuisJson(allCours[indexCours].questions);
    const nomExiste = questionsModeles.some(
      (questionCourante) =>
        String(questionCourante.nom).toLowerCase() === String(nouveauModele.nom).toLowerCase()
    );
    if (nomExiste) {
      throw new Error(`Une question avec le nom "${nouveauModele.nom}" existe deja pour ce cours.`);
    }

    questionsModeles.push(nouveauModele);
    allCours[indexCours].questions = serialiserQuestionsPourStockage(questionsModeles) as AnyQuestion[];
    await ecrireCoursStockes(allCours.map((c) => c.toPlainObject()));
  }

  static async modifierQuestionDuCours(
    idGroupe: string,
    nomOriginal: string,
    questionMiseAJour: AnyQuestion | Question
  ): Promise<void> {
    const allCours = await CoursModele.obtenirCoursStockes();
    const indexCours = allCours.findIndex((cours) => String(cours.idGroupe) === String(idGroupe));
    if (indexCours === -1) {
      throw new Error(`Cours introuvable pour le groupe "${idGroupe}".`);
    }

    const questionsModeles = deserialiserQuestionsDepuisJson(allCours[indexCours].questions);
    const indexQuestion = questionsModeles.findIndex(
      (questionCourante) =>
        String(questionCourante.nom).toLowerCase() === String(nomOriginal).toLowerCase()
    );
    if (indexQuestion === -1) {
      throw new Error(`Question introuvable avec le nom "${nomOriginal}".`);
    }

    const nouveauModele: Question =
      questionMiseAJour instanceof Question
        ? questionMiseAJour
        : deserialiserQuestionDepuisJson(questionMiseAJour);

    const nomExiste = questionsModeles.some(
      (questionCourante, index) =>
        index !== indexQuestion &&
        String(questionCourante.nom).toLowerCase() === String(nouveauModele.nom).toLowerCase()
    );
    if (nomExiste) {
      throw new Error(`Une question avec le nom "${nouveauModele.nom}" existe deja pour ce cours.`);
    }

    questionsModeles[indexQuestion] = nouveauModele;
    allCours[indexCours].questions = serialiserQuestionsPourStockage(questionsModeles) as AnyQuestion[];
    await ecrireCoursStockes(allCours.map((c) => c.toPlainObject()));
  }

  static async retirerQuestionDuCours(idGroupe: string, nom: string): Promise<void> {
    const allCours = await CoursModele.obtenirCoursStockes();
    const indexCours = allCours.findIndex((cours) => String(cours.idGroupe) === String(idGroupe));
    if (indexCours === -1) {
      throw new Error(`Cours introuvable pour le groupe "${idGroupe}".`);
    }

    const questionsModeles = deserialiserQuestionsDepuisJson(allCours[indexCours].questions);
    const nombreInitial = questionsModeles.length;
    const questionsFiltrees = questionsModeles.filter(
      (questionCourante) => String(questionCourante.nom).toLowerCase() !== String(nom).toLowerCase()
    );
    if (questionsFiltrees.length === nombreInitial) {
      throw new Error(`Question introuvable avec le nom "${nom}".`);
    }

    allCours[indexCours].questions = serialiserQuestionsPourStockage(questionsFiltrees) as AnyQuestion[];
    await ecrireCoursStockes(allCours.map((c) => c.toPlainObject()));
  }
}

export const viderStoreAuDemarrage = CoursModele.viderStoreAuDemarrage;
export const obtenirCoursStockes = CoursModele.obtenirCoursStockes;
export const obtenirCoursStockesPourProf = CoursModele.obtenirCoursStockesPourProf;
export const obtenirCoursStockeParIdGroupe = CoursModele.obtenirCoursStockeParIdGroupe;
export const ajouterCoursStocke = CoursModele.ajouterCoursStocke;
export const retirerCoursStocke = CoursModele.retirerCoursStocke;
export const obtenirQuestionsDuCours = CoursModele.obtenirQuestionsDuCours;
export const nomQuestionExiste = CoursModele.nomQuestionExiste;
export const nomQuestionExisteSauf = CoursModele.nomQuestionExisteSauf;
export const obtenirQuestionParNom = CoursModele.obtenirQuestionParNom;
export const ajouterQuestionAuCours = CoursModele.ajouterQuestionAuCours;
export const modifierQuestionDuCours = CoursModele.modifierQuestionDuCours;
export const retirerQuestionDuCours = CoursModele.retirerQuestionDuCours;

// Alias de compatibilite
export const getCoursStockes = CoursModele.obtenirCoursStockes;
export const getStoredPourProf = CoursModele.obtenirCoursStockesPourProf;
export const getStoredParIdGroupe = CoursModele.obtenirCoursStockeParIdGroupe;
export const getQuestionsForCours = CoursModele.obtenirQuestionsDuCours;
export const questionNameExists = CoursModele.nomQuestionExiste;
export const questionNameExistsExcept = CoursModele.nomQuestionExisteSauf;
export const getQuestionByName = CoursModele.obtenirQuestionParNom;
export const addQuestion = CoursModele.ajouterQuestionAuCours;
export const updateQuestion = CoursModele.modifierQuestionDuCours;
export const removeQuestion = CoursModele.retirerQuestionDuCours;
export const obtenirCoursStockesPourEnseignant = CoursModele.obtenirCoursStockesPourProf;
