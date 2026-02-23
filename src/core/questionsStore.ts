import { promises as fs } from "fs";
import path from "path";
import { AnyQuestion, Question, StoredQuestions } from "../types/questionTypes";
import {
  convertirQuestionsModelesEnDonnees,
  deserialiserQuestionDepuisJson,
  deserialiserQuestionsDepuisJson,
  serialiserQuestionsPourStockage,
} from "./questionsFactory";

const QUESTIONS_STORE_PATH = path.join(process.cwd(), "data", "questions.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(QUESTIONS_STORE_PATH), { recursive: true });
  try {
    await fs.access(QUESTIONS_STORE_PATH);
  } catch {
    await fs.writeFile(QUESTIONS_STORE_PATH, JSON.stringify({ questionsStore: [] }, null, 2), "utf-8");
  }
}

type QuestionsStockage = {
  group_id: string;
  questions: unknown[];
};

async function lireQuestionsStockage(): Promise<QuestionsStockage[]> {
  await ensureFile();
  const raw = await fs.readFile(QUESTIONS_STORE_PATH, "utf-8");
  const json = JSON.parse(raw);
  return Array.isArray(json.questionsStore) ? json.questionsStore : [];
}

async function ecrireQuestionsStockage(questions: QuestionsStockage[]): Promise<void> {
  await fs.writeFile(QUESTIONS_STORE_PATH, JSON.stringify({ questionsStore: questions }, null, 2), "utf-8");
}

export async function clearQuestionsOnStartup(): Promise<void> {
  await fs.mkdir(path.dirname(QUESTIONS_STORE_PATH), { recursive: true });
  await fs.writeFile(QUESTIONS_STORE_PATH, JSON.stringify({ questionsStore: [] }, null, 2), "utf-8");
}

export async function getAllQuestions(): Promise<StoredQuestions[]> {
  const questionsStockees = await lireQuestionsStockage();
  return questionsStockees.map((cours) => ({
    group_id: String(cours.group_id),
    questions: convertirQuestionsModelesEnDonnees(deserialiserQuestionsDepuisJson(cours.questions)),
  }));
}

export async function getQuestionsForCours(groupId: string): Promise<AnyQuestion[]> {
  const all = await getAllQuestions();
  const courseQuestions = all.find(sq => sq.group_id === String(groupId));
  return courseQuestions ? courseQuestions.questions : [];
}

export async function questionNameExists(groupId: string, nom: string): Promise<boolean> {
  const questions = await getQuestionsForCours(groupId);
  return questions.some(q => String(q.nom).toLowerCase() === String(nom).toLowerCase());
}

export async function addQuestion(groupId: string, question: AnyQuestion): Promise<void> {
  const questionsStockees = await lireQuestionsStockage();
  const nouveauModele: Question = question instanceof Question ? question : deserialiserQuestionDepuisJson(question);

  let cours = questionsStockees.find((sq) => String(sq.group_id) === String(groupId));
  if (!cours) {
    cours = {
      group_id: String(groupId),
      questions: [],
    };
    questionsStockees.push(cours);
  }

  const questionsModeles = deserialiserQuestionsDepuisJson(cours.questions);
  const nomExiste = questionsModeles.some(
    (questionCourante) => String(questionCourante.nom).toLowerCase() === String(nouveauModele.nom).toLowerCase()
  );

  if (nomExiste) {
    throw new Error(`Une question avec le nom "${nouveauModele.nom}" existe déjà pour ce cours.`);
  }

  questionsModeles.push(nouveauModele);
  cours.questions = serialiserQuestionsPourStockage(questionsModeles);

  await ecrireQuestionsStockage(questionsStockees);
}

