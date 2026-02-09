import { Router } from "express";
import { QuestionsController } from "../controllers/QuestionsController";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.token) {
    res.redirect("/signin");
    return;
  }
  next();
}

router.post("/:groupId/ajouter-vrai-faux", requireAuth, QuestionsController.ajouterQuestionVraiFaux);

router.post("/:groupId/ajouter-autre-type", requireAuth, QuestionsController.ajouterQuestionAutreType);

export default router;