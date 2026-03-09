import { promises as fs } from "fs";
import path from "path";
import { recupererQuestionsDuCours } from "./coursStore";
import { AnyQuestion } from "../types/questionTypes";
import {
  QuestionTagInfo,
  Questionnaire,
  StockageQuestionnairesParCours,
} from "../types/questionnaireTypes";

const QUESTIONNAIRES_PATH = path.join(process.cwd(), "data", "questionnaires.json");

async function assurerFichierQuestionnaires() {
  await fs.mkdir(path.dirname(QUESTIONNAIRES_PATH), { recursive: true });
  try {
    await fs.access(QUESTIONNAIRES_PATH);
  } catch {
    await fs.writeFile(
      QUESTIONNAIRES_PATH,
      JSON.stringify({ questionnairesParCours: [] }, null, 2),
      "utf-8"
    );
  }
}

async function ecrireQuestionnairesParCours(
  donnees: StockageQuestionnairesParCours[]
): Promise<void> {
  await fs.writeFile(
    QUESTIONNAIRES_PATH,
    JSON.stringify({ questionnairesParCours: donnees }, null, 2),
    "utf-8"
  );
}

export async function viderQuestionnairesAuDemarrage(): Promise<void> {
  await fs.mkdir(path.dirname(QUESTIONNAIRES_PATH), { recursive: true });
  await fs.writeFile(
    QUESTIONNAIRES_PATH,
    JSON.stringify({ questionnairesParCours: [] }, null, 2),
    "utf-8"
  );
}

export async function obtenirTousQuestionnairesParCours(): Promise<StockageQuestionnairesParCours[]> {
  await assurerFichierQuestionnaires();
  const brut = await fs.readFile(QUESTIONNAIRES_PATH, "utf-8");
  const json = JSON.parse(brut);
  return Array.isArray(json.questionnairesParCours) ? json.questionnairesParCours : [];
}

export async function obtenirQuestionnairesAssocies(idGroupe: string): Promise<Questionnaire[]> {
  const donnees = await obtenirTousQuestionnairesParCours();
  const cours = donnees.find((c) => c.idGroupe === String(idGroupe));
  return cours?.questionnaires ?? [];
}

export async function obtenirQuestionnaireParNom(
  idGroupe: string,
  nomQuestionnaire: string
): Promise<Questionnaire | undefined> {
  const questionnaires = await obtenirQuestionnairesAssocies(idGroupe);
  return questionnaires.find(
    (q) => String(q.nom).toLowerCase() === String(nomQuestionnaire).toLowerCase()
  );
}

export async function verifierSupprimerQuestionnaire(
  idGroupe: string,
  nomQuestionnaire: string
): Promise<{ confirmation: boolean; questionnaire?: Questionnaire }> {
  const questionnaire = await obtenirQuestionnaireParNom(idGroupe, nomQuestionnaire);
  if (!questionnaire) {
    throw new Error(`Questionnaire introuvable: ${nomQuestionnaire}`);
  }

  const nombreReponses = Array.isArray(questionnaire.resultatsEtudiants)
    ? questionnaire.resultatsEtudiants.length
    : 0;

  return {
    confirmation: nombreReponses === 0,
    questionnaire,
  };
}

export async function creerQuestionnaire(
  idGroupe: string,
  nom: string,
  description: string,
  actif: boolean
): Promise<Questionnaire> {
  const existe = await obtenirQuestionnaireParNom(idGroupe, nom);
  if (existe) {
    throw new Error(`Un questionnaire avec le nom "${nom}" existe deja.`);
  }

  const maintenant = new Date().toISOString();
  return {
    nom: String(nom).trim(),
    description: String(description ?? "").trim(),
    actif: Boolean(actif),
    questions: [],
    resultatsEtudiants: [],
    creeLe: maintenant,
    modifieLe: maintenant,
  };
}

export async function ajouterQuestionnaire(idGroupe: string, questionnaire: Questionnaire): Promise<void> {
  const donnees = await obtenirTousQuestionnairesParCours();
  const indexCours = donnees.findIndex((c) => c.idGroupe === String(idGroupe));

  if (indexCours < 0) {
    donnees.push({
      idGroupe: String(idGroupe),
      questionnaires: [questionnaire],
    });
  } else {
    donnees[indexCours].questionnaires.push(questionnaire);
  }

  await ecrireQuestionnairesParCours(donnees);
}

export async function sauvegarderQuestionsQuestionnaire(
  idGroupe: string,
  nomQuestionnaire: string,
  questionsTemp: string[]
): Promise<boolean> {
  const donnees = await obtenirTousQuestionnairesParCours();
  const indexCours = donnees.findIndex((c) => c.idGroupe === String(idGroupe));
  if (indexCours < 0) return false;

  const indexQ = donnees[indexCours].questionnaires.findIndex(
    (q) => String(q.nom).toLowerCase() === String(nomQuestionnaire).toLowerCase()
  );
  if (indexQ < 0) return false;

  const courant = donnees[indexCours].questionnaires[indexQ];
  donnees[indexCours].questionnaires[indexQ] = {
    ...courant,
    questions: Array.isArray(questionsTemp)
      ? [...new Set(questionsTemp.map(String).filter((nom) => nom.trim().length > 0))]
      : courant.questions,
    modifieLe: new Date().toISOString(),
  };

  await ecrireQuestionnairesParCours(donnees);
  return true;
}

export async function supprimerQuestionnaire(
  idGroupe: string,
  nomQuestionnaire: string
): Promise<boolean> {
  const donnees = await obtenirTousQuestionnairesParCours();
  const indexCours = donnees.findIndex((c) => c.idGroupe === String(idGroupe));
  if (indexCours < 0) return false;

  const questionnairesAvant = donnees[indexCours].questionnaires;
  const questionnairesApres = questionnairesAvant.filter(
    (q) => String(q.nom).toLowerCase() !== String(nomQuestionnaire).toLowerCase()
  );

  if (questionnairesApres.length === questionnairesAvant.length) {
    return false;
  }

  donnees[indexCours].questionnaires = questionnairesApres;
  await ecrireQuestionnairesParCours(donnees);
  return true;
}

export async function modifierQuestionnaire(
  idGroupe: string,
  nomOriginal: string,
  nom: string,
  description: string,
  actif: boolean,
  questions: string[]
): Promise<boolean> {
  const donnees = await obtenirTousQuestionnairesParCours();
  const indexCours = donnees.findIndex((c) => c.idGroupe === String(idGroupe));
  if (indexCours < 0) return false;

  const questionnaires = donnees[indexCours].questionnaires;
  const indexQ = questionnaires.findIndex(
    (q) => String(q.nom).toLowerCase() === String(nomOriginal).toLowerCase()
  );
  if (indexQ < 0) return false;

  const questionnaireCourant = questionnaires[indexQ];
  const nombreReponses = Array.isArray(questionnaireCourant.resultatsEtudiants)
    ? questionnaireCourant.resultatsEtudiants.length
    : 0;

  if (nombreReponses > 0) {
    throw new Error("Modification impossible: ce questionnaire a ete realise par au moins un etudiant.");
  }

  const nomNettoye = String(nom).trim();
  const nomExiste = questionnaires.some(
    (q, idx) => idx !== indexQ && String(q.nom).toLowerCase() === nomNettoye.toLowerCase()
  );
  if (nomExiste) {
    throw new Error(`Un questionnaire avec le nom "${nomNettoye}" existe deja.`);
  }

  questionnaires[indexQ] = {
    ...questionnaireCourant,
    nom: nomNettoye,
    description: String(description ?? "").trim(),
    actif: Boolean(actif),
    questions: Array.isArray(questions)
      ? [...new Set(questions.map(String).filter((n) => n.trim().length > 0))]
      : questionnaireCourant.questions,
    modifieLe: new Date().toISOString(),
  };

  donnees[indexCours].questionnaires = questionnaires;
  await ecrireQuestionnairesParCours(donnees);
  return true;
}

function extraireTagsQuestion(question: AnyQuestion): string[] {
  if (Array.isArray((question as any).tags)) {
    return (question as any).tags.map(String).map((t) => t.trim()).filter((t) => t.length > 0);
  }
  return [];
}

export async function obtenirListeTagsDesQuestions(idGroupe: string): Promise<string[]> {
  const questions = await recupererQuestionsDuCours(idGroupe);
  const tagsSet = new Set<string>();
  for (const q of questions) {
    for (const tag of extraireTagsQuestion(q)) {
      tagsSet.add(tag);
    }
  }
  return Array.from(tagsSet).sort((a, b) => a.localeCompare(b, "fr"));
}

export async function obtenirQuestionParNom(
  idGroupe: string,
  nomQuestion: string
): Promise<AnyQuestion | undefined> {
  const questions = await recupererQuestionsDuCours(idGroupe);
  return questions.find((q: any) => String(q.nom).toLowerCase() === String(nomQuestion).toLowerCase());
}

export async function obtenirQuestionsParTag(
  idGroupe: string,
  nomTag: string
): Promise<QuestionTagInfo[]> {
  const [questionsCours, questionnaires] = await Promise.all([
    recupererQuestionsDuCours(idGroupe),
    obtenirQuestionnairesAssocies(idGroupe),
  ]);

  const tagRecherche = String(nomTag).trim();
  const utilisationParQuestion = new Map<string, number>();
  for (const questionnaire of questionnaires) {
    const uniques = new Set((questionnaire.questions || []).map((q) => String(q)));
    for (const nomQuestion of uniques) {
      utilisationParQuestion.set(nomQuestion, (utilisationParQuestion.get(nomQuestion) ?? 0) + 1);
    }
  }

  return questionsCours
    .filter((question: any) => extraireTagsQuestion(question).includes(tagRecherche))
    .map((question: any) => ({
      nom: String(question.nom),
      tags: extraireTagsQuestion(question),
      utilisationQuestionnaires: utilisationParQuestion.get(String(question.nom)) ?? 0,
    }));
}
