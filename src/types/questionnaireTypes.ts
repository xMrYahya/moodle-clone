export type ResultatEtudiantQuestionnaire = {
  courrielEtudiant: string;
  note: number;
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
