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
      const { nom, énoncé, reponse, retroactionVrai, retroactionFaux, tags } = req.body;

      if (!teacher?.id || !groupId) {
        throw new InvalidParameterError("Enseignant ou cours manquant");
      }

      if (!nom || !énoncé || reponse === undefined || !retroactionVrai || !retroactionFaux) {
        throw new InvalidParameterError("Tous les champs sont obligatoires");
      }

      if (await questionNameExists(groupId, nom)) {
        throw new AlreadyExistsError(`Une question avec le nom "${nom}" existe déjà`);
      }

      const newQuestion: QuestionVraiFaux = {
        nom: String(nom),
        énoncé: String(énoncé),
        reponse: Boolean(reponse),
        retroaction: String(retroactionVrai),
        retroactionValide: String(retroactionVrai),
        retroactionInvalide: String(retroactionFaux),
        tags: Array.isArray(tags) ? tags.map(String) : [],
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

      if (!nom || !énoncé || !type || !retroactionValide || !retroactionInvalide) {
        throw new InvalidParameterError("Tous les champs sont obligatoires");
      }

      if (await questionNameExists(groupId, nom)) {
        throw new AlreadyExistsError(`Une question avec le nom "${nom}" existe déjà`);
      }

      const newQuestion: AnyQuestion = {
        nom: String(nom),
        énoncé: String(énoncé),
        type: String(type) as any,
        retroactionValide: String(retroactionValide),
        retroactionInvalide: String(retroactionInvalide),
        tags: Array.isArray(tags) ? tags.map(String) : [],
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
