import { DonneesQuestionParType } from "../types/tentativeTypes";
import { PairDeCorrespondance } from "../types/questionTypes";

export interface ValidateurReponse {
  valider(reponse: unknown): { valide: boolean; message?: string };
  estBonneReponse(reponse: unknown, bonnRep: unknown): boolean;
  obtenirRetroaction(
    reponse: unknown,
    donnees: DonneesQuestionParType,
    retroactionValide: string,
    retroactionInvalide: string
  ): string;
}

export class ValidateurVraiFaux implements ValidateurReponse {
  valider(reponse: unknown): { valide: boolean; message?: string } {
    if (typeof reponse === "string") {
      const val = reponse.trim().toLowerCase();
      if (val === "true" || val === "false") {
        return { valide: true };
      }
    }
    if (typeof reponse === "boolean") {
      return { valide: true };
    }
    return { valide: false, message: "Veuillez selectionner Vrai ou Faux" };
  }

  estBonneReponse(reponse: unknown, donnees: unknown): boolean {
    if (!donnees || typeof donnees !== "object" || !("bonneReponse" in donnees)) {
      return false;
    }
    const data = donnees as { bonneReponse: boolean };
    const reponseVal = typeof reponse === "string" ? reponse.trim().toLowerCase() === "true" : Boolean(reponse);
    return reponseVal === data.bonneReponse;
  }

  obtenirRetroaction(
    reponse: unknown,
    donnees: DonneesQuestionParType,
    retroactionValide: string,
    retroactionInvalide: string
  ): string {
    const estBonne = this.estBonneReponse(reponse, donnees);
    return estBonne ? retroactionValide : retroactionInvalide;
  }
}

export class ValidateurChoixMultiple implements ValidateurReponse {
  valider(reponse: unknown): { valide: boolean; message?: string } {
    if (typeof reponse === "string") {
      if (!reponse.trim()) {
        return { valide: false, message: "Veuillez selectionner une reponse valide" };
      }
      return { valide: true };
    }

    if (Array.isArray(reponse)) {
      const choix = reponse.map((v) => String(v).trim()).filter((v) => v.length > 0);
      if (choix.length === 0) {
        return { valide: false, message: "Veuillez selectionner au moins une reponse" };
      }
      return { valide: true };
    }

    return { valide: false, message: "Veuillez selectionner une reponse valide" };
  }

  estBonneReponse(reponse: unknown, donnees: unknown): boolean {
    if (!donnees || typeof donnees !== "object") {
      return false;
    }

    const data = donnees as {
      seulementUnChoix?: boolean;
      bonneReponse?: string;
      bonnesReponses?: string[];
    };

    const bonnesReponses = Array.isArray(data.bonnesReponses)
      ? data.bonnesReponses.map((v) => String(v).trim().toLowerCase()).filter((v) => v.length > 0)
      : String(data.bonneReponse ?? "").trim()
        ? [String(data.bonneReponse ?? "").trim().toLowerCase()]
        : [];

    if (bonnesReponses.length === 0) {
      return false;
    }

    const seulementUnChoix = data.seulementUnChoix !== false;

    if (seulementUnChoix) {
      const reponseSimple = Array.isArray(reponse)
        ? String(reponse[0] ?? "").trim().toLowerCase()
        : String(reponse ?? "").trim().toLowerCase();
      return reponseSimple.length > 0 && reponseSimple === bonnesReponses[0];
    }

    const reponsesEtudiant = Array.isArray(reponse)
      ? reponse.map((v) => String(v).trim().toLowerCase()).filter((v) => v.length > 0)
      : String(reponse ?? "")
        .split("|")
        .map((v) => v.trim().toLowerCase())
        .filter((v) => v.length > 0);

    const uniquesEtudiant = [...new Set(reponsesEtudiant)].sort();
    const uniquesBonnes = [...new Set(bonnesReponses)].sort();

    if (uniquesEtudiant.length !== uniquesBonnes.length) {
      return false;
    }

    return uniquesEtudiant.every((value, index) => value === uniquesBonnes[index]);
  }

  obtenirRetroaction(
    reponse: unknown,
    donnees: DonneesQuestionParType,
    retroactionValide: string,
    retroactionInvalide: string
  ): string {
    if (!donnees || typeof donnees !== "object" || !("retroactionParChoix" in donnees)) {
      return this.estBonneReponse(reponse, donnees) ? retroactionValide : retroactionInvalide;
    }

    const data = donnees as { retroactionParChoix: Record<string, string> };
    const reponseStr = Array.isArray(reponse) ? String(reponse[0] ?? "") : String(reponse ?? "");
    const retroactionSpecifique = data.retroactionParChoix[reponseStr] ?? "";

    if (retroactionSpecifique) {
      return retroactionSpecifique;
    }

    const estBonne = this.estBonneReponse(reponse, donnees);
    return estBonne ? retroactionValide : retroactionInvalide;
  }
}

export class ValidateurNumerique implements ValidateurReponse {
  valider(reponse: unknown): { valide: boolean; message?: string } {
    if (typeof reponse === "number") {
      return { valide: Number.isFinite(reponse) };
    }
    if (typeof reponse === "string") {
      const num = parseFloat(reponse.trim());
      return { valide: Number.isFinite(num) };
    }
    return { valide: false, message: "Veuillez entrer un nombre valide" };
  }

  estBonneReponse(reponse: unknown, donnees: unknown): boolean {
    if (!donnees || typeof donnees !== "object" || !("bonneReponse" in donnees)) {
      return false;
    }
    const data = donnees as { bonneReponse: number };
    let reponseNum: number | null = null;

    if (typeof reponse === "number") {
      reponseNum = reponse;
    } else if (typeof reponse === "string") {
      reponseNum = parseFloat(reponse.trim());
    }

    if (reponseNum === null || !Number.isFinite(reponseNum)) {
      return false;
    }

    return reponseNum === data.bonneReponse;
  }

  obtenirRetroaction(
    reponse: unknown,
    donnees: DonneesQuestionParType,
    retroactionValide: string,
    retroactionInvalide: string
  ): string {
    const estBonne = this.estBonneReponse(reponse, donnees);
    return estBonne ? retroactionValide : retroactionInvalide;
  }
}

export class ValidateurReponseCourte implements ValidateurReponse {
  valider(reponse: unknown): { valide: boolean; message?: string } {
    if (typeof reponse !== "string" || !reponse.trim()) {
      return { valide: false, message: "Veuillez entrer une reponse" };
    }
    return { valide: true };
  }

  estBonneReponse(reponse: unknown, donnees: unknown): boolean {
    if (!donnees || typeof donnees !== "object" || !("bonneReponse" in donnees)) {
      return false;
    }
    const data = donnees as { bonneReponse: string };
    const reponseStr = String(reponse ?? "").trim().toLowerCase();
    const bonneRepStr = String(data.bonneReponse).trim().toLowerCase();
    return reponseStr === bonneRepStr;
  }

  obtenirRetroaction(
    reponse: unknown,
    donnees: DonneesQuestionParType,
    retroactionValide: string,
    retroactionInvalide: string
  ): string {
    const estBonne = this.estBonneReponse(reponse, donnees);
    return estBonne ? retroactionValide : retroactionInvalide;
  }
}

export class ValidateurMiseEnCorrespondance implements ValidateurReponse {
  valider(reponse: unknown): { valide: boolean; message?: string } {
    if (typeof reponse !== "string" || !reponse.trim()) {
      return { valide: false, message: "Veuillez entrer une reponse" };
    }
    return { valide: true };
  }

  estBonneReponse(reponse: unknown, donnees: unknown): boolean {
    // MiseEnCorrespondance nécessite correction manuelle
    return false; // Toujours false, marqué pour correction manuelle
  }

  obtenirRetroaction(
    reponse: unknown,
    donnees: DonneesQuestionParType,
    retroactionValide: string,
    retroactionInvalide: string
  ): string {
    return "Votre reponse a ete recueillie et sera corrigee manuellement";
  }
}

export class ValidateurEssai implements ValidateurReponse {
  valider(reponse: unknown): { valide: boolean; message?: string } {
    if (typeof reponse !== "string" || !reponse.trim()) {
      return { valide: false, message: "Veuillez entrer une reponse" };
    }
    return { valide: true };
  }

  estBonneReponse(reponse: unknown, donnees: unknown): boolean {
    // Essai nécessite correction manuelle
    return false;
  }

  obtenirRetroaction(
    reponse: unknown,
    donnees: DonneesQuestionParType,
    retroactionValide: string,
    retroactionInvalide: string
  ): string {
    return "Votre reponse a ete recueillie et sera corrigee manuellement";
  }
}

export function obtenirValidateur(type: string): ValidateurReponse {
  switch (type) {
    case "VraiFaux":
      return new ValidateurVraiFaux();
    case "ChoixMultiple":
      return new ValidateurChoixMultiple();
    case "Numerique":
      return new ValidateurNumerique();
    case "ReponseCourte":
      return new ValidateurReponseCourte();
    case "MiseEnCorrespondance":
      return new ValidateurMiseEnCorrespondance();
    case "Essai":
      return new ValidateurEssai();
    default:
      return new ValidateurEssai(); // Fallback
  }
}
