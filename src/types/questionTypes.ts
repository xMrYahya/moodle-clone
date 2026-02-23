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

export class QuestionVraiFauxModele extends Question {
  constructor(
    nom: string,
    énoncé: string,
    retroactionValide: string,
    retroactionInvalide: string,
    tags: string[],
    public reponse: boolean,
    public retroaction: string
  ) {
    super(nom, énoncé, retroactionValide, retroactionInvalide, tags);
  }

  obtenirType(): string {
    return "VraiFaux";
  }
}

export class QuestionChoixMultipleModele extends Question {
  constructor(
    nom: string,
    énoncé: string,
    retroactionValide: string,
    retroactionInvalide: string,
    tags: string[],
    public seulementUnChoix: boolean,
    public reponses: ReponseChoixMultiple[]
  ) {
    super(nom, énoncé, retroactionValide, retroactionInvalide, tags);
  }

  obtenirType(): string {
    return "ChoixMultiple";
  }
}

export class QuestionMiseEnCorrespondanceModele extends Question {
  constructor(
    nom: string,
    énoncé: string,
    retroactionValide: string,
    retroactionInvalide: string,
    tags: string[],
    public paires: PairDeCorrespondance[]
  ) {
    super(nom, énoncé, retroactionValide, retroactionInvalide, tags);
  }

  obtenirType(): string {
    return "MiseEnCorrespondance";
  }
}

export class QuestionReponseCourteModele extends Question {
  constructor(
    nom: string,
    énoncé: string,
    retroactionValide: string,
    retroactionInvalide: string,
    tags: string[],
    public reponseAttendue: string,
    public retroaction: string
  ) {
    super(nom, énoncé, retroactionValide, retroactionInvalide, tags);
  }

  obtenirType(): string {
    return "ReponseCourte";
  }
}

export class QuestionNumeriqueModele extends Question {
  constructor(
    nom: string,
    énoncé: string,
    retroactionValide: string,
    retroactionInvalide: string,
    tags: string[],
    public reponseAttendue: number,
    public retroaction: string
  ) {
    super(nom, énoncé, retroactionValide, retroactionInvalide, tags);
  }

  obtenirType(): string {
    return "Numerique";
  }
}

export class QuestionEssaiModele extends Question {
  obtenirType(): string {
    return "Essai";
  }
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
