import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { CoursController } from "../controllers/CoursController";

const router = Router();

function exigerAuthentification(req: any, res: any, next: any) {
  if (!req.session?.token) {
    res.redirect("/signin");
    return;
  }
  next();
}

router.get("/", (req, res) => res.redirect("/signin"));

router.get("/signin", AuthController.getSignin);
router.post("/signin", AuthController.postSignin);
router.get("/signout", AuthController.signout);

router.get("/index", exigerAuthentification, CoursController.afficherListeCours ?? CoursController.index);

export default router;
