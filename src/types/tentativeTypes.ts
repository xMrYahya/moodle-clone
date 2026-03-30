import { PairDeCorrespondance } from "./questionTypes";

export type QuestionType = "VraiFaux" | "ChoixMultiple" | "Numerique" | "ReponseCourte" | "MiseEnCorrespondance" | "Essai";

export type DonneesQuestionParType =
  | { type: "VraiFaux"; bonneReponse: boolean }
  | { type: "ChoixMultiple"; choix: string[]; bonneReponse: string; retroactionParChoix: Record<string, string> }
  | { type: "Numerique"; bonneReponse: number }
  | { type: "ReponseCourte"; bonneReponse: string }
  | { type: "MiseEnCorrespondance"; paires: PairDeCorrespondance[] }
  | { type: "Essai" };

export type QuestionEnTentative = {
  nom: string;
  enonce: string;
  type: QuestionType;
  retroactionValide: string;
  retroactionInvalide: string;
  donnees: DonneesQuestionParType;
};

export type TentativeQuestionnaireSession = {
  idGroupe: string;
  nomQuestionnaire: string;
  etudiantId: string;
  typeId: number;
  contientCorrectionManuelle: boolean;
  indexQuestionCourante: number;
  questions: QuestionEnTentative[];
  reponses: (string | number | boolean)[];
};
