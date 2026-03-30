import { Response } from "express";
import { obtenirCoursStockeParIdGroupe, obtenirQuestionsDuCours } from "../core/CoursModele";
import { QuestionnaireModele } from "../core/QuestionnaireModele";
import { SgbClient } from "../core/sgbClient";

type TentativeQuestionnaireSession = {
  idGroupe: string;
  nomQuestionnaire: string;
  etudiantId: string;
  typeId: number;
  contientCorrectionManuelle: boolean;
  indexQuestionCourante: number;
  questions: Array<{
    nom: string;
    enonce: string;
    choix: string[];
    bonneReponse: string | null;
    retroactionValide: string;
    retroactionInvalide: string;
    retroactionParChoix: Record<string, string>;
  }>;
  reponses: string[];
};

const sgbBaseUrl = process.env.SGB_BASE_URL ?? "http://localhost:3200";
const sgbClient = new SgbClient(sgbBaseUrl);

function lireTexte(valeur: unknown): string {
  return String(valeur ?? "").trim();
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
          };
        })
        .filter((questionnaire) => questionnaire.noteEtudiant !== undefined);
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

      const questionsChoixMultiples = questionsQuestionnaire.filter(
        (q: any) => Array.isArray(q.reponses)
      );
      if (questionsChoixMultiples.length === 0) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant?erreur=${encodeURIComponent("Aucune question a choix multiple disponible pour ce questionnaire")}`
        );
        return;
      }

      const tentative: TentativeQuestionnaireSession = {
        idGroupe,
        nomQuestionnaire: questionnaire.nom,
        etudiantId,
        typeId: construireTypeIdQuestionnaire(indexQuestionnaire),
        contientCorrectionManuelle: questionsChoixMultiples.length < questionsQuestionnaire.length,
        indexQuestionCourante: 0,
        questions: questionsChoixMultiples.map((q: any) => {
          const choix = (q.reponses ?? []).map((r: any) => String(r.texte));
          const bonneReponse = (q.reponses ?? []).find((r: any) => r.estBonneReponse === true);
          const retroactionParChoix: Record<string, string> = {};
          for (const reponse of q.reponses ?? []) {
            retroactionParChoix[String(reponse.texte)] = String(reponse.retroaction ?? "");
          }

          return {
            nom: String(q.nom),
            enonce: String(q.enonce ?? ""),
            choix,
            bonneReponse: bonneReponse ? String(bonneReponse.texte) : null,
            retroactionValide: String(q.retroactionValide ?? ""),
            retroactionInvalide: String(q.retroactionInvalide ?? ""),
            retroactionParChoix,
          };
        }),
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

  static async repondreQuestionChoixMultiple(req: any, res: Response): Promise<void> {
    try {
      if (!estEtudiantAuthentifie(req)) {
        res.redirect("/signin");
        return;
      }

      const idGroupe = lireTexte(req.params?.idCours);
      const reponse = lireTexte(req.body?.reponse);
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

      if (!reponse || !questionCourante.choix.includes(reponse)) {
        res.redirect(
          `/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant/passer?erreur=${encodeURIComponent("Veuillez selectionner une reponse valide")}`
        );
        return;
      }

      tentative.reponses.push(reponse);
      tentative.indexQuestionCourante += 1;

      if (tentative.indexQuestionCourante < tentative.questions.length) {
        setTentative(req, tentative);
        res.redirect(`/cours/${encodeURIComponent(idGroupe)}/questionnaires/etudiant/passer`);
        return;
      }

      const detailsCorrection = tentative.questions.map((question, index) => {
        const reponseEtudiant = tentative.reponses[index] ?? "";
        const estBonneReponse =
          question.bonneReponse !== null && normaliserCle(reponseEtudiant) === normaliserCle(question.bonneReponse);
        const retroactionSpecifique = question.retroactionParChoix[reponseEtudiant] ?? "";
        const retroaction = retroactionSpecifique
          || (estBonneReponse ? question.retroactionValide : question.retroactionInvalide);

        return {
          nomQuestion: question.nom,
          enonce: question.enonce,
          reponseEtudiant,
          estBonneReponse,
          retroaction,
        };
      });

      const nbBonnesReponses = detailsCorrection.filter((detail) => detail.estBonneReponse).length;
      const notePourcentage =
        tentative.questions.length > 0
          ? Number(((nbBonnesReponses / tentative.questions.length) * 100).toFixed(2))
          : 0;

      await QuestionnaireModele.enregistrerResultatEtudiant(
        tentative.idGroupe,
        tentative.nomQuestionnaire,
        tentative.etudiantId,
        notePourcentage
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
