export abstract class Question {
  constructor(
    public nom: string,
    public énoncé: string,
    public retroactionValide: string,
    public retroactionInvalide: string,
    public tags: string[]
  ) {}

  abstract obtenirType(): string;
}

export type DonneesQuestion = {
  nom: string;
  énoncé: string;
  retroactionValide: string;
  retroactionInvalide: string;
  tags: string[];
  type: "VraiFaux" | "ChoixMultiple" | "MiseEnCorrespondance" | "ReponseCourte" | "Numerique" | "Essai";
};

export type QuestionVraiFaux = DonneesQuestion & {
  type: "VraiFaux";
  reponse: boolean;
  retroaction: string;
};

export type ReponseChoixMultiple = {
  text: string;
  estBonneReponse: boolean;
  retroaction: string;
};

export type QuestionChoixMultiple = DonneesQuestion & {
  type: "ChoixMultiple";
  seulementUnChoix: boolean;
  reponses: ReponseChoixMultiple[];
};

export type PairDeCorrespondance = {
  question: string;
  reponse: string;
};

export type QuestionMiseEnCorrespondance = DonneesQuestion & {
  type: "MiseEnCorrespondance";
  paires: PairDeCorrespondance[];
};

export type QuestionReponseCourte = DonneesQuestion & {
  type: "ReponseCourte";
  reponseAttendue: string;
  retroaction: string;
};

export type QuestionNumerique = DonneesQuestion & {
  type: "Numerique";
  reponseAttendue: number;
  retroaction: string;
};

export type QuestionEssai = DonneesQuestion & {
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
