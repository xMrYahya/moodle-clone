import { Router } from "express";
import { QuestionnairesController } from "../controllers/QuestionnairesController";

const router = Router();

function exigerAuthentification(req: any, res: any, next: any) {
  if (!req.session?.token) {
    res.redirect("/signin");
    return;
  }
  next();
}

router.get("/:idCours/questionnaires", exigerAuthentification, QuestionnairesController.gererQuestionnaires);
router.post(
  "/:idCours/questionnaires/ajouter",
  exigerAuthentification,
  QuestionnairesController.ajouterQuestionnaire
);
router.get(
  "/:idCours/questionnaires/selectionner-tag",
  exigerAuthentification,
  QuestionnairesController.selectionnerTag
);
router.post(
  "/:idCours/questionnaires/ajouter-question",
  exigerAuthentification,
  QuestionnairesController.ajouterQuestion
);
router.post(
  "/:idCours/questionnaires/selection-modifier",
  exigerAuthentification,
  QuestionnairesController.selectionModifierQuestionnaire
);
router.post(
  "/:idCours/questionnaires/retirer-question",
  exigerAuthentification,
  QuestionnairesController.retirerQuestion
);
router.post(
  "/:idCours/questionnaires/modifier-ordre-question",
  exigerAuthentification,
  QuestionnairesController.modifierOrdreQuestion
);
router.post(
  "/:idCours/questionnaires/modifier",
  exigerAuthentification,
  QuestionnairesController.modifierQuestionnaire
);
router.post(
  "/:idCours/questionnaires/verifier-suppression",
  exigerAuthentification,
  QuestionnairesController.verifierSupprimerQuestionnaire
);
router.post(
  "/:idCours/questionnaires/confirmer-suppression",
  exigerAuthentification,
  QuestionnairesController.confirmerSuppression
);
router.post(
  "/:idCours/questionnaires/sauvegarder",
  exigerAuthentification,
  QuestionnairesController.sauvegarderQuestionnaire
);

export default router;
