import { promises as fs } from "fs";
import path from "path";
import { StudentInfo } from "./sgbClient";
import { AnyQuestion, Question } from "../types/questionTypes";
import {
  convertirQuestionsModelesEnDonnees,
  deserialiserQuestionDepuisJson,
  deserialiserQuestionsDepuisJson,
  serialiserQuestionsPourStockage,
} from "./questionsFactory";

export type Cours = {
  idGroupe: string;
  jour: string;
  heure: string;
  activite: string;
  mode: string;
  local: string;
  idEnseignant: string;

  idCours?: string;
  titreCours?: string;
  etudiants: StudentInfo[];
  questions: AnyQuestion[];
};


const STORE_PATH = path.join(process.cwd(), "data", "cours.json");

type CoursStockage = Omit<Cours, "questions"> & {
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

export async function viderStoreAuDemarrage(): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify({ courses: [] }, null, 2), "utf-8");
}

export async function getCoursStockes(): Promise<Cours[]> {
  await assurerFichier();
  const raw = await fs.readFile(STORE_PATH, "utf-8");
  const json = JSON.parse(raw);
  if (!Array.isArray(json.courses)) {
    return [];
  }

  return json.courses.map((cours: CoursStockage) => ({
    ...cours,
    etudiants: Array.isArray(cours?.etudiants) ? cours.etudiants : [],
    questions: convertirQuestionsModelesEnDonnees(deserialiserQuestionsDepuisJson(cours?.questions)),
  }));
}

async function ecrireCoursStockes(courses: CoursStockage[]): Promise<void> {
  await fs.writeFile(STORE_PATH, JSON.stringify({ courses }, null, 2), "utf-8");
}

export async function recupererCoursStockesPourEnseignant(idEnseignant: string): Promise<Cours[]> {
  const all = await getCoursStockes();
  return all.filter(c => String(c.idEnseignant) === String(idEnseignant));
}

export async function recupererCoursStockeParIdGroupe(idGroupe: string): Promise<Cours | undefined> {
  const all = await getCoursStockes();
  return all.find(c => c.idGroupe === String(idGroupe));
}

export async function ajouterCoursStocke(course: Cours

): Promise<void> {
  const all = await getCoursStockes();
  const exists = all.some(c => c.idGroupe === course.idGroupe);
  if (!exists) {
    all.push({
      ...course,
      etudiants: Array.isArray(course.etudiants) ? course.etudiants : [],
      questions: Array.isArray(course.questions) ? course.questions : [],
    });
    await ecrireCoursStockes(all);
  }
}

export async function retirerCoursStocke(idGroupe: string): Promise<void> {
  const all = await getCoursStockes();
  const next = all.filter(c => c.idGroupe !== idGroupe);
  await ecrireCoursStockes(next);
}

export async function recupererQuestionsDuCours(idGroupe: string): Promise<AnyQuestion[]> {
  const cours = await recupererCoursStockeParIdGroupe(idGroupe);
  return cours?.questions ?? [];
}

export async function existeNomQuestion(idGroupe: string, nom: string): Promise<boolean> {
  const questions = await recupererQuestionsDuCours(idGroupe);
  return questions.some(q => String(q.nom).toLowerCase() === String(nom).toLowerCase());
}

export async function existeNomQuestionEnExcluant(
  idGroupe: string,
  nom: string,
  nomAExclure: string
): Promise<boolean> {
  const questions = await recupererQuestionsDuCours(idGroupe);
  const nomRecherche = String(nom).toLowerCase();
  const nomExclu = String(nomAExclure).toLowerCase();

  return questions.some(
    (question) =>
      String(question.nom).toLowerCase() === nomRecherche &&
      String(question.nom).toLowerCase() !== nomExclu
  );
}

export async function recupererQuestionParNom(idGroupe: string, nom: string): Promise<AnyQuestion | undefined> {
  const questions = await recupererQuestionsDuCours(idGroupe);
  const nomRecherche = String(nom).toLowerCase();
  return questions.find((question) => String(question.nom).toLowerCase() === nomRecherche);
}

export async function ajouterQuestionAuCours(idGroupe: string, question: AnyQuestion | Question): Promise<void> {
  const allCours = await getCoursStockes();
  const indexCours = allCours.findIndex((cours) => String(cours.idGroupe) === String(idGroupe));

  if (indexCours === -1) {
    throw new Error(`Cours introuvable pour le groupe "${idGroupe}".`);
  }

  const nouveauModele: Question = question instanceof Question ? question : deserialiserQuestionDepuisJson(question);
  const questionsModeles = deserialiserQuestionsDepuisJson(allCours[indexCours].questions);

  const nomExiste = questionsModeles.some(
    (questionCourante) => String(questionCourante.nom).toLowerCase() === String(nouveauModele.nom).toLowerCase()
  );

  if (nomExiste) {
    throw new Error(`Une question avec le nom "${nouveauModele.nom}" existe déjà pour ce cours.`);
  }

  questionsModeles.push(nouveauModele);
  allCours[indexCours] = {
    ...allCours[indexCours],
    questions: serialiserQuestionsPourStockage(questionsModeles) as AnyQuestion[],
  };

  await ecrireCoursStockes(allCours);
}

export async function modifierQuestionDuCours(
  idGroupe: string,
  nomOriginal: string,
  questionMiseAJour: AnyQuestion | Question
): Promise<void> {
  const allCours = await getCoursStockes();
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
    throw new Error(`Une question avec le nom "${nouveauModele.nom}" existe déjà pour ce cours.`);
  }

  questionsModeles[indexQuestion] = nouveauModele;
  allCours[indexCours] = {
    ...allCours[indexCours],
    questions: serialiserQuestionsPourStockage(questionsModeles) as AnyQuestion[],
  };

  await ecrireCoursStockes(allCours);
}

export async function supprimerQuestionDuCours(idGroupe: string, nom: string): Promise<void> {
  const allCours = await getCoursStockes();
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

  allCours[indexCours] = {
    ...allCours[indexCours],
    questions: serialiserQuestionsPourStockage(questionsFiltrees) as AnyQuestion[],
  };

  await ecrireCoursStockes(allCours);
}
