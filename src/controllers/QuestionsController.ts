import { Response } from "express";
import { 
  addQuestion, 
  questionNameExists 
} from "../core/questionsStore";
import { AnyQuestion, QuestionVraiFaux, QuestionChoixMultiple } from "../types/questionTypes";
import { AlreadyExistsError } from "../core/errors/alreadyExistsError";
import { InvalidParameterError } from "../core/errors/invalidParameterError";

export class QuestionsController {
  
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

      const newQuestion: QuestionVraiFaux = {
        nom: String(nom).trim(),
        énoncé: String(énoncé).trim(),
        reponse: reponseBoolean,
        retroaction: String(retroactionValide || "").trim(),
        retroactionValide: String(retroactionValide || "").trim(),
        retroactionInvalide: String(retroactionInvalide || "").trim(),
        tags: Array.isArray(tags) ? tags.map(String) : (tags ? String(tags).split(",").map(t => t.trim()).filter(t => t) : []),
        type: "VraiFaux",
      };

      await addQuestion(String(groupId), newQuestion);

      res.status(201).json({
        success: true,
        message: "Question ajoutée avec succès",
        question: newQuestion,
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

  static async ajouterQuestionAutreType(req: any, res: Response): Promise<void> {
    try {
      const teacher = req.session.user;
      const { groupId } = req.params;
      const { nom, énoncé, type, retroactionValide, retroactionInvalide, tags, ...otherData } = req.body;

      if (!teacher?.id || !groupId) {
        throw new InvalidParameterError("Enseignant ou cours manquant");
      }

      const missingFields: string[] = [];
      if (!nom || String(nom).trim() === "") missingFields.push("nom");
      if (!énoncé || String(énoncé).trim() === "") missingFields.push("énoncé");
      if (!type || String(type).trim() === "") missingFields.push("type");

      if (missingFields.length > 0) {
        throw new InvalidParameterError(`Champs manquants: ${missingFields.join(", ")}`);
      }

      if (await questionNameExists(groupId, nom)) {
        throw new AlreadyExistsError(`Une question avec le nom "${nom}" existe déjà`);
      }

      let parsedTags: string[] = [];
      if (Array.isArray(tags)) {
        parsedTags = tags.map(String).filter(t => t.trim());
      } else if (tags) {
        parsedTags = String(tags).split(",").map(t => t.trim()).filter(t => t.length > 0);
      }

      const newQuestion: AnyQuestion = {
        nom: String(nom).trim(),
        énoncé: String(énoncé).trim(),
        type: String(type).trim() as any,
        retroactionValide: String(retroactionValide || "").trim(),
        retroactionInvalide: String(retroactionInvalide || "").trim(),
        tags: parsedTags,
        ...otherData,
      } as AnyQuestion;

      await addQuestion(String(groupId), newQuestion);

      res.status(201).json({
        success: true,
        message: "Question ajoutée avec succès",
        question: newQuestion,
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
}
