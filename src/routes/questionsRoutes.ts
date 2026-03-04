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

router.get("/:groupId", requireAuth, QuestionsController.consulterQuestionsCours);
router.get("/:groupId/:nom", requireAuth, QuestionsController.selectionnerQuestion);
router.post("/:groupId/:nom/modifier", requireAuth, QuestionsController.modifierQuestion);
router.get("/:groupId/:nom/supprimer", requireAuth, QuestionsController.supprimerQuestion);
router.post("/:groupId/:nom/confirmer-suppression", requireAuth, QuestionsController.confirmerSuppressionQuestion);

router.post("/:groupId/ajouter-vrai-faux", requireAuth, QuestionsController.ajouterQuestionVraiFaux);

  router.post("/:groupId/ajouter-choix-multiple", requireAuth, QuestionsController.ajouterQuestionChoixMultiple);
  router.post("/:groupId/ajouter-numerique", requireAuth, QuestionsController.ajouterQuestionNumerique);
  router.post("/:groupId/ajouter-reponse-courte", requireAuth, QuestionsController.ajouterQuestionReponseCourte);
  router.post("/:groupId/ajouter-mise-en-correspondance", requireAuth, QuestionsController.ajouterQuestionMiseEnCorrespondance);
  router.post("/:groupId/ajouter-essai", requireAuth, QuestionsController.ajouterQuestionEssai);

export default router;