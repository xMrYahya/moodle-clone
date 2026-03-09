import { promises as fs } from "fs";
import path from "path";
import { obtenirQuestionsDuCours } from "./CoursModele";
import { AnyQuestion } from "../types/questionTypes";
import {
  QuestionTagInfo,
  Questionnaire,
  QuestionnaireTemp,
  StockageQuestionnairesParCours,
} from "../types/questionnaireTypes";

const QUESTIONNAIRES_PATH = path.join(process.cwd(), "data", "questionnaires.json");

export class QuestionnaireModele {
  private static async assurerFichierQuestionnaires() {
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

  private static async ecrireQuestionnairesParCours(
    donnees: StockageQuestionnairesParCours[]
  ): Promise<void> {
    await fs.writeFile(
      QUESTIONNAIRES_PATH,
      JSON.stringify({ questionnairesParCours: donnees }, null, 2),
      "utf-8"
    );
  }

  private static extraireTagsQuestion(question: AnyQuestion): string[] {
    if (Array.isArray((question as any).tags)) {
      return (question as any).tags
        .map(String)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
    return [];
  }

  static async viderQuestionnairesAuDemarrage(): Promise<void> {
    await fs.mkdir(path.dirname(QUESTIONNAIRES_PATH), { recursive: true });
    await fs.writeFile(
      QUESTIONNAIRES_PATH,
      JSON.stringify({ questionnairesParCours: [] }, null, 2),
      "utf-8"
    );
  }

  static async obtenirTousQuestionnairesParCours(): Promise<StockageQuestionnairesParCours[]> {
    await QuestionnaireModele.assurerFichierQuestionnaires();
    const brut = await fs.readFile(QUESTIONNAIRES_PATH, "utf-8");
    const json = JSON.parse(brut);
    return Array.isArray(json.questionnairesParCours) ? json.questionnairesParCours : [];
  }

  static async obtenirQuestionnairesAssocies(idGroupe: string): Promise<Questionnaire[]> {
    const donnees = await QuestionnaireModele.obtenirTousQuestionnairesParCours();
    const cours = donnees.find((c) => c.idGroupe === String(idGroupe));
    return cours?.questionnaires ?? [];
  }

  static async obtenirQuestionnaireParNom(
    idGroupe: string,
    nomQuestionnaire: string
  ): Promise<Questionnaire | undefined> {
    const questionnaires = await QuestionnaireModele.obtenirQuestionnairesAssocies(idGroupe);
    return questionnaires.find(
      (q) => String(q.nom).toLowerCase() === String(nomQuestionnaire).toLowerCase()
    );
  }

  static async verifierSupprimerQuestionnaire(
    idGroupe: string,
    nomQuestionnaire: string
  ): Promise<{ confirmation: boolean; questionnaire?: Questionnaire }> {
    const questionnaire = await QuestionnaireModele.obtenirQuestionnaireParNom(
      idGroupe,
      nomQuestionnaire
    );
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

  static async creerQuestionnaire(
    idGroupe: string,
    nom: string,
    description: string,
    actif: boolean
  ): Promise<Questionnaire> {
    const existe = await QuestionnaireModele.obtenirQuestionnaireParNom(idGroupe, nom);
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

  static async ajouterQuestionnaire(idGroupe: string, questionnaire: Questionnaire): Promise<void> {
    const donnees = await QuestionnaireModele.obtenirTousQuestionnairesParCours();
    const indexCours = donnees.findIndex((c) => c.idGroupe === String(idGroupe));

    if (indexCours < 0) {
      donnees.push({
        idGroupe: String(idGroupe),
        questionnaires: [questionnaire],
      });
    } else {
      donnees[indexCours].questionnaires.push(questionnaire);
    }

    await QuestionnaireModele.ecrireQuestionnairesParCours(donnees);
  }

  static async sauvegarderQuestionnaire(
    idGroupe: string,
    nomQuestionnaire: string,
    questions: string[]
  ): Promise<boolean> {
    const donnees = await QuestionnaireModele.obtenirTousQuestionnairesParCours();
    const indexCours = donnees.findIndex((c) => c.idGroupe === String(idGroupe));
    if (indexCours < 0) return false;

    const indexQ = donnees[indexCours].questionnaires.findIndex(
      (q) => String(q.nom).toLowerCase() === String(nomQuestionnaire).toLowerCase()
    );
    if (indexQ < 0) return false;

    const courant = donnees[indexCours].questionnaires[indexQ];
    donnees[indexCours].questionnaires[indexQ] = {
      ...courant,
      questions: Array.isArray(questions)
        ? [...new Set(questions.map(String).filter((nom) => nom.trim().length > 0))]
        : courant.questions,
      modifieLe: new Date().toISOString(),
    };

    await QuestionnaireModele.ecrireQuestionnairesParCours(donnees);
    return true;
  }

  static async supprimerQuestionnaire(idGroupe: string, nomQuestionnaire: string): Promise<boolean> {
    const donnees = await QuestionnaireModele.obtenirTousQuestionnairesParCours();
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
    await QuestionnaireModele.ecrireQuestionnairesParCours(donnees);
    return true;
  }

  static async modifierQuestionnaire(
    idGroupe: string,
    nomOriginal: string,
    nom: string,
    description: string,
    actif: boolean,
    questions: string[]
  ): Promise<boolean> {
    const donnees = await QuestionnaireModele.obtenirTousQuestionnairesParCours();
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
      throw new Error(
        "Modification impossible: ce questionnaire a ete realise par au moins un etudiant."
      );
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
    await QuestionnaireModele.ecrireQuestionnairesParCours(donnees);
    return true;
  }

  static async obtenirListeTagsDesQuestions(idGroupe: string): Promise<string[]> {
    const questions = await obtenirQuestionsDuCours(idGroupe);
    const tagsSet = new Set<string>();
    for (const q of questions) {
      for (const tag of QuestionnaireModele.extraireTagsQuestion(q)) {
        tagsSet.add(tag);
      }
    }
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b, "fr"));
  }

  static async obtenirQuestionParNom(
    idGroupe: string,
    nomQuestion: string
  ): Promise<AnyQuestion | undefined> {
    const questions = await obtenirQuestionsDuCours(idGroupe);
    return questions.find(
      (q: any) => String(q.nom).toLowerCase() === String(nomQuestion).toLowerCase()
    );
  }

  static async obtenirQuestionsParTag(idGroupe: string, nomTag: string): Promise<QuestionTagInfo[]> {
    const [questionsCours, questionnaires] = await Promise.all([
      obtenirQuestionsDuCours(idGroupe),
      QuestionnaireModele.obtenirQuestionnairesAssocies(idGroupe),
    ]);

    const tagRecherche = String(nomTag).trim();
    const utilisationParQuestion = new Map<string, number>();
    for (const questionnaire of questionnaires) {
      const uniques = new Set((questionnaire.questions || []).map((q) => String(q)));
      for (const nomQuestion of uniques) {
        utilisationParQuestion.set(
          nomQuestion,
          (utilisationParQuestion.get(nomQuestion) ?? 0) + 1
        );
      }
    }

    return questionsCours
      .filter((question: any) =>
        QuestionnaireModele.extraireTagsQuestion(question).includes(tagRecherche)
      )
      .map((question: any) => ({
        nom: String(question.nom),
        tags: QuestionnaireModele.extraireTagsQuestion(question),
        utilisationQuestionnaires: utilisationParQuestion.get(String(question.nom)) ?? 0,
      }));
  }

  static ajouterQuestion(questionnaireTemp: QuestionnaireTemp, nomQuestion: string): QuestionnaireTemp {
    const nomQuestionNettoye = String(nomQuestion).trim();
    if (nomQuestionNettoye.length > 0 && !questionnaireTemp.questions.includes(nomQuestionNettoye)) {
      questionnaireTemp.questions.push(nomQuestionNettoye);
    }
    return questionnaireTemp;
  }

  static dissocierQuestion(questionnaireTemp: QuestionnaireTemp, nomQuestion: string): QuestionnaireTemp {
    const cible = String(nomQuestion);
    questionnaireTemp.questions = questionnaireTemp.questions.filter((q) => String(q) !== cible);
    return questionnaireTemp;
  }

  static modifierOrdreQuestion(
    questionnaireTemp: QuestionnaireTemp,
    nomQuestion: string,
    nouvellePosition: number
  ): QuestionnaireTemp {
    const indexActuel = questionnaireTemp.questions.findIndex(
      (q) => String(q) === String(nomQuestion)
    );
    if (indexActuel < 0) {
      return questionnaireTemp;
    }

    const [question] = questionnaireTemp.questions.splice(indexActuel, 1);
    const positionIndex = Number.isFinite(nouvellePosition) ? nouvellePosition - 1 : indexActuel;
    const borne = Math.max(0, Math.min(questionnaireTemp.questions.length, positionIndex));
    questionnaireTemp.questions.splice(borne, 0, question);
    return questionnaireTemp;
  }
}

export const viderQuestionnairesAuDemarrage = QuestionnaireModele.viderQuestionnairesAuDemarrage;
export const obtenirTousQuestionnairesParCours = QuestionnaireModele.obtenirTousQuestionnairesParCours;
export const obtenirQuestionnairesAssocies = QuestionnaireModele.obtenirQuestionnairesAssocies;
export const obtenirQuestionnaireParNom = QuestionnaireModele.obtenirQuestionnaireParNom;
export const verifierSupprimerQuestionnaire = QuestionnaireModele.verifierSupprimerQuestionnaire;
export const creerQuestionnaire = QuestionnaireModele.creerQuestionnaire;
export const ajouterQuestionnaire = QuestionnaireModele.ajouterQuestionnaire;
export const sauvegarderQuestionnaire = QuestionnaireModele.sauvegarderQuestionnaire;
export const supprimerQuestionnaire = QuestionnaireModele.supprimerQuestionnaire;
export const modifierQuestionnaire = QuestionnaireModele.modifierQuestionnaire;
export const obtenirListeTagsDesQuestions = QuestionnaireModele.obtenirListeTagsDesQuestions;
export const obtenirQuestionParNom = QuestionnaireModele.obtenirQuestionParNom;
export const obtenirQuestionsParTag = QuestionnaireModele.obtenirQuestionsParTag;
