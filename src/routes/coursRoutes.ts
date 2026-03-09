import { Router } from "express";
import { CoursController } from "../controllers/CoursController";

const router = Router();

function exigerAuthentification(req: any, res: any, next: any) {
  if (!req.session?.token) {
    res.redirect("/signin");
    return;
  }
  next();
}

router.post("/selectionner-groupe-cours", exigerAuthentification, CoursController.selectionnerGroupeCours);
router.get("/retirer-cours", exigerAuthentification, CoursController.retirerCours);
router.get("/confirmer-suppression-cours", exigerAuthentification, CoursController.confirmerSuppressionCours);
router.post("/suppression-cours", exigerAuthentification, CoursController.suppressionCours);
router.get("/:idCours/details-cours", exigerAuthentification, CoursController.afficherDetailsCours);

export default router;
