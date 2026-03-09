import { Router } from "express";
import { QuestionnairesController } from "../controllers/QuestionnairesController";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.token) {
    res.redirect("/signin");
    return;
  }
  next();
}

router.get("/:idCours/questionnaires", requireAuth, QuestionnairesController.gererQuestionnaires);
router.post(
  "/:idCours/questionnaires/ajouter",
  requireAuth,
  QuestionnairesController.ajouterQuestionnaire
);
router.get(
  "/:idCours/questionnaires/selectionner-tag",
  requireAuth,
  QuestionnairesController.selectionnerTag
);
router.post(
  "/:idCours/questionnaires/ajouter-question",
  requireAuth,
  QuestionnairesController.ajouterQuestion
);
router.post(
  "/:idCours/questionnaires/selection-modifier",
  requireAuth,
  QuestionnairesController.selectionModifierQuestionnaire
);
router.post(
  "/:idCours/questionnaires/retirer-question",
  requireAuth,
  QuestionnairesController.retirerQuestion
);
router.post(
  "/:idCours/questionnaires/modifier-ordre-question",
  requireAuth,
  QuestionnairesController.modifierOrdreQuestion
);
router.post(
  "/:idCours/questionnaires/modifier",
  requireAuth,
  QuestionnairesController.modifierQuestionnaire
);
router.post(
  "/:idCours/questionnaires/verifier-suppression",
  requireAuth,
  QuestionnairesController.verifierSupprimerQuestionnaire
);
router.post(
  "/:idCours/questionnaires/confirmer-suppression",
  requireAuth,
  QuestionnairesController.confirmerSuppression
);
router.post(
  "/:idCours/questionnaires/sauvegarder",
  requireAuth,
  QuestionnairesController.sauvegarderQuestionnaire
);

export default router;
