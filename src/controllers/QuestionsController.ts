import { Response } from "express";
import { 
  addQuestion, 
  questionNameExists 
} from "../core/coursStore";
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
import { AlreadyExistsError } from "../core/errors/alreadyExistsError";
import { InvalidParameterError } from "../core/errors/invalidParameterError";
import { convertirQuestionModeleEnDonnees } from "../core/questionsFactory";

export class QuestionsController {
  private static lireTags(tags: unknown): string[] {
    if (Array.isArray(tags)) {
      return tags.map(String).map((t) => t.trim()).filter((t) => t.length > 0);
    }

    if (tags) {
      return String(tags).split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    }

    return [];
  }

  private static lireReponsesChoixMultiple(reponses: unknown): ReponseChoixMultiple[] {
    if (Array.isArray(reponses)) {
      return reponses
        .map((item: any) => ({
          text: String(item?.text ?? "").trim(),
          estBonneReponse: item?.estBonneReponse === true,
          retroaction: String(item?.retroaction ?? "").trim(),
        }))
        .filter((item) => item.text.length > 0);
    }

    const texte = String(reponses ?? "").trim();
    if (!texte) {
      return [];
    }

    return texte
      .split("|")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item, index) => ({
        text: item,
        estBonneReponse: index === 0,
        retroaction: "",
      }));
  }

  private static lirePairesCorrespondance(paires: unknown): PairDeCorrespondance[] {
    if (Array.isArray(paires)) {
      return paires
        .map((item: any) => ({
          question: String(item?.question ?? "").trim(),
          reponse: String(item?.reponse ?? "").trim(),
        }))
        .filter((item) => item.question.length > 0 || item.reponse.length > 0);
    }

    const texte = String(paires ?? "").trim();
    if (!texte) {
      return [];
    }

    return texte
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

  private static creerQuestionAutreType(
    type: string,
    nom: string,
    énoncé: string,
    retroactionValide: string,
    retroactionInvalide: string,
    tags: string[],
    autresDonnees: Record<string, unknown>
  ): Question {
    if (type === "ChoixMultiple") {
      const reponses = QuestionsController.lireReponsesChoixMultiple(autresDonnees.reponses);
      if (reponses.length === 0) {
        throw new InvalidParameterError("Champs manquants: reponses");
      }

      return new QuestionChoixMultipleModele(
        nom,
        énoncé,
        retroactionValide,
        retroactionInvalide,
        tags,
        autresDonnees.seulementUnChoix === true || autresDonnees.seulementUnChoix === "true",
        reponses
      );
    }

    if (type === "MiseEnCorrespondance") {
      const paires = QuestionsController.lirePairesCorrespondance(autresDonnees.paires);
      if (paires.length === 0) {
        throw new InvalidParameterError("Champs manquants: paires");
      }

      return new QuestionMiseEnCorrespondanceModele(
        nom,
        énoncé,
        retroactionValide,
        retroactionInvalide,
        tags,
        paires
      );
    }

    if (type === "ReponseCourte") {
      const reponseAttendue = String(autresDonnees.reponse ?? "").trim();
      if (!reponseAttendue) {
        throw new InvalidParameterError("Champs manquants: reponse");
      }

      return new QuestionReponseCourteModele(
        nom,
        énoncé,
        retroactionValide,
        retroactionInvalide,
        tags,
        reponseAttendue,
        retroactionValide
      );
    }

    if (type === "Numerique") {
      const valeur = Number.parseFloat(String(autresDonnees.reponse ?? "").trim());
      if (!Number.isFinite(valeur)) {
        throw new InvalidParameterError("Champs manquants: reponse");
      }

      return new QuestionNumeriqueModele(
        nom,
        énoncé,
        retroactionValide,
        retroactionInvalide,
        tags,
        valeur,
        retroactionValide
      );
    }

    if (type === "Essai") {
      return new QuestionEssaiModele(
        nom,
        énoncé,
        retroactionValide,
        retroactionInvalide,
        tags
      );
    }

    throw new InvalidParameterError(`Type de question non supporté: ${type}`);
  }
  
  static async ajouterQuestionVraiFaux(req: any, res: Response): Promise<void> {
    try {
      const teacher = req.session.user;
      const { groupId } = req.params;
      const { nom, énoncé, reponse, retroactionValide, retroactionInvalide, tags } = req.body;

      if (!teacher?.id || !groupId) {
        throw new InvalidParameterError("Enseignant ou cours manquant");
      }

      const missingFields: string[] = [];
      if (!nom || String(nom).trim() === "") missingFields.push("nom");
      if (!énoncé || String(énoncé).trim() === "") missingFields.push("énoncé");
      if (reponse === undefined || reponse === "") missingFields.push("reponse");

      if (missingFields.length > 0) {
        throw new InvalidParameterError(`Champs manquants: ${missingFields.join(", ")}`);
      }

      if (await questionNameExists(groupId, nom)) {
        throw new AlreadyExistsError(`Une question avec le nom "${nom}" existe déjà`);
      }

      const reponseBoolean = reponse === "true" || reponse === true;

      const nouvelleQuestion = new QuestionVraiFauxModele(
        String(nom).trim(),
        String(énoncé).trim(),
        String(retroactionValide || "").trim(),
        String(retroactionInvalide || "").trim(),
        QuestionsController.lireTags(tags),
        reponseBoolean,
        String(retroactionValide || "").trim()
      );

      await addQuestion(String(groupId), nouvelleQuestion);

      res.status(201).json({
        success: true,
        message: "Question ajoutée avec succès",
        question: convertirQuestionModeleEnDonnees(nouvelleQuestion),
      });
      return;
    } catch (e: any) {
      if (e instanceof AlreadyExistsError) {
        res.status(409).json({ error: e.message });
      } else if (e instanceof InvalidParameterError) {
        res.status(400).json({ error: e.message });
      } else {
        res.status(500).json({ error: e?.message ?? "Erreur lors de l'ajout de la question" });
      }
      return;
    }
  }

  private static async ajouterQuestionParType(req: any, res: Response, typeQuestion: string): Promise<void> {
    try {
      const teacher = req.session.user;
      const { groupId } = req.params;
      const { nom, énoncé, retroactionValide, retroactionInvalide, tags, ...otherData } = req.body;

      if (!teacher?.id || !groupId) {
        throw new InvalidParameterError("Enseignant ou cours manquant");
      }

      const missingFields: string[] = [];
      if (!nom || String(nom).trim() === "") missingFields.push("nom");
      if (!énoncé || String(énoncé).trim() === "") missingFields.push("énoncé");

      if (missingFields.length > 0) {
        throw new InvalidParameterError(`Champs manquants: ${missingFields.join(", ")}`);
      }

      if (await questionNameExists(groupId, nom)) {
        throw new AlreadyExistsError(`Une question avec le nom "${nom}" existe déjà`);
      }

      const nouvelleQuestion = QuestionsController.creerQuestionAutreType(
        typeQuestion,
        String(nom).trim(),
        String(énoncé).trim(),
        String(retroactionValide || "").trim(),
        String(retroactionInvalide || "").trim(),
        QuestionsController.lireTags(tags),
        otherData
      );

      await addQuestion(String(groupId), nouvelleQuestion);

      res.status(201).json({
        success: true,
        message: "Question ajoutée avec succès",
        question: convertirQuestionModeleEnDonnees(nouvelleQuestion),
      });
      return;
    } catch (e: any) {
      if (e instanceof AlreadyExistsError) {
        res.status(409).json({ error: e.message });
      } else if (e instanceof InvalidParameterError) {
        res.status(400).json({ error: e.message });
      } else {
        res.status(500).json({ error: e?.message ?? "Erreur lors de l'ajout de la question" });
      }
      return;
    }
  }

  static async ajouterQuestionChoixMultiple(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "ChoixMultiple");
  }

  static async ajouterQuestionNumerique(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "Numerique");
  }

  static async ajouterQuestionReponseCourte(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "ReponseCourte");
  }

  static async ajouterQuestionMiseEnCorrespondance(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "MiseEnCorrespondance");
  }

  static async ajouterQuestionEssai(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "Essai");
  }
}
