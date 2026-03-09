import { Response } from "express";
import { obtenirQuestionsDuCours, obtenirCoursStockeParIdGroupe } from "../core/CoursModele";
import { QuestionnaireModele } from "../core/QuestionnaireModele";
import { QuestionnaireTemp } from "../types/questionnaireTypes";

type SessionAvecTemp = {
  questionnaireTempParCours?: Record<string, QuestionnaireTemp>;
};

function lireBool(valeur: any): boolean {
  return valeur === true || valeur === "true" || valeur === "1" || valeur === 1 || valeur === "on";
}

function lireTexte(valeur: unknown): string {
  return String(valeur ?? "").trim();
}

function obtenirTempSession(req: any, idGroupe: string): QuestionnaireTemp | undefined {
  const session = (req.session ?? {}) as SessionAvecTemp;
  return session.questionnaireTempParCours?.[String(idGroupe)];
}

function definirTempSession(req: any, idGroupe: string, temp: QuestionnaireTemp): void {
  const session = (req.session ?? {}) as SessionAvecTemp;
  if (!session.questionnaireTempParCours) {
    session.questionnaireTempParCours = {};
  }
  session.questionnaireTempParCours[String(idGroupe)] = temp;
}

function viderTempSession(req: any, idGroupe: string): void {
  const session = (req.session ?? {}) as SessionAvecTemp;
  if (session.questionnaireTempParCours) {
    delete session.questionnaireTempParCours[String(idGroupe)];
  }
}

export class QuestionnairesController {
  static async gererQuestionnaires(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const enseignant = req.session?.user;
      if (!idGroupe || !enseignant?.id) {
        res.status(400).send("idGroupe ou informations utilisateur manquantes");
        return;
      }

      const cours = await obtenirCoursStockeParIdGroupe(idGroupe);
      if (!cours) {
        res.status(404).send("Cours introuvable");
        return;
      }

      const nomTag = lireTexte(req.query?.nomTag);
      const questionnaires = await QuestionnaireModele.obtenirQuestionnairesAssocies(idGroupe);
      const tags = await QuestionnaireModele.obtenirListeTagsDesQuestions(idGroupe);
      const questionsCours = await obtenirQuestionsDuCours(idGroupe);
      const aucuneQuestionAssocieeAuCours = questionsCours.length === 0;
      const questionnaireTemp = obtenirTempSession(req, idGroupe);
      const messageSucces = lireTexte(req.query?.succes);
      const messageErreur = lireTexte(req.query?.erreur);
      const showAddQuestionnaireModal = req.query?.addQuestionnaire === "1";
      const questionsDuTagBrutes = nomTag
        ? await QuestionnaireModele.obtenirQuestionsParTag(idGroupe, nomTag)
        : [];
      const nomsDejaAjoutes = new Set((questionnaireTemp?.questions ?? []).map((q) => String(q)));
      const questionsDuTag = questionsDuTagBrutes.filter(
        (question) => !nomsDejaAjoutes.has(String(question.nom))
      );
      const nomQuestionnaireSuppression = lireTexte(req.query?.confirmerSuppression);
      const questionnaireSuppression = nomQuestionnaireSuppression
        ? await QuestionnaireModele.obtenirQuestionnaireParNom(idGroupe, nomQuestionnaireSuppression)
        : undefined;

      res.render("questionnaires", {
        title: "Questionnaires",
        displayName: `${enseignant.first_name} ${enseignant.last_name}`,
        idCours: idGroupe,
        cours,
        coursTitre: cours.titreCours || cours.activite,
        questionnaires,
        tags,
        nomTagSelectionne: nomTag,
        questionsDuTag,
        questionnaireTemp,
        showAddQuestionnaireModal,
        messageSucces,
        messageErreur,
        aucuneQuestionAssocieeAuCours,
        questionnaireSuppression,
      });
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Echec du chargement des questionnaires");
      return;
    }
  }

  static async ajouterQuestionnaire(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const nom = lireTexte(req.body?.nom);
      const description = lireTexte(req.body?.description);
      const actif = lireBool(req.body?.actif);

      if (!idGroupe || !nom) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?addQuestionnaire=1&erreur=${encodeURIComponent("Nom du questionnaire obligatoire")}`
        );
        return;
      }

      const questionnaire = await QuestionnaireModele.creerQuestionnaire(
        idGroupe,
        nom,
        description,
        actif
      );
      await QuestionnaireModele.ajouterQuestionnaire(idGroupe, questionnaire);
      const questionsCours = await obtenirQuestionsDuCours(idGroupe);
      const messageCreation = questionsCours.length === 0
        ? "Questionnaire cree avec succes. Aucune question n'est associee a ce cours pour le moment."
        : "Questionnaire ajoute. Selectionnez un tag pour ajouter des questions.";

      definirTempSession(req, idGroupe, {
        mode: "ajout",
        nomQuestionnaire: questionnaire.nom,
        nomOriginal: questionnaire.nom,
        description: questionnaire.description,
        actif: questionnaire.actif,
        questions: [],
      });

      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires?succes=${encodeURIComponent(messageCreation)}`
      );
      return;
    } catch (e: any) {
      res.redirect(
        `/cours/${encodeURIComponent(req.params?.idCours ?? req.params?.groupId ?? "")}/questionnaires?addQuestionnaire=1&erreur=${encodeURIComponent(
          e?.message ?? "Erreur lors de l'ajout du questionnaire"
        )}`
      );
      return;
    }
  }

  static async selectionnerTag(req: any, res: Response): Promise<void> {
    const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
    const nomTag = lireTexte(req.query?.nomTag ?? req.body?.nomTag);
    res.redirect(
      `/cours/${encodeURIComponent(idGroupe)}/questionnaires?nomTag=${encodeURIComponent(nomTag)}`
    );
  }

  static async ajouterQuestion(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const nomQuestion = lireTexte(req.body?.nomQuestion);
      const nomsQuestions = Array.isArray(req.body?.nomQuestions)
        ? req.body.nomQuestions.map((q: unknown) => lireTexte(q)).filter((q: string) => q.length > 0)
        : [];
      const nomTag = lireTexte(req.body?.nomTag);
      const temp = obtenirTempSession(req, idGroupe);

      if (!temp) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Aucun questionnaire en cours d'edition")}`
        );
        return;
      }

      const aAjouter = nomsQuestions.length > 0 ? nomsQuestions : [nomQuestion];

      for (const nom of aAjouter) {
        const question = await QuestionnaireModele.obtenirQuestionParNom(idGroupe, nom);
        if (!question) {
          res.redirect(
            `/cours/${encodeURIComponent(idGroupe)}/questionnaires?nomTag=${encodeURIComponent(nomTag)}&erreur=${encodeURIComponent("Question introuvable")}`
          );
          return;
        }

        const nomQuestionModele = String((question as any).nom);
        QuestionnaireModele.ajouterQuestion(temp, nomQuestionModele);
      }
      definirTempSession(req, idGroupe, temp);

      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires?nomTag=${encodeURIComponent(nomTag)}&succes=${encodeURIComponent("Question ajoutee au questionnaire en cours d'edition")}`
      );
      return;
    } catch (e: any) {
      res.redirect(
        `/cours/${encodeURIComponent(req.params?.idCours ?? req.params?.groupId ?? "")}/questionnaires?erreur=${encodeURIComponent(
          e?.message ?? "Erreur lors de l'ajout de la question"
        )}`
      );
      return;
    }
  }

  static async sauvegarderQuestionnaire(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const temp = obtenirTempSession(req, idGroupe);
      if (!temp) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Aucun questionnaire temporaire a sauvegarder")}`
        );
        return;
      }

      const ok = await QuestionnaireModele.sauvegarderQuestionnaire(
        idGroupe,
        temp.nomQuestionnaire,
        temp.questions
      );

      if (!ok) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Questionnaire introuvable pour sauvegarde")}`
        );
        return;
      }

      viderTempSession(req, idGroupe);
      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires?succes=${encodeURIComponent("Confirmation de la sauvegarde du questionnaire")}`
      );
      return;
    } catch (e: any) {
      res.redirect(
        `/cours/${encodeURIComponent(req.params?.idCours ?? req.params?.groupId ?? "")}/questionnaires?erreur=${encodeURIComponent(
          e?.message ?? "Erreur lors de la sauvegarde du questionnaire"
        )}`
      );
      return;
    }
  }

  static async retirerQuestion(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const nomQuestion = lireTexte(req.body?.nomQuestion);
      const nomTag = lireTexte(req.body?.nomTag);
      const temp = obtenirTempSession(req, idGroupe);

      if (!temp) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Aucun questionnaire en cours d'edition")}`
        );
        return;
      }

      QuestionnaireModele.dissocierQuestion(temp, nomQuestion);
      definirTempSession(req, idGroupe, temp);

      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires?nomTag=${encodeURIComponent(nomTag)}&succes=${encodeURIComponent("Question retiree du questionnaire en cours d'edition")}`
      );
      return;
    } catch (e: any) {
      res.redirect(
        `/cours/${encodeURIComponent(req.params?.idCours ?? req.params?.groupId ?? "")}/questionnaires?erreur=${encodeURIComponent(
          e?.message ?? "Erreur lors du retrait de la question"
        )}`
      );
      return;
    }
  }

  static async selectionModifierQuestionnaire(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const nomQuestionnaire = lireTexte(req.body?.nomQuestionnaire ?? req.query?.nomQuestionnaire);
      const questionnaire = await QuestionnaireModele.obtenirQuestionnaireParNom(
        idGroupe,
        nomQuestionnaire
      );
      if (!questionnaire) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Questionnaire introuvable")}`
        );
        return;
      }

      if ((questionnaire.resultatsEtudiants ?? []).length > 0) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Modification impossible : ce questionnaire a ete realise par au moins un etudiant.")}`
        );
        return;
      }

      definirTempSession(req, idGroupe, {
        mode: "modification",
        nomOriginal: questionnaire.nom,
        nomQuestionnaire: questionnaire.nom,
        description: questionnaire.description,
        actif: questionnaire.actif,
        questions: [...(questionnaire.questions ?? [])],
      });

      res.redirect(`/cours/${encodeURIComponent(idGroupe)}/questionnaires`);
      return;
    } catch (e: any) {
      res.redirect(
        `/cours/${encodeURIComponent(req.params?.idCours ?? req.params?.groupId ?? "")}/questionnaires?erreur=${encodeURIComponent(
          e?.message ?? "Erreur lors de la preparation de modification"
        )}`
      );
      return;
    }
  }

  static async modifierOrdreQuestion(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const nomQuestion = lireTexte(req.body?.nomQuestion);
      const nouvellePosition = Number.parseInt(lireTexte(req.body?.nouvellePosition), 10);
      const nomTag = lireTexte(req.body?.nomTag);
      const temp = obtenirTempSession(req, idGroupe);
      if (!temp) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Aucun questionnaire en cours d'edition")}`
        );
        return;
      }

      const indexActuel = temp.questions.findIndex((q) => String(q) === String(nomQuestion));
      if (indexActuel < 0) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?nomTag=${encodeURIComponent(nomTag)}&erreur=${encodeURIComponent("Question non trouvee dans le questionnaire")}`
        );
        return;
      }

      QuestionnaireModele.modifierOrdreQuestion(temp, nomQuestion, nouvellePosition);
      definirTempSession(req, idGroupe, temp);

      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires?nomTag=${encodeURIComponent(nomTag)}&succes=${encodeURIComponent("Ordre des questions modifie")}`
      );
      return;
    } catch (e: any) {
      res.redirect(
        `/cours/${encodeURIComponent(req.params?.idCours ?? req.params?.groupId ?? "")}/questionnaires?erreur=${encodeURIComponent(
          e?.message ?? "Erreur lors de la modification de l'ordre"
        )}`
      );
      return;
    }
  }

  static async modifierQuestionnaire(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const temp = obtenirTempSession(req, idGroupe);
      if (!temp) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Aucun questionnaire en cours d'edition")}`
        );
        return;
      }

      const nom = lireTexte(req.body?.nom ?? temp.nomQuestionnaire);
      const description = lireTexte(req.body?.description ?? temp.description);
      const actif = lireBool(req.body?.actif);
      const nomOriginal = lireTexte(temp.nomOriginal ?? temp.nomQuestionnaire);

      if (!nom) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Nom du questionnaire obligatoire")}`
        );
        return;
      }

      if (temp.mode === "modification") {
        await QuestionnaireModele.modifierQuestionnaire(
          idGroupe,
          nomOriginal,
          nom,
          description,
          actif,
          temp.questions
        );
        viderTempSession(req, idGroupe);
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?succes=${encodeURIComponent("Confirmation de la sauvegarde des modifications")}`
        );
        return;
      }

      const ok = await QuestionnaireModele.sauvegarderQuestionnaire(
        idGroupe,
        temp.nomQuestionnaire,
        temp.questions
      );
      if (!ok) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Questionnaire introuvable pour sauvegarde")}`
        );
        return;
      }
      viderTempSession(req, idGroupe);
      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires?succes=${encodeURIComponent("Confirmation de la sauvegarde du questionnaire")}`
      );
      return;
    } catch (e: any) {
      res.redirect(
        `/cours/${encodeURIComponent(req.params?.idCours ?? req.params?.groupId ?? "")}/questionnaires?erreur=${encodeURIComponent(
          e?.message ?? "Erreur lors de la sauvegarde des modifications"
        )}`
      );
      return;
    }
  }

  static async verifierSupprimerQuestionnaire(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const nomQuestionnaire = lireTexte(req.body?.nomQuestionnaire ?? req.query?.nomQuestionnaire);

      if (!idGroupe || !nomQuestionnaire) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Nom du questionnaire manquant")}`
        );
        return;
      }

      const verification = await QuestionnaireModele.verifierSupprimerQuestionnaire(
        idGroupe,
        nomQuestionnaire
      );
      if (!verification.confirmation) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Suppression impossible : ce questionnaire a ete realise par au moins un etudiant.")}`
        );
        return;
      }

      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires?confirmerSuppression=${encodeURIComponent(nomQuestionnaire)}`
      );
      return;
    } catch (e: any) {
      res.redirect(
        `/cours/${encodeURIComponent(req.params?.idCours ?? req.params?.groupId ?? "")}/questionnaires?erreur=${encodeURIComponent(
          e?.message ?? "Erreur lors de la verification de suppression"
        )}`
      );
      return;
    }
  }

  static async confirmerSuppression(req: any, res: Response): Promise<void> {
    try {
      const idGroupe = lireTexte(req.params?.idCours ?? req.params?.groupId);
      const nomQuestionnaire = lireTexte(req.body?.nomQuestionnaire ?? req.query?.nomQuestionnaire);

      const supprime = await QuestionnaireModele.supprimerQuestionnaire(idGroupe, nomQuestionnaire);
      if (!supprime) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires?erreur=${encodeURIComponent("Questionnaire introuvable ou deja supprime")}`
        );
        return;
      }

      const temp = obtenirTempSession(req, idGroupe);
      if (temp && String(temp.nomQuestionnaire).toLowerCase() === String(nomQuestionnaire).toLowerCase()) {
        viderTempSession(req, idGroupe);
      }

      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires?succes=${encodeURIComponent("Suppression du questionnaire confirmee avec succes")}`
      );
      return;
    } catch (e: any) {
      res.redirect(
        `/cours/${encodeURIComponent(req.params?.idCours ?? req.params?.groupId ?? "")}/questionnaires?erreur=${encodeURIComponent(
          e?.message ?? "Erreur lors de la suppression du questionnaire"
        )}`
      );
      return;
    }
  }
}
