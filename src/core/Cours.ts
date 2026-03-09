import { StudentInfo } from "./sgbClient";
import { AnyQuestion } from "../types/questionTypes";

export type CoursInit = {
  idGroupe: string;
  jour: string;
  heure: string;
  activite: string;
  mode: string;
  local: string;
  idEnseignant: string;
  idCours?: string;
  titreCours?: string;
  etudiants?: StudentInfo[];
  questions?: AnyQuestion[];
};

export class Cours {
  idGroupe: string;
  jour: string;
  heure: string;
  activite: string;
  mode: string;
  local: string;
  idEnseignant: string;
  idCours?: string;
  titreCours?: string;
  etudiants: StudentInfo[];
  questions: AnyQuestion[];

  constructor(init: CoursInit) {
    this.idGroupe = String(init.idGroupe);
    this.jour = String(init.jour);
    this.heure = String(init.heure);
    this.activite = String(init.activite);
    this.mode = String(init.mode);
    this.local = String(init.local);
    this.idEnseignant = String(init.idEnseignant);
    this.idCours = init.idCours ? String(init.idCours) : undefined;
    this.titreCours = init.titreCours ? String(init.titreCours) : undefined;
    this.etudiants = Array.isArray(init.etudiants) ? init.etudiants : [];
    this.questions = Array.isArray(init.questions) ? init.questions : [];
  }

  toPlainObject(): CoursInit {
    return {
      idGroupe: this.idGroupe,
      jour: this.jour,
      heure: this.heure,
      activite: this.activite,
      mode: this.mode,
      local: this.local,
      idEnseignant: this.idEnseignant,
      idCours: this.idCours,
      titreCours: this.titreCours,
      etudiants: this.etudiants,
      questions: this.questions,
    };
  }
}
