import { Router } from "express";
import { CoursController } from "../controllers/CoursController";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.token) {
    res.redirect("/signin");
    return;
  }
  next();
}

router.post("/selectionner-groupe-cours", requireAuth, CoursController.selectionnerGroupeCours);
router.get("/retirer-cours", requireAuth, CoursController.retirerCours);
router.get("/confirmer-suppression-cours", requireAuth, CoursController.confirmerSuppressionCours);
router.post("/suppression-cours", requireAuth, CoursController.suppressionCours);
router.get("/:idCours/details-cours", requireAuth, CoursController.afficherDetailsCours);

export default router;
