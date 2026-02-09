import { promises as fs } from "fs";
import path from "path";

export type StoredCours = {
  group_id: string;
  day: string;
  hours: string;
  activity: string;
  mode: string;
  local: string;
  teacher_id: string;

  course_id?: string;
  course_titre?: string;
};


const STORE_PATH = path.join(process.cwd(), "data", "cours.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify({ courses: [] }, null, 2), "utf-8");
  }
}

export async function clearStoreOnStartup(): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify({ courses: [] }, null, 2), "utf-8");
}

export async function getAllStored(): Promise<StoredCours[]> {
  await ensureFile();
  const raw = await fs.readFile(STORE_PATH, "utf-8");
  const json = JSON.parse(raw);
  return Array.isArray(json.courses) ? json.courses : [];
}

export async function getStoredForTeacher(teacherId: string): Promise<StoredCours[]> {
  const all = await getAllStored();
  return all.filter(c => String(c.teacher_id) === String(teacherId));
}

export async function getStoredByGroupId(groupId: string): Promise<StoredCours | undefined> {
  const all = await getAllStored();
  return all.find(c => c.group_id === String(groupId));
}

export async function addStored(course: StoredCours): Promise<void> {
  const all = await getAllStored();
  const exists = all.some(c => c.group_id === course.group_id);
  if (!exists) {
    all.push(course);
    await fs.writeFile(STORE_PATH, JSON.stringify({ courses: all }, null, 2), "utf-8");
  }
}

export async function removeStored(groupId: string): Promise<void> {
  const all = await getAllStored();
  const next = all.filter(c => c.group_id !== groupId);
  await fs.writeFile(STORE_PATH, JSON.stringify({ courses: next }, null, 2), "utf-8");
}
