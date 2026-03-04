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

export async function getStoredPourProf(teacherId: string): Promise<Cours[]> {
  const all = await getCoursStockes();
  return all.filter(c => String(c.idEnseignant) === String(teacherId));
}

export async function getStoredParIdGroupe(groupId: string): Promise<Cours | undefined> {
  const all = await getCoursStockes();
  return all.find(c => c.idGroupe === String(groupId));
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

export async function retirerCoursStocke(groupId: string): Promise<void> {
  const all = await getCoursStockes();
  const next = all.filter(c => c.idGroupe !== groupId);
  await ecrireCoursStockes(next);
}

export async function getQuestionsForCours(groupId: string): Promise<AnyQuestion[]> {
  const cours = await getStoredParIdGroupe(groupId);
  return cours?.questions ?? [];
}

export async function questionNameExists(groupId: string, nom: string): Promise<boolean> {
  const questions = await getQuestionsForCours(groupId);
  return questions.some(q => String(q.nom).toLowerCase() === String(nom).toLowerCase());
}

export async function addQuestion(groupId: string, question: AnyQuestion | Question): Promise<void> {
  const allCours = await getCoursStockes();
  const indexCours = allCours.findIndex((cours) => String(cours.idGroupe) === String(groupId));

  if (indexCours === -1) {
    throw new Error(`Cours introuvable pour le groupe "${groupId}".`);
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
