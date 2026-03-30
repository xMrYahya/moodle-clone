import { Router } from "express";
import { EtudiantQuestionnairesController } from "../controllers/EtudiantQuestionnairesController";

const router = Router();

function exigerAuthentification(req: any, res: any, next: any) {
  if (!req.session?.token) {
    res.redirect("/signin");
    return;
  }
  next();
}

router.get(
  "/:idCours/questionnaires/etudiant",
  exigerAuthentification,
  EtudiantQuestionnairesController.afficherQuestionnairesCours
);
router.post(
  "/:idCours/questionnaires/etudiant/demarrer",
  exigerAuthentification,
  EtudiantQuestionnairesController.demarrerQuestionnaire
);
router.get(
  "/:idCours/questionnaires/etudiant/passer",
  exigerAuthentification,
  EtudiantQuestionnairesController.afficherQuestionCourante
);
router.post(
  "/:idCours/questionnaires/etudiant/repondre",
  exigerAuthentification,
  EtudiantQuestionnairesController.repondreQuestionChoixMultiple
);
router.get(
  "/:idCours/questionnaires/etudiant/resultat",
  exigerAuthentification,
  EtudiantQuestionnairesController.afficherResultat
);

export default router;
