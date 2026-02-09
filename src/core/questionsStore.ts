import { promises as fs } from "fs";
import path from "path";
import { AnyQuestion, StoredQuestions } from "../types/questionTypes";

const QUESTIONS_STORE_PATH = path.join(process.cwd(), "data", "questions.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(QUESTIONS_STORE_PATH), { recursive: true });
  try {
    await fs.access(QUESTIONS_STORE_PATH);
  } catch {
    await fs.writeFile(QUESTIONS_STORE_PATH, JSON.stringify({ questionsStore: [] }, null, 2), "utf-8");
  }
}

export async function clearQuestionsOnStartup(): Promise<void> {
  await fs.mkdir(path.dirname(QUESTIONS_STORE_PATH), { recursive: true });
  await fs.writeFile(QUESTIONS_STORE_PATH, JSON.stringify({ questionsStore: [] }, null, 2), "utf-8");
}

export async function getAllQuestions(): Promise<StoredQuestions[]> {
  await ensureFile();
  const raw = await fs.readFile(QUESTIONS_STORE_PATH, "utf-8");
  const json = JSON.parse(raw);
  return Array.isArray(json.questionsStore) ? json.questionsStore : [];
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
  const all = await getAllQuestions();
  
  if (await questionNameExists(groupId, question.nom)) {
    throw new Error(`Une question avec le nom "${question.nom}" existe déjà pour ce cours.`);
  }

  let courseQuestions = all.find(sq => sq.group_id === String(groupId));
  
  if (!courseQuestions) {
    courseQuestions = {
      group_id: String(groupId),
      questions: [question],
    };
    all.push(courseQuestions);
  } else {
    courseQuestions.questions.push(question);
  }

  await fs.writeFile(QUESTIONS_STORE_PATH, JSON.stringify({ questionsStore: all }, null, 2), "utf-8");
}

