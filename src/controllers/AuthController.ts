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
      const login = await sgbClient.loginTeacher(email, password);

      req.session.token = login.token;
      req.session.user = login.user;
      req.session.email = email;

      res.status(200).json({ ok: true });
      return;
    } catch (e: any) {
      res.status(401).json({ ok: false, message: e?.message ?? "Login failed" });
      return;
    }
  }

  static signout(req: any, res: Response): void {
    req.session.destroy(() => res.redirect("/"));
  }
}
