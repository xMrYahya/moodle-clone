import {
  AnyQuestion,
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

function lireBooleen(valeur: unknown): boolean {
  if (typeof valeur === "boolean") {
    return valeur;
  }
  if (typeof valeur === "string") {
    return valeur.trim().toLowerCase() === "true";
  }
  return false;
}

function lireNombre(valeur: unknown): number | null {
  if (typeof valeur === "number" && Number.isFinite(valeur)) {
    return valeur;
  }
  if (typeof valeur === "string") {
    const nombre = Number.parseFloat(valeur.trim());
    return Number.isFinite(nombre) ? nombre : null;
  }
  return null;
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
    enonce: lireTexte(donnees.enonce),
    retroactionValide: lireTexte(donnees.retroactionValide),
    retroactionInvalide: lireTexte(donnees.retroactionInvalide),
    tags: lireTags(donnees.tags),
  };
}

function lireReponsesChoixMultiple(valeur: unknown): ReponseChoixMultiple[] {
  if (typeof valeur === "string") {
    const parties = valeur
      .split("|")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return parties.map((texte, index) => ({
      texte,
      estBonneReponse: index === 0,
      retroaction: "",
    }));
  }

  if (!Array.isArray(valeur)) {
    return [];
  }

  return valeur
    .filter(estObjet)
    .map((item) => ({
      texte: lireTexte(item.texte),
      estBonneReponse: item.estBonneReponse === true,
      retroaction: lireTexte(item.retroaction),
    }));
}

function lirePairesCorrespondance(valeur: unknown): PairDeCorrespondance[] {
  if (typeof valeur === "string") {
    return valeur
      .split("|")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => {
        const separateur = item.indexOf(":");
        if (separateur === -1) {
          return { question: item, reponse: "" };
        }
        return {
          question: item.slice(0, separateur).trim(),
          reponse: item.slice(separateur + 1).trim(),
        };
      });
  }

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

  if (donneesBrutes.reponses !== undefined || donneesBrutes.seulementUnChoix !== undefined) {
    return new QuestionChoixMultipleModele(
      base.nom,
      base.enonce,
      base.retroactionValide,
      base.retroactionInvalide,
      base.tags,
      lireBooleen(donneesBrutes.seulementUnChoix),
      lireReponsesChoixMultiple(donneesBrutes.reponses)
    );
  }

  if (donneesBrutes.paires !== undefined) {
    return new QuestionMiseEnCorrespondanceModele(
      base.nom,
      base.enonce,
      base.retroactionValide,
      base.retroactionInvalide,
      base.tags,
      lirePairesCorrespondance(donneesBrutes.paires)
    );
  }

  if (donneesBrutes.reponseAttendue !== undefined) {
    const reponseNumerique = lireNombre(donneesBrutes.reponseAttendue);
    if (reponseNumerique !== null) {
      return new QuestionNumeriqueModele(
        base.nom,
        base.enonce,
        base.retroactionValide,
        base.retroactionInvalide,
        base.tags,
        reponseNumerique,
        lireTexte(donneesBrutes.retroaction)
      );
    }

    return new QuestionReponseCourteModele(
      base.nom,
      base.enonce,
      base.retroactionValide,
      base.retroactionInvalide,
      base.tags,
      lireTexte(donneesBrutes.reponseAttendue),
      lireTexte(donneesBrutes.retroaction)
    );
  }

  if (donneesBrutes.reponse !== undefined) {
    if (typeof donneesBrutes.reponse === "boolean") {
      return new QuestionVraiFauxModele(
        base.nom,
        base.enonce,
        base.retroactionValide,
        base.retroactionInvalide,
        base.tags,
        donneesBrutes.reponse,
        lireTexte(donneesBrutes.retroaction)
      );
    }

    if (typeof donneesBrutes.reponse === "string") {
      const reponseTexte = donneesBrutes.reponse.trim();
      if (reponseTexte.toLowerCase() === "true" || reponseTexte.toLowerCase() === "false") {
        return new QuestionVraiFauxModele(
          base.nom,
          base.enonce,
          base.retroactionValide,
          base.retroactionInvalide,
          base.tags,
          reponseTexte.toLowerCase() === "true",
          lireTexte(donneesBrutes.retroaction)
        );
      }

      const reponseNumerique = lireNombre(reponseTexte);
      if (reponseNumerique !== null) {
        return new QuestionNumeriqueModele(
          base.nom,
          base.enonce,
          base.retroactionValide,
          base.retroactionInvalide,
          base.tags,
          reponseNumerique,
          lireTexte(donneesBrutes.retroaction)
        );
      }

      return new QuestionReponseCourteModele(
        base.nom,
        base.enonce,
        base.retroactionValide,
        base.retroactionInvalide,
        base.tags,
        reponseTexte,
        lireTexte(donneesBrutes.retroaction)
      );
    }

    const reponseNumerique = lireNombre(donneesBrutes.reponse);
    if (reponseNumerique !== null) {
      return new QuestionNumeriqueModele(
        base.nom,
        base.enonce,
        base.retroactionValide,
        base.retroactionInvalide,
        base.tags,
        reponseNumerique,
        lireTexte(donneesBrutes.retroaction)
      );
    }
  }

  return new QuestionEssaiModele(
    base.nom,
    base.enonce,
    base.retroactionValide,
    base.retroactionInvalide,
    base.tags
  );
}

function serialiserBase(question: Question) {
  return {
    nom: question.nom,
    enonce: question.enonce,
    retroactionValide: question.retroactionValide,
    retroactionInvalide: question.retroactionInvalide,
    tags: question.tags,
  };
}

export function serialiserQuestionPourStockage(question: Question): Record<string, unknown> {
  const base = serialiserBase(question);

  if (question instanceof QuestionVraiFauxModele) {
    return {
      ...base,
      reponse: question.reponse,
      retroaction: question.retroaction,
    };
  }

  if (question instanceof QuestionChoixMultipleModele) {
    return {
      ...base,
      seulementUnChoix: question.seulementUnChoix,
      reponses: question.reponses,
    };
  }

  if (question instanceof QuestionMiseEnCorrespondanceModele) {
    return {
      ...base,
      paires: question.paires,
    };
  }

  if (question instanceof QuestionReponseCourteModele) {
    return {
      ...base,
      reponseAttendue: question.reponseAttendue,
      retroaction: question.retroaction,
    };
  }

  if (question instanceof QuestionNumeriqueModele) {
    return {
      ...base,
      reponseAttendue: question.reponseAttendue,
      retroaction: question.retroaction,
    };
  }

  return base;
}

export function convertirQuestionModeleEnDonnees(question: Question): AnyQuestion {
  const base = {
    nom: question.nom,
    enonce: question.enonce,
    retroactionValide: question.retroactionValide,
    retroactionInvalide: question.retroactionInvalide,
    tags: question.tags,
  };

  if (question instanceof QuestionVraiFauxModele) {
    return {
      ...base,
      type: "VraiFaux",
      reponse: question.reponse,
      retroaction: question.retroaction,
    };
  }

  if (question instanceof QuestionChoixMultipleModele) {
    return {
      ...base,
      type: "ChoixMultiple",
      seulementUnChoix: question.seulementUnChoix,
      reponses: question.reponses,
    };
  }

  if (question instanceof QuestionMiseEnCorrespondanceModele) {
    return {
      ...base,
      type: "MiseEnCorrespondance",
      paires: question.paires,
    };
  }

  if (question instanceof QuestionReponseCourteModele) {
    return {
      ...base,
      type: "ReponseCourte",
      reponseAttendue: question.reponseAttendue,
      retroaction: question.retroaction,
    };
  }

  if (question instanceof QuestionNumeriqueModele) {
    return {
      ...base,
      type: "Numerique",
      reponseAttendue: question.reponseAttendue,
      retroaction: question.retroaction,
    };
  }

  return {
    ...base,
    type: "Essai",
  };
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

export function convertirQuestionsModelesEnDonnees(questions: Question[]): AnyQuestion[] {
  return questions.map((question) => convertirQuestionModeleEnDonnees(question));
}

export function serialiserQuestionsPourStockage(questions: Question[]): Record<string, unknown>[] {
  return questions.map((question) => serialiserQuestionPourStockage(question));
}
