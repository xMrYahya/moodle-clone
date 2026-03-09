import { Router } from "express";
import { QuestionsController } from "../controllers/QuestionsController";

const router = Router();

function exigerAuthentification(req: any, res: any, next: any) {
  if (!req.session?.token) {
    res.redirect("/signin");
    return;
  }
  next();
}

router.get("/:groupId", exigerAuthentification, QuestionsController.consulterQuestionsCours);
router.get("/:groupId/:nom", exigerAuthentification, QuestionsController.selectionnerQuestion);
router.post("/:groupId/:nom/modifier", exigerAuthentification, QuestionsController.modifierQuestion);
router.get("/:groupId/:nom/supprimer", exigerAuthentification, QuestionsController.supprimerQuestion);
router.post("/:groupId/:nom/confirmer-suppression", exigerAuthentification, QuestionsController.confirmerSuppressionQuestion);

router.get("/:groupId/questions", exigerAuthentification, QuestionsController.consulterQuestionsCours);
router.get("/:groupId/questions/:nom", exigerAuthentification, QuestionsController.selectionnerQuestion);
router.post("/:groupId/questions/:nom/modifier", exigerAuthentification, QuestionsController.modifierQuestion);
router.get("/:groupId/questions/:nom/suppression", exigerAuthentification, QuestionsController.supprimerQuestion);
router.post("/:groupId/questions/:nom/suppression", exigerAuthentification, QuestionsController.confirmerSuppressionQuestion);

router.post("/:groupId/ajouter-vrai-faux", exigerAuthentification, QuestionsController.ajouterQuestionVraiFaux);

  router.post("/:groupId/ajouter-choix-multiple", exigerAuthentification, QuestionsController.ajouterQuestionChoixMultiple);
  router.post("/:groupId/ajouter-numerique", exigerAuthentification, QuestionsController.ajouterQuestionNumerique);
  router.post("/:groupId/ajouter-reponse-courte", exigerAuthentification, QuestionsController.ajouterQuestionReponseCourte);
  router.post("/:groupId/ajouter-mise-en-correspondance", exigerAuthentification, QuestionsController.ajouterQuestionMiseEnCorrespondance);
  router.post("/:groupId/ajouter-essai", exigerAuthentification, QuestionsController.ajouterQuestionEssai);

export default router;