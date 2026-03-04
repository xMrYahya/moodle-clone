import { Response } from "express";
import { 
  addQuestion, 
  questionNameExists,
  questionNameExistsExcept,
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
  private static lireTexte(valeur: unknown): string {
    return String(valeur ?? "").trim();
  }

  private static lireContexteRequete(req: any): { teacherId: string; groupId: string } {
    const teacherId = QuestionsController.lireTexte(req?.session?.user?.id);
    const groupId = QuestionsController.lireTexte(req?.params?.groupId);

    if (!teacherId || !groupId) {
      throw new InvalidParameterError("Enseignant ou cours manquant");
    }

    return { teacherId, groupId };
  }

  private static validerChampsObligatoires(
    donnees: Record<string, unknown>,
    champsObligatoires: string[]
  ): void {
    const champsManquants = champsObligatoires.filter((champ) => {
      const valeur = donnees[champ];
      return valeur === undefined || valeur === null || QuestionsController.lireTexte(valeur) === "";
    });

    if (champsManquants.length > 0) {
      throw new InvalidParameterError(`Champs manquants: ${champsManquants.join(", ")}`);
    }
  }

  private static async validerNomQuestionUnique(
    groupId: string,
    nom: string,
    nomAExclure?: string
  ): Promise<void> {
    const nomNettoye = QuestionsController.lireTexte(nom);
    const nomExcluNettoye = QuestionsController.lireTexte(nomAExclure);

    const existe = nomExcluNettoye
      ? await questionNameExistsExcept(groupId, nomNettoye, nomExcluNettoye)
      : await questionNameExists(groupId, nomNettoye);

    if (existe) {
      throw new AlreadyExistsError(`Une question avec le nom "${nomNettoye}" existe déjà`);
    }
  }

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
      const { groupId } = QuestionsController.lireContexteRequete(req);
      const { nom, énoncé, reponse, retroactionValide, retroactionInvalide, tags } = req.body;

      QuestionsController.validerChampsObligatoires({ nom, énoncé, reponse }, ["nom", "énoncé", "reponse"]);
      await QuestionsController.validerNomQuestionUnique(groupId, String(nom));

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
      const { groupId } = QuestionsController.lireContexteRequete(req);
      const { nom, énoncé, retroactionValide, retroactionInvalide, tags, ...otherData } = req.body;

      QuestionsController.validerChampsObligatoires({ nom, énoncé }, ["nom", "énoncé"]);
      await QuestionsController.validerNomQuestionUnique(groupId, String(nom));

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
