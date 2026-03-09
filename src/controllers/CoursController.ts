import { Response } from "express";
import { SgbClient } from "../core/sgbClient";
import { ajouterCoursStocke, retirerCoursStocke, recupererCoursStockeParIdGroupe } from "../core/coursStore";
import { recupererQuestionsDuCours } from "../core/coursStore";

const sgbBaseUrl = process.env.SGB_BASE_URL ?? "http://localhost:3200";
const accesSGA = new SgbClient(sgbBaseUrl);

export class CoursController {
  private static obtenirTypeQuestionPourAffichage(question: any): string {
    if (question && (question.reponses !== undefined || question.seulementUnChoix !== undefined)) {
      return "ChoixMultiple";
    }

    if (question && question.paires !== undefined) {
      return "MiseEnCorrespondance";
    }

    if (question && question.reponseAttendue !== undefined) {
      return typeof question.reponseAttendue === "number" ? "Numerique" : "ReponseCourte";
    }

    if (question && question.reponse !== undefined) {
      if (typeof question.reponse === "boolean") {
        return "VraiFaux";
      }

      const texteReponse = String(question.reponse).trim().toLowerCase();
      if (texteReponse === "true" || texteReponse === "false") {
        return "VraiFaux";
      }

      return Number.isFinite(Number.parseFloat(texteReponse)) ? "Numerique" : "ReponseCourte";
    }

    return "Essai";
  }

  static async selectionnerGroupeCours(req: any, res: Response): Promise<void> {
    try {
      const teacher = req.session.user;
      const idGroupe = req.body?.idGroupe ?? req.body?.idGroupe;

      if (!teacher?.id || !idGroupe) {
        res.status(400).send("Enseignant ou idGroupe manquant");
        return;
      }

      const coursSelectionne = await accesSGA.getCoursParGroupe(
        String(idGroupe),
        req.session.token,
        String(teacher.id)
      );
      const students = await accesSGA.getEtudiantsParGroupe(req.session.token, String(idGroupe));

      if (!coursSelectionne) {
        res.status(404).send("Horaire introuvable pour ce groupe");
        return;
      }

      const idCoursFinal = coursSelectionne.idCours ? String(coursSelectionne.idCours) : undefined;
      const titreCoursBrut = coursSelectionne.titreCours ? String(coursSelectionne.titreCours) : "";
      const titreCoursFinal =
        titreCoursBrut && titreCoursBrut !== String(coursSelectionne.idGroupe) && titreCoursBrut !== String(idCoursFinal)
          ? titreCoursBrut
          : undefined;

      await ajouterCoursStocke({
        idGroupe: String(coursSelectionne.idGroupe),
        jour: String(coursSelectionne.jour),
        heure: String(coursSelectionne.heure),
        activite: String(coursSelectionne.activite),
        mode: String(coursSelectionne.mode),
        local: String(coursSelectionne.local),
        idEnseignant: String(coursSelectionne.idEnseignant),
        idCours: idCoursFinal,
        titreCours: titreCoursFinal,
        etudiants: students,
        questions: [],
      });

      res.redirect(
        `/index?succes=${encodeURIComponent("Cours ajoute avec succes.")}`
      );
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Echec de creation");
      return;
    }
  }

  static async retirerCours(req: any, res: Response): Promise<void> {
    const idCours = req.query?.idCours ?? req.query?.idGroupe;
    if (!idCours) {
      res.redirect("/index");
      return;
    }
    res.redirect(`/cours/confirmer-suppression-cours?idCours=${encodeURIComponent(String(idCours))}`);
  }

  static async confirmerSuppressionCours(req: any, res: Response): Promise<void> {
    const idCours = req.query?.idCours ?? req.query?.idGroupe;
    if (!idCours) {
      res.redirect("/index");
      return;
    }
    res.redirect(`/index?confirmRemove=${encodeURIComponent(String(idCours))}`);
  }

  static async suppressionCours(req: any, res: Response): Promise<void> {
    try {
      const idCours = req.body?.idCours ?? req.body?.idGroupe;
      if (!idCours) {
        res.redirect("/index");
        return;
      }
      await retirerCoursStocke(String(idCours));
      res.redirect(
        `/index?succes=${encodeURIComponent("Cours retire avec succes.")}`
      );
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Echec de suppression");
      return;
    }
  }

  static async afficherDetailsCours(req: any, res: Response): Promise<void> {
    try {
      const idCours = req.params?.idCours ?? req.params?.idGroupe;
      const teacher = req.session.user;

      if (!idCours || !teacher?.id) {
        res.status(400).send("idGroupe ou infos utilisateur manquant");
        return;
      }

      const cours = await recupererCoursStockeParIdGroupe(idCours);
      if (!cours) {
        res.status(404).send("Cours introuvable");
        return;
      }

      const questionsBrutes = await recupererQuestionsDuCours(idCours);
      const questions = questionsBrutes.map((question: any) => ({
        ...question,
        typeAffichage: CoursController.obtenirTypeQuestionPourAffichage(question),
      }));
      const showAddQuestionModal = req.query.addQuestion === "1";
      const messageSucces = typeof req.query.succes === "string" ? req.query.succes : "";
      const messageErreur = typeof req.query.erreur === "string" ? req.query.erreur : "";
      const displayName = `${teacher.first_name} ${teacher.last_name}`;

      res.render("questions", {
        title: "Questions",
        displayName,
        idGroupe: idCours,
        idCours,
        coursId: cours.idCours,
        coursTitre: cours.titreCours || cours.activite,
        cours,                         
        students: cours.etudiants ?? [],
        questions,
        showAddQuestionModal,
        messageSucces,
        messageErreur,
      });
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Echec du chargement des questions");
    }
  }
}
