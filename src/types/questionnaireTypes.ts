export type StatutCorrectionQuestionnaire = "corrige_automatiquement" | "en_attente_correction" | "corrige";

export type ResultatQuestionEtudiant = {
  nomQuestion: string;
  type: string;
  enonce: string;
  reponseEtudiant: string;
  statutCorrection: "corrige_automatiquement" | "en_attente_correction" | "corrige";
  estBonneReponse?: boolean;
  retroaction: string;
};

export type ResultatEtudiantQuestionnaire = {
  courrielEtudiant: string;
  note?: number;
  statutGlobal: StatutCorrectionQuestionnaire;
  detailsCorrection?: ResultatQuestionEtudiant[];
};

export type Questionnaire = {
  nom: string;
  description: string;
  actif: boolean;
  questions: string[];
  resultatsEtudiants: ResultatEtudiantQuestionnaire[];
  creeLe: string;
  modifieLe: string;
};

export type QuestionnaireTemp = {
  mode?: "ajout" | "modification";
  nomOriginal?: string;
  nomQuestionnaire: string;
  description?: string;
  actif?: boolean;
  questions: string[];
};

export type QuestionTagInfo = {
  nom: string;
  tags: string[];
  utilisationQuestionnaires: number;
};

export type StockageQuestionnairesParCours = {
  idGroupe: string;
  questionnaires: Questionnaire[];
};
