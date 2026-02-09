export type Question = {
  nom: string;
  énoncé: string;
  retroactionValide: string;
  retroactionInvalide: string;
  tags: string[];
  type: "VraiFaux" | "ChoixMultiple" | "MiseEnCorrespondance" | "ReponseCourte" | "Numerique" | "Essai";
};

export type QuestionVraiFaux = Question & {
  type: "VraiFaux";
  reponse: boolean;
  retroaction: string;
};

export type ReponseChoixMultiple = {
  text: string;
  estBonneReponse: boolean;
  retroaction: string;
};

export type QuestionChoixMultiple = Question & {
  type: "ChoixMultiple";
  seulementUnChoix: boolean;
  reponses: ReponseChoixMultiple[];
};

export type PairDeCorrespondance = {
  question: string;
  reponse: string;
};

export type QuestionMiseEnCorrespondance = Question & {
  type: "MiseEnCorrespondance";
  paires: PairDeCorrespondance[];
};

export type QuestionReponseCourte = Question & {
  type: "ReponseCourte";
  reponseAttendue: string;
  retroaction: string;
};

export type QuestionNumerique = Question & {
  type: "Numerique";
  reponseAttendue: number;
  retroaction: string;
};

export type QuestionEssai = Question & {
  type: "Essai";
};

export type AnyQuestion = 
  | QuestionVraiFaux 
  | QuestionChoixMultiple 
  | QuestionMiseEnCorrespondance 
  | QuestionReponseCourte 
  | QuestionNumerique 
  | QuestionEssai;

export type StoredQuestions = {
  group_id: string;
  questions: AnyQuestion[];
};
