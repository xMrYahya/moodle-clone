import {
  PairDeCorrespondance,
  Question,
  QuestionChoixMultipleModele,
  QuestionEssaiModele,
  QuestionMiseEnCorrespondanceModele,
  QuestionNumeriqueModele,
  QuestionReponseCourteModele,
  QuestionVraiFauxModele,
  ReponseChoixMultiple,
} from "../types/questionTypes";

type ObjetJson = Record<string, unknown>;

function estObjet(valeur: unknown): valeur is ObjetJson {
  return typeof valeur === "object" && valeur !== null;
}

function lireTexte(valeur: unknown): string {
  return typeof valeur === "string" ? valeur.trim() : "";
}

function lireTags(valeur: unknown): string[] {
  if (!Array.isArray(valeur)) {
    return [];
  }

  return valeur.map((tag) => String(tag).trim()).filter((tag) => tag.length > 0);
}

function lireBase(donnees: ObjetJson) {
  return {
    nom: lireTexte(donnees.nom),
    énoncé: lireTexte(donnees.énoncé),
    retroactionValide: lireTexte(donnees.retroactionValide),
    retroactionInvalide: lireTexte(donnees.retroactionInvalide),
    tags: lireTags(donnees.tags),
  };
}

function lireReponsesChoixMultiple(valeur: unknown): ReponseChoixMultiple[] {
  if (!Array.isArray(valeur)) {
    return [];
  }

  return valeur
    .filter(estObjet)
    .map((item) => ({
      text: lireTexte(item.text),
      estBonneReponse: item.estBonneReponse === true,
      retroaction: lireTexte(item.retroaction),
    }));
}

function lirePairesCorrespondance(valeur: unknown): PairDeCorrespondance[] {
  if (!Array.isArray(valeur)) {
    return [];
  }

  return valeur
    .filter(estObjet)
    .map((item) => ({
      question: lireTexte(item.question),
      reponse: lireTexte(item.reponse),
    }));
}

export function deserialiserQuestionDepuisJson(donneesBrutes: unknown): Question {
  if (!estObjet(donneesBrutes)) {
    throw new Error("Question JSON invalide: objet attendu");
  }

  const base = lireBase(donneesBrutes);

  if (Array.isArray(donneesBrutes.reponses) || typeof donneesBrutes.seulementUnChoix === "boolean") {
    return new QuestionChoixMultipleModele(
      base.nom,
      base.énoncé,
      base.retroactionValide,
      base.retroactionInvalide,
      base.tags,
      donneesBrutes.seulementUnChoix === true,
      lireReponsesChoixMultiple(donneesBrutes.reponses)
    );
  }

  if (Array.isArray(donneesBrutes.paires)) {
    return new QuestionMiseEnCorrespondanceModele(
      base.nom,
      base.énoncé,
      base.retroactionValide,
      base.retroactionInvalide,
      base.tags,
      lirePairesCorrespondance(donneesBrutes.paires)
    );
  }

  if (typeof donneesBrutes.reponseAttendue === "number") {
    return new QuestionNumeriqueModele(
      base.nom,
      base.énoncé,
      base.retroactionValide,
      base.retroactionInvalide,
      base.tags,
      donneesBrutes.reponseAttendue,
      lireTexte(donneesBrutes.retroaction)
    );
  }

  if (typeof donneesBrutes.reponseAttendue === "string") {
    return new QuestionReponseCourteModele(
      base.nom,
      base.énoncé,
      base.retroactionValide,
      base.retroactionInvalide,
      base.tags,
      lireTexte(donneesBrutes.reponseAttendue),
      lireTexte(donneesBrutes.retroaction)
    );
  }

  if (typeof donneesBrutes.reponse === "boolean") {
    return new QuestionVraiFauxModele(
      base.nom,
      base.énoncé,
      base.retroactionValide,
      base.retroactionInvalide,
      base.tags,
      donneesBrutes.reponse,
      lireTexte(donneesBrutes.retroaction)
    );
  }

  return new QuestionEssaiModele(
    base.nom,
    base.énoncé,
    base.retroactionValide,
    base.retroactionInvalide,
    base.tags
  );
}

export function deserialiserQuestionsDepuisJson(donneesBrutes: unknown): Question[] {
  if (!Array.isArray(donneesBrutes)) {
    return [];
  }

  return donneesBrutes
    .map((questionBrute) => {
      try {
        return deserialiserQuestionDepuisJson(questionBrute);
      } catch {
        return null;
      }
    })
    .filter((question): question is Question => question !== null);
}
