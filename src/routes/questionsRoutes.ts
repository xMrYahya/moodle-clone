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

router.get("/:idGroupe", exigerAuthentification, QuestionsController.consulterQuestionsCours);
router.get("/:idGroupe/:nom", exigerAuthentification, QuestionsController.selectionnerQuestion);
router.post("/:idGroupe/:nom/modifier", exigerAuthentification, QuestionsController.modifierQuestion);
router.get("/:idGroupe/:nom/supprimer", exigerAuthentification, QuestionsController.supprimerQuestion);
router.post("/:idGroupe/:nom/confirmer-suppression", exigerAuthentification, QuestionsController.confirmerSuppressionQuestion);

router.get("/:idGroupe/questions", exigerAuthentification, QuestionsController.consulterQuestionsCours);
router.get("/:idGroupe/questions/:nom", exigerAuthentification, QuestionsController.selectionnerQuestion);
router.post("/:idGroupe/questions/:nom/modifier", exigerAuthentification, QuestionsController.modifierQuestion);
router.get("/:idGroupe/questions/:nom/suppression", exigerAuthentification, QuestionsController.supprimerQuestion);
router.post("/:idGroupe/questions/:nom/suppression", exigerAuthentification, QuestionsController.confirmerSuppressionQuestion);

router.post("/:idGroupe/ajouter-vrai-faux", exigerAuthentification, QuestionsController.ajouterQuestionVraiFaux);

  router.post("/:idGroupe/ajouter-choix-multiple", exigerAuthentification, QuestionsController.ajouterQuestionChoixMultiple);
  router.post("/:idGroupe/ajouter-numerique", exigerAuthentification, QuestionsController.ajouterQuestionNumerique);
  router.post("/:idGroupe/ajouter-reponse-courte", exigerAuthentification, QuestionsController.ajouterQuestionReponseCourte);
  router.post("/:idGroupe/ajouter-mise-en-correspondance", exigerAuthentification, QuestionsController.ajouterQuestionMiseEnCorrespondance);
  router.post("/:idGroupe/ajouter-essai", exigerAuthentification, QuestionsController.ajouterQuestionEssai);

export default router;