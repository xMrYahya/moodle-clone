import { Response } from "express";
import { SgbClient } from "../core/sgbClient";
import { getStoredPourProf } from "../core/coursStore";

const sgbBaseUrl = process.env.SGB_BASE_URL ?? "http://localhost:3200";
const accesSGA = new SgbClient(sgbBaseUrl);

export class HomeController {
  static async demarrerAjoutCours(teacherId: string, token: string): Promise<any[]> {
    return accesSGA.getCours(String(teacherId), token);
  }

  static async afficherListeCours(req: any, res: Response): Promise<void> {
    try {
      const teacher = req.session.user;
      const displayName = teacher
        ? `${teacher.first_name} ${teacher.last_name}`
        : (req.session.email ?? "Enseignant");

      const showAddCourseModal = req.query.addCourse === "1";
      const messageSucces = typeof req.query.succes === "string" ? req.query.succes : "";
      const messageErreur = typeof req.query.erreur === "string" ? req.query.erreur : "";

      const confirmRemoveGroupId =
        typeof req.query.confirmRemove === "string" ? req.query.confirmRemove : null;

      const createdGroups = teacher?.id
        ? await getStoredPourProf(String(teacher.id))
        : [];

      let groups: any[] = [];

      if (showAddCourseModal && teacher?.id) {
        const listeCours = await HomeController.demarrerAjoutCours(String(teacher.id), req.session.token);
        const createdIds = new Set(createdGroups.map((g: any) => String(g.idGroupe)));
        groups = listeCours.filter((g) => !createdIds.has(String(g.idGroupe)));
      }

      res.render("index", {
        title: "Moodle",
        displayName,
        messageSucces,
        messageErreur,
        showAddCourseModal,
        confirmRemoveGroupId, 
        groups,
        createdGroups,
      });
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Echec du chargement de l'accueil");
      return;
    }
  }

  static async index(req: any, res: Response): Promise<void> {
    return this.afficherListeCours(req, res);
  }
}
