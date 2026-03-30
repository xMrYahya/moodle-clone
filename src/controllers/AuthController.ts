import { Request, Response } from "express";
import { SgbClient } from "../core/sgbClient";

const titreBase = "Moodle";
const sgbBaseUrl = process.env.SGB_BASE_URL ?? "http://localhost:3200";
const sgbClient = new SgbClient(sgbBaseUrl);

export class AuthController {
  static getSignin(req: any, res: Response): void {
    if (req.session?.token) {
      res.redirect("/index");
      return;
    }
    res.render("signin", { title: titreBase });
  }

  static async postSignin(req: any, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const role = String(req.body?.role ?? "teacher").toLowerCase();
      const login =
        role === "student"
          ? await sgbClient.loginStudent(email, password)
          : await sgbClient.loginTeacher(email, password);

      req.session.token = login.token;
      req.session.user = login.user;
      req.session.email = email;
      req.session.role = role === "student" ? "student" : "teacher";

      res.status(200).json({ ok: true });
      return;
    } catch (e: any) {
      res.status(401).json({ ok: false, message: e?.message ?? "Echec de connexion" });
      return;
    }
  }

  static signout(req: any, res: Response): void {
    req.session.destroy(() => res.redirect("/"));
  }
}
