import { Response } from "express";
import { obtenirCoursStockeParIdGroupe, obtenirQuestionsDuCours } from "../core/CoursModele";
import { QuestionnaireModele } from "../core/QuestionnaireModele";
import { SgbClient } from "../core/sgbClient";
import {
  TentativeQuestionnaireSession,
  QuestionEnTentative,
  DonneesQuestionParType,
  QuestionType,
  StatutCorrectionQuestion,
} from "../types/tentativeTypes";
import { obtenirValidateur } from "../core/validateursQuestionnaire";
import {
  QuestionVraiFauxModele,
  QuestionChoixMultipleModele,
  QuestionNumeriqueModele,
  QuestionReponseCourteModele,
  QuestionMiseEnCorrespondanceModele,
  QuestionEssaiModele,
  Question,
} from "../types/questionTypes";

const sgbBaseUrl = process.env.SGB_BASE_URL ?? "http://localhost:3200";
const sgbClient = new SgbClient(sgbBaseUrl);

function lireTexte(valeur: unknown): string {
  return String(valeur ?? "").trim();
}

function lireListeTexte(valeur: unknown): string[] {
  if (Array.isArray(valeur)) {
    return valeur.map((v) => String(v).trim()).filter((v) => v.length > 0);
  }
  const texte = String(valeur ?? "").trim();
  return texte ? [texte] : [];
}

function estEtudiantAuthentifie(req: any): boolean {
  return Boolean(req.session?.token && req.session?.user?.id && req.session?.role === "student");
}

function normaliserCle(value: string): string {
  return String(value).trim().toLowerCase();
}

function construireTypeIdQuestionnaire(indexQuestionnaire: number): number {
  return indexQuestionnaire + 1;
}

function getTentative(req: any): TentativeQuestionnaireSession | undefined {
  return req.session?.tentativeQuestionnaire as TentativeQuestionnaireSession | undefined;
}

function setTentative(req: any, tentative: TentativeQuestionnaireSession): void {
  req.session.tentativeQuestionnaire = tentative;
}

function clearTentative(req: any): void {
  if (req.session?.tentativeQuestionnaire) {
    delete req.session.tentativeQuestionnaire;
  }
}

function setResultatFinal(req: any, resultat: any): void {
  req.session.resultatQuestionnaire = resultat;
}

function consumeResultatFinal(req: any): any {
  const resultat = req.session?.resultatQuestionnaire;
  if (req.session?.resultatQuestionnaire) {
    delete req.session.resultatQuestionnaire;
  }
  return resultat;
}

/**
 * Déterminer le type d'une question basé sur sa structure
 */
function detecterTypeQuestion(question: any): QuestionType {
  if (question instanceof QuestionVraiFauxModele) return "VraiFaux";
  if (question instanceof QuestionChoixMultipleModele) return "ChoixMultiple";
  if (question instanceof QuestionNumeriqueModele) return "Numerique";
  if (question instanceof QuestionReponseCourteModele) return "ReponseCourte";
  if (question instanceof QuestionMiseEnCorrespondanceModele) return "MiseEnCorrespondance";
  if (question instanceof QuestionEssaiModele) return "Essai";

  // Heuristique de secours basée sur les champs présents
  if (question.reponses !== undefined) return "ChoixMultiple";
  if (question.paires !== undefined) return "MiseEnCorrespondance";
  if (question.reponseAttendue !== undefined) {
    return typeof question.reponseAttendue === "number" ? "Numerique" : "ReponseCourte";
  }
  if (question.reponse !== undefined) {
    return typeof question.reponse === "boolean" ? "VraiFaux" : "Numerique";
  }
  return "Essai";
}

/**
 * Extraire les données type-spécifiques d'une question
 */
function extraireDonneesParType(question: any): DonneesQuestionParType {
  const type = detecterTypeQuestion(question);

  switch (type) {
    case "VraiFaux":
      return {
        type: "VraiFaux",
        bonneReponse: (question as QuestionVraiFauxModele).reponse,
      };

    case "ChoixMultiple":
      {
        const q = question as QuestionChoixMultipleModele;
        const choix = (q.reponses ?? []).map((r: any) => String(r.texte));
        const bonnesReponses = (q.reponses ?? [])
          .filter((r: any) => r.estBonneReponse === true)
          .map((r: any) => String(r.texte));
        const retroactionParChoix: Record<string, string> = {};
        for (const reponse of q.reponses ?? []) {
          retroactionParChoix[String(reponse.texte)] = String(reponse.retroaction ?? "");
        }
        return {
          type: "ChoixMultiple",
          choix,
          seulementUnChoix: q.seulementUnChoix === true,
          bonnesReponses,
          retroactionParChoix,
        };
      }

    case "Numerique":
      return {
        type: "Numerique",
        bonneReponse: (question as QuestionNumeriqueModele).reponseAttendue,
      };

    case "ReponseCourte":
      return {
        type: "ReponseCourte",
        bonneReponse: (question as QuestionReponseCourteModele).reponseAttendue,
      };

    case "MiseEnCorrespondance":
      return {
        type: "MiseEnCorrespondance",
        paires: (question as QuestionMiseEnCorrespondanceModele).paires,
      };

    case "Essai":
    default:
      return {
        type: "Essai",
      };
  }
}

export class EtudiantQuestionnairesController {
  static async afficherQuestionnairesCours(req: any, res: Response): Promise<void> {
    try {
      if (!estEtudiantAuthentifie(req)) {
        res.redirect("/signin");
        return;
      }

      const idGroupe = lireTexte(req.params?.idCours);
      const etudiant = req.session.user;
      const etudiantId = lireTexte(etudiant?.id);

      const cours = await obtenirCoursStockeParIdGroupe(idGroupe);
      if (!cours) {
        res.status(404).send("Cours introuvable");
        return;
      }

      const estInscrit = (cours.etudiants ?? []).some(
        (e) => normaliserCle(String(e.email)) === normaliserCle(etudiantId)
      );
      if (!estInscrit) {
        res.status(403).send("Acces refuse: etudiant non inscrit a ce cours");
        return;
      }

      const questionnaires = await QuestionnaireModele.obtenirQuestionnairesAssocies(idGroupe);
      const questionnairesCompletes = questionnaires
        .map((questionnaire) => {
          const resultatEtudiant = (questionnaire.resultatsEtudiants ?? []).find(
            (r) => normaliserCle(String(r.courrielEtudiant)) === normaliserCle(etudiantId)
          );
          return {
            ...questionnaire,
            noteEtudiant: resultatEtudiant?.note,
            statutEtudiant: resultatEtudiant?.statutGlobal,
          };
        })
        .filter((questionnaire) => questionnaire.statutEtudiant !== undefined);
      const questionnairesACompleter = questionnaires.filter((questionnaire) => {
        const dejaComplete = (questionnaire.resultatsEtudiants ?? []).some(
          (r) => normaliserCle(String(r.courrielEtudiant)) === normaliserCle(etudiantId)
        );
        return questionnaire.actif && !dejaComplete;
      });

      res.render("questionnaires-etudiant", {
        title: "Passer un questionnaire",
        displayName: `${etudiant.first_name} ${etudiant.last_name}`,
        cours,
        idCours: idGroupe,
        questionnairesCompletes,
        questionnairesACompleter,
        etudiantId,
        messageErreur: lireTexte(req.query?.erreur),
        messageSucces: lireTexte(req.query?.succes),
      });
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Echec du chargement des questionnaires etudiant");
      return;
    }
  }

  static async demarrerQuestionnaire(req: any, res: Response): Promise<void> {
    try {
      if (!estEtudiantAuthentifie(req)) {
        res.redirect("/signin");
        return;
      }

      const idGroupe = lireTexte(req.params?.idCours);
      const nomQuestionnaire = lireTexte(req.body?.nomQuestionnaire);
      const etudiantId = lireTexte(req.session?.user?.id);

      const cours = await obtenirCoursStockeParIdGroupe(idGroupe);
      if (!cours) {
        res.status(404).send("Cours introuvable");
        return;
      }

      const estInscrit = (cours.etudiants ?? []).some(
        (e) => normaliserCle(String(e.email)) === normaliserCle(etudiantId)
      );
      if (!estInscrit) {
        res.status(403).send("Acces refuse: etudiant non inscrit a ce cours");
        return;
      }

      const questionnaires = await QuestionnaireModele.obtenirQuestionnairesAssocies(idGroupe);
      const indexQuestionnaire = questionnaires.findIndex(
        (q) => normaliserCle(String(q.nom)) === normaliserCle(nomQuestionnaire)
      );
      if (indexQuestionnaire < 0) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant?erreur=${encodeURIComponent("Questionnaire introuvable")}`
        );
        return;
      }

      const questionnaire = questionnaires[indexQuestionnaire];
      const dejaComplete = (questionnaire.resultatsEtudiants ?? []).some(
        (r) => normaliserCle(String(r.courrielEtudiant)) === normaliserCle(etudiantId)
      );

      if (!questionnaire.actif || dejaComplete) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant?erreur=${encodeURIComponent("Questionnaire non disponible")}`
        );
        return;
      }

      const questionsCours = await obtenirQuestionsDuCours(idGroupe);
      const questionsQuestionnaire = (questionnaire.questions ?? [])
        .map((nom) =>
          questionsCours.find((q: any) => normaliserCle(String(q.nom)) === normaliserCle(String(nom)))
        )
        .filter((q): q is any => Boolean(q));

      if (questionsQuestionnaire.length === 0) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant?erreur=${encodeURIComponent("Ce questionnaire ne contient aucune question")}`
        );
        return;
      }

      // ÉTAPE 3: Adapter le mapping — Charger TOUS les types (suppression du filtre ChoixMultiple)
      const questionsEnTentative: QuestionEnTentative[] = questionsQuestionnaire.map((q: any) => {
        const type = detecterTypeQuestion(q);
        const donnees = extraireDonneesParType(q);

        return {
          nom: String(q.nom),
          enonce: String(q.enonce ?? ""),
          type,
          retroactionValide: String(q.retroactionValide ?? ""),
          retroactionInvalide: String(q.retroactionInvalide ?? ""),
          donnees,
        };
      });

      // Détecter correction manuelle: Essai ou MiseEnCorrespondance
      const contientCorrectionManuelle = questionsEnTentative.some(
        (q) => q.type === "Essai" || q.type === "MiseEnCorrespondance"
      );

      const tentative: TentativeQuestionnaireSession = {
        idGroupe,
        nomQuestionnaire: questionnaire.nom,
        etudiantId,
        typeId: construireTypeIdQuestionnaire(indexQuestionnaire),
        contientCorrectionManuelle,
        indexQuestionCourante: 0,
        questions: questionsEnTentative,
        reponses: [],
      };

      setTentative(req, tentative);
      res.redirect(`/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant/passer`);
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Echec du demarrage du questionnaire");
      return;
    }
  }

  static async afficherQuestionCourante(req: any, res: Response): Promise<void> {
    if (!estEtudiantAuthentifie(req)) {
      res.redirect("/signin");
      return;
    }

    const tentative = getTentative(req);
    const idGroupe = lireTexte(req.params?.idCours);
    if (!tentative || tentative.idGroupe !== idGroupe) {
      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant?erreur=${encodeURIComponent("Aucune tentative en cours")}`
      );
      return;
    }

    const question = tentative.questions[tentative.indexQuestionCourante];
    if (!question) {
      res.redirect(`/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant/resultat`);
      return;
    }

    const cours = await obtenirCoursStockeParIdGroupe(idGroupe);
    res.render("passer-questionnaire", {
      title: "Question en cours",
      displayName: `${req.session.user.first_name} ${req.session.user.last_name}`,
      idCours: idGroupe,
      cours,
      nomQuestionnaire: tentative.nomQuestionnaire,
      indexQuestionCourante: tentative.indexQuestionCourante + 1,
      totalQuestions: tentative.questions.length,
      question,
      messageErreur: lireTexte(req.query?.erreur),
    });
  }

  // ÉTAPE 4: Renommer repondreQuestionChoixMultiple → repondreQuestion (dispatcher polymorphe)
  static async repondreQuestion(req: any, res: Response): Promise<void> {
    try {
      if (!estEtudiantAuthentifie(req)) {
        res.redirect("/signin");
        return;
      }

      const idGroupe = lireTexte(req.params?.idCours);
      const reponseBrute = req.body?.reponse;
      const tentative = getTentative(req);
      if (!tentative || tentative.idGroupe !== idGroupe) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant?erreur=${encodeURIComponent("Aucune tentative en cours")}`
        );
        return;
      }

      const questionCourante = tentative.questions[tentative.indexQuestionCourante];
      if (!questionCourante) {
        res.redirect(`/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant/resultat`);
        return;
      }

      // Dispatcher polymorphe: valider selon le type
      const type = questionCourante.type;
      const validateur = obtenirValidateur(type);

      let reponseSaisie: unknown = lireTexte(reponseBrute);
      if (type === "ChoixMultiple") {
        if (questionCourante.donnees.type === "ChoixMultiple" && questionCourante.donnees.seulementUnChoix === false) {
          reponseSaisie = lireListeTexte(reponseBrute);
        } else {
          reponseSaisie = lireTexte(reponseBrute);
        }
      }

      const { valide, message } = validateur.valider(reponseSaisie);

      if (!valide) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant/passer?erreur=${encodeURIComponent(message || "Reponse invalide")}`
        );
        return;
      }

      // Parser la réponse selon le type et la stocker de manière typée
      let reponseTypee: string | number | boolean | string[] = Array.isArray(reponseSaisie)
        ? reponseSaisie
        : String(reponseSaisie ?? "");
      if (type === "VraiFaux") {
        reponseTypee = String(reponseSaisie).toLowerCase() === "true";
      } else if (type === "Numerique") {
        reponseTypee = parseFloat(String(reponseSaisie));
      }

      tentative.reponses.push(reponseTypee);
      tentative.indexQuestionCourante += 1;

      if (tentative.indexQuestionCourante < tentative.questions.length) {
        setTentative(req, tentative);
        res.redirect(`/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant/passer`);
        return;
      }

      // ÉTAPE 5: Adapter détails de correction — Généraliser le calcul par type
      const detailsCorrection = tentative.questions.map((question, index) => {
        const reponseEtudiant = tentative.reponses[index] ?? null;
        const type = question.type;
        const validateur = obtenirValidateur(type);
        const estCorrectionManuelle = type === "Essai" || type === "MiseEnCorrespondance";

        const statutCorrection: StatutCorrectionQuestion = estCorrectionManuelle
          ? "en_attente_correction"
          : "corrige_automatiquement";

        const estBonneReponse = estCorrectionManuelle
          ? undefined
          : validateur.estBonneReponse(reponseEtudiant, question.donnees);

        const retroaction = validateur.obtenirRetroaction(
          reponseEtudiant,
          question.donnees,
          question.retroactionValide,
          question.retroactionInvalide
        );

        const reponseAffichable = Array.isArray(reponseEtudiant)
          ? reponseEtudiant.join(" | ")
          : reponseEtudiant !== null
            ? String(reponseEtudiant)
            : "";

        return {
          nomQuestion: question.nom,
          type,
          enonce: question.enonce,
          reponseEtudiant: reponseAffichable,
          statutCorrection,
          estBonneReponse,
          retroaction,
        };
      });

      const detailsAuto = detailsCorrection.filter(
        (detail) => detail.statutCorrection === "corrige_automatiquement"
      );
      const nbBonnesReponses = detailsAuto.filter((detail) => detail.estBonneReponse === true).length;
      const notePourcentage =
        detailsAuto.length > 0
          ? Number(((nbBonnesReponses / detailsAuto.length) * 100).toFixed(2))
          : 0;

      const statutGlobal = tentative.contientCorrectionManuelle
        ? "en_attente_correction"
        : "corrige_automatiquement";

      await QuestionnaireModele.enregistrerResultatEtudiant(
        tentative.idGroupe,
        tentative.nomQuestionnaire,
        tentative.etudiantId,
        tentative.contientCorrectionManuelle ? undefined : notePourcentage,
        statutGlobal,
        detailsCorrection
      );

      let noteTransmiseSgb = false;
      let messageErreurSgb = "";
      if (!tentative.contientCorrectionManuelle) {
        try {
          await sgbClient.insererNote(req.session.token, {
            student_id: tentative.etudiantId,
            group_id: tentative.idGroupe,
            type: tentative.nomQuestionnaire,
            type_id: tentative.typeId,
            grade: notePourcentage,
          });
          noteTransmiseSgb = true;
        } catch (e: any) {
          messageErreurSgb = e?.message ?? "Echec du transfert de la note vers SGB";
        }
      }

      setResultatFinal(req, {
        idGroupe: tentative.idGroupe,
        nomQuestionnaire: tentative.nomQuestionnaire,
        notePourcentage,
        detailsCorrection,
        statutGlobal,
        contientCorrectionManuelle: tentative.contientCorrectionManuelle,
        noteTransmiseSgb,
        messageErreurSgb,
      });
      clearTentative(req);

      res.redirect(`/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant/resultat`);
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Echec de l'enregistrement de la reponse");
      return;
    }
  }

  static async afficherResultat(req: any, res: Response): Promise<void> {
    if (!estEtudiantAuthentifie(req)) {
      res.redirect("/signin");
      return;
    }

    const idGroupe = lireTexte(req.params?.idCours);
    const resultat = consumeResultatFinal(req);
    if (!resultat || resultat.idGroupe !== idGroupe) {
      res.redirect(
        `/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant?erreur=${encodeURIComponent("Aucun resultat a afficher")}`
      );
      return;
    }

    const cours = await obtenirCoursStockeParIdGroupe(idGroupe);
    res.render("resultat-questionnaire", {
      title: "Resultat du questionnaire",
      displayName: `${req.session.user.first_name} ${req.session.user.last_name}`,
      idCours: idGroupe,
      cours,
      resultat,
    });
  }
}
