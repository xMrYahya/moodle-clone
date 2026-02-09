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

router.post("/creer", requireAuth, CoursController.creer);
router.post("/supprimer", requireAuth, CoursController.supprimer);
router.get("/:groupId/questions", requireAuth, CoursController.afficherQuestions);

export default router;
