import { promises as fs } from "fs";
import path from "path";
import { StudentInfo } from "./sgbClient";
import { AnyQuestion } from "../types/questionTypes";

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

  return json.courses.map((cours: any) => ({
    ...cours,
    etudiants: Array.isArray(cours?.etudiants) ? cours.etudiants : [],
    questions: Array.isArray(cours?.questions) ? cours.questions : [],
  }));
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
    await fs.writeFile(STORE_PATH, JSON.stringify({ courses: all }, null, 2), "utf-8");
  }
}

export async function retirerCoursStocke(groupId: string): Promise<void> {
  const all = await getCoursStockes();
  const next = all.filter(c => c.idGroupe !== groupId);
  await fs.writeFile(STORE_PATH, JSON.stringify({ courses: next }, null, 2), "utf-8");
}
