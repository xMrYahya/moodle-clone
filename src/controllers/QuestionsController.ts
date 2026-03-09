import { Response } from "express";
import { 
  ajouterQuestionAuCours,
  recupererQuestionParNom,
  recupererQuestionsDuCours,
  existeNomQuestion,
  existeNomQuestionEnExcluant,
  supprimerQuestionDuCours,
  modifierQuestionDuCours,
} from "../core/coursStore";
import {
  PairDeCorrespondance,
  Question,
  QuestionChoixMultipleModele,
  QuestionEssaiModele,
  QuestionMiseEnCorrespondanceModele,
  QuestionNumeriqueModele,
  QuestionReponseCourteModele,
  QuestionVraiFauxModele,
  ReponseChoixMultiple,
} from "../types/questionTypes";
import { AlreadyExistsError } from "../core/errors/alreadyExistsError";
import { InvalidParameterError } from "../core/errors/invalidParameterError";
import { NotFoundError } from "../core/errors/notFoundError";
import { convertirQuestionModeleEnDonnees } from "../core/questionsFactory";

export class QuestionsController {
  private static lireValeurSimple(valeur: unknown): unknown {
    if (!Array.isArray(valeur)) {
      return valeur;
    }

    const valeurNonVide = valeur.find((element) => QuestionsController.lireTexte(element) !== "");
    return valeurNonVide ?? valeur[0];
  }

  private static lireTexte(valeur: unknown): string {
    return String(QuestionsController.lireValeurSimple(valeur) ?? "").trim();
  }

  private static lireBooleen(valeur: unknown): boolean | null {
    const valeurSimple = QuestionsController.lireValeurSimple(valeur);

    if (typeof valeurSimple === "boolean") {
      return valeurSimple;
    }

    const texte = String(valeurSimple ?? "").trim().toLowerCase();
    if (texte === "true") {
      return true;
    }
    if (texte === "false") {
      return false;
    }

    return null;
  }

  private static lireNombre(valeur: unknown): number | null {
    const texte = QuestionsController.lireTexte(valeur);
    if (!texte) {
      return null;
    }

    const nombre = Number.parseFloat(texte);
    if (!Number.isFinite(nombre)) {
      return null;
    }

    return nombre;
  }

  private static extraireContexteRequete(req: any): { idEnseignant: string; idGroupe: string } {
    const idEnseignant = QuestionsController.lireTexte(req?.session?.user?.id);
    const idGroupe = QuestionsController.lireTexte(req?.params?.idGroupe);

    if (!idEnseignant || !idGroupe) {
      throw new InvalidParameterError("Enseignant ou cours manquant");
    }

    return { idEnseignant, idGroupe };
  }

  private static validerChampsObligatoires(
    donnees: Record<string, unknown>,
    champsObligatoires: string[]
  ): void {
    const champsManquants = champsObligatoires.filter((champ) => {
      const valeur = donnees[champ];
      return valeur === undefined || valeur === null || QuestionsController.lireTexte(valeur) === "";
    });

    if (champsManquants.length > 0) {
      throw new InvalidParameterError(`Champs manquants: ${champsManquants.join(", ")}`);
    }
  }

  private static async validerNomQuestionUnique(
    idGroupe: string,
    nom: string,
    nomAExclure?: string
  ): Promise<void> {
    const nomNettoye = QuestionsController.lireTexte(nom);
    const nomExcluNettoye = QuestionsController.lireTexte(nomAExclure);

    const existe = nomExcluNettoye
      ? await existeNomQuestionEnExcluant(idGroupe, nomNettoye, nomExcluNettoye)
      : await existeNomQuestion(idGroupe, nomNettoye);

    if (existe) {
      throw new AlreadyExistsError(`Une question avec le nom "${nomNettoye}" existe déjà`);
    }
  }

  private static validerTagsObligatoires(tags: unknown): string[] {
    const tagsValides = QuestionsController.lireTags(tags);
    if (tagsValides.length === 0) {
      throw new InvalidParameterError("Champs manquants: tags");
    }
    return tagsValides;
  }

  static async consulterQuestionsCours(req: any, res: Response): Promise<void> {
    try {
      const { idGroupe } = QuestionsController.extraireContexteRequete(req);
      const questions = await recupererQuestionsDuCours(idGroupe);

      res.status(200).json({
        success: true,
        questions,
      });
      return;
    } catch (erreur: any) {
      if (erreur instanceof InvalidParameterError) {
        res.status(400).json({ error: erreur.message });
      } else {
        res.status(500).json({ error: erreur?.message ?? "Erreur lors de la récupération des questions" });
      }
      return;
    }
  }

  static async selectionnerQuestion(req: any, res: Response): Promise<void> {
    try {
      const { idGroupe } = QuestionsController.extraireContexteRequete(req);
      const nom = QuestionsController.lireTexte(req.params?.nom);

      if (!nom) {
        throw new InvalidParameterError("Nom de question manquant");
      }

      const question = await recupererQuestionParNom(idGroupe, nom);
      if (!question) {
        throw new NotFoundError(`Question introuvable avec le nom "${nom}"`);
      }

      res.status(200).json({
        success: true,
        question,
      });
      return;
    } catch (erreur: any) {
      if (erreur instanceof InvalidParameterError) {
        res.status(400).json({ error: erreur.message });
      } else if (erreur instanceof NotFoundError) {
        res.status(404).json({ error: erreur.message });
      } else {
        res.status(500).json({ error: erreur?.message ?? "Erreur lors de la récupération de la question" });
      }
      return;
    }
  }

  static async modifierQuestion(req: any, res: Response): Promise<void> {
    try {
      const { idGroupe } = QuestionsController.extraireContexteRequete(req);
      const nomOriginal = QuestionsController.lireTexte(req.params?.nom);

      if (!nomOriginal) {
        throw new InvalidParameterError("Nom de question manquant");
      }

      const questionExistante = await recupererQuestionParNom(idGroupe, nomOriginal);
      if (!questionExistante) {
        throw new NotFoundError(`Question introuvable avec le nom "${nomOriginal}"`);
      }

      const {
        type,
        nom,
        enonce,
        retroactionValide,
        retroactionInvalide,
        tags,
        ...donneesComplementairesBrutes
      } = req.body;

      const typeFinal = QuestionsController.lireTexte(type ?? questionExistante.type);
      const nomFinal = QuestionsController.lireTexte(nom ?? questionExistante.nom);
      const enonceFinal = QuestionsController.lireTexte(enonce ?? questionExistante.enonce);

      QuestionsController.validerChampsObligatoires(
        {
          type: typeFinal,
          nom: nomFinal,
          enonce: enonceFinal,
        },
        ["type", "nom", "enonce"]
      );

      await QuestionsController.validerNomQuestionUnique(idGroupe, nomFinal, nomOriginal);

      const retroactionValideFinale = QuestionsController.lireTexte(
        retroactionValide ?? questionExistante.retroactionValide
      );
      const retroactionInvalideFinale = QuestionsController.lireTexte(
        retroactionInvalide ?? questionExistante.retroactionInvalide
      );
      const tagsFinaux =
        tags !== undefined
          ? QuestionsController.lireTags(tags)
          : Array.isArray(questionExistante.tags)
            ? questionExistante.tags
            : [];

      if (typeFinal === "VraiFaux") {
        const reponseSource =
          donneesComplementairesBrutes.reponse !== undefined
            ? donneesComplementairesBrutes.reponse
            : donneesComplementairesBrutes.reponseVf !== undefined
              ? donneesComplementairesBrutes.reponseVf
              : (questionExistante as any).reponse;

        const reponseBoolean = QuestionsController.lireBooleen(reponseSource);
        if (reponseBoolean === null) {
          throw new InvalidParameterError("Champs manquants: reponse");
        }

        const questionMiseAJour = new QuestionVraiFauxModele(
          nomFinal,
          enonceFinal,
          retroactionValideFinale,
          retroactionInvalideFinale,
          tagsFinaux,
          reponseBoolean,
          retroactionValideFinale
        );

        await modifierQuestionDuCours(idGroupe, nomOriginal, questionMiseAJour);

        res.status(200).json({
          success: true,
          message: "Question modifiée avec succès",
          question: convertirQuestionModeleEnDonnees(questionMiseAJour),
        });
        return;
      }

      const donneesComplementaires = {
        ...donneesComplementairesBrutes,
        seulementUnChoix:
          donneesComplementairesBrutes.seulementUnChoix !== undefined
            ? donneesComplementairesBrutes.seulementUnChoix
            : donneesComplementairesBrutes.seulementUnChoixCm !== undefined
              ? donneesComplementairesBrutes.seulementUnChoixCm
            : (questionExistante as any).seulementUnChoix,
        reponses:
          donneesComplementairesBrutes.reponses !== undefined
            ? donneesComplementairesBrutes.reponses
            : donneesComplementairesBrutes.reponsesCm !== undefined
              ? donneesComplementairesBrutes.reponsesCm
              : (questionExistante as any).reponses,
        paires:
          donneesComplementairesBrutes.paires !== undefined
            ? donneesComplementairesBrutes.paires
            : donneesComplementairesBrutes.pairesMec !== undefined
              ? donneesComplementairesBrutes.pairesMec
              : (questionExistante as any).paires,
        reponse:
          donneesComplementairesBrutes.reponse !== undefined
            ? donneesComplementairesBrutes.reponse
            : donneesComplementairesBrutes.reponseLibre !== undefined
              ? donneesComplementairesBrutes.reponseLibre
            : donneesComplementairesBrutes.reponseAttendue !== undefined
              ? donneesComplementairesBrutes.reponseAttendue
              : (questionExistante as any).reponseAttendue,
      };

      if (typeFinal === "ReponseCourte") {
        const reponseTexte = QuestionsController.lireTexte(donneesComplementaires.reponse);
        if (!reponseTexte) {
          throw new InvalidParameterError("Champs manquants: reponse");
        }
      }

      if (typeFinal === "Numerique") {
        const valeurNumerique = QuestionsController.lireNombre(donneesComplementaires.reponse);
        if (valeurNumerique === null) {
          throw new InvalidParameterError("Valeur invalide: reponse numérique attendue");
        }
      }

      if (typeFinal === "ChoixMultiple") {
        const reponsesTexte = QuestionsController.lireTexte(donneesComplementaires.reponses);
        const reponsesListe = Array.isArray(donneesComplementaires.reponses)
          ? donneesComplementaires.reponses
          : [];
        if (!reponsesTexte && reponsesListe.length === 0) {
          throw new InvalidParameterError("Champs manquants: reponses");
        }
      }

      if (typeFinal === "MiseEnCorrespondance") {
        const pairesTexte = QuestionsController.lireTexte(donneesComplementaires.paires);
        const pairesListe = Array.isArray(donneesComplementaires.paires)
          ? donneesComplementaires.paires
          : [];
        if (!pairesTexte && pairesListe.length === 0) {
          throw new InvalidParameterError("Champs manquants: paires");
        }
      }

      const questionMiseAJour = QuestionsController.creerQuestionAutreType(
        typeFinal,
        nomFinal,
        enonceFinal,
        retroactionValideFinale,
        retroactionInvalideFinale,
        tagsFinaux,
        donneesComplementaires
      );

      await modifierQuestionDuCours(idGroupe, nomOriginal, questionMiseAJour);

      res.status(200).json({
        success: true,
        message: "Question modifiée avec succès",
        question: convertirQuestionModeleEnDonnees(questionMiseAJour),
      });
      return;
    } catch (erreur: any) {
      if (erreur instanceof AlreadyExistsError) {
        res.status(409).json({ error: erreur.message });
      } else if (erreur instanceof InvalidParameterError) {
        res.status(400).json({ error: erreur.message });
      } else if (erreur instanceof NotFoundError) {
        res.status(404).json({ error: erreur.message });
      } else {
        res.status(500).json({ error: erreur?.message ?? "Erreur lors de la modification de la question" });
      }
      return;
    }
  }

  static async supprimerQuestion(req: any, res: Response): Promise<void> {
    try {
      const { idGroupe } = QuestionsController.extraireContexteRequete(req);
      const nom = QuestionsController.lireTexte(req.params?.nom);

      if (!nom) {
        throw new InvalidParameterError("Nom de question manquant");
      }

      const question = await recupererQuestionParNom(idGroupe, nom);
      if (!question) {
        throw new NotFoundError(`Question introuvable avec le nom "${nom}"`);
      }

      res.status(200).json({
        success: true,
        message: "Confirmation de suppression requise",
        question,
      });
      return;
    } catch (erreur: any) {
      if (erreur instanceof InvalidParameterError) {
        res.status(400).json({ error: erreur.message });
      } else if (erreur instanceof NotFoundError) {
        res.status(404).json({ error: erreur.message });
      } else {
        res.status(500).json({ error: erreur?.message ?? "Erreur lors de la préparation de suppression" });
      }
      return;
    }
  }

  static async confirmerSuppressionQuestion(req: any, res: Response): Promise<void> {
    try {
      const { idGroupe } = QuestionsController.extraireContexteRequete(req);
      const nom = QuestionsController.lireTexte(req.params?.nom);

      if (!nom) {
        throw new InvalidParameterError("Nom de question manquant");
      }

      const question = await recupererQuestionParNom(idGroupe, nom);
      if (!question) {
        throw new NotFoundError(`Question introuvable avec le nom "${nom}"`);
      }

      await supprimerQuestionDuCours(idGroupe, nom);
      const questions = await recupererQuestionsDuCours(idGroupe);

      res.status(200).json({
        success: true,
        message: "Question supprimée avec succès",
        questions,
      });
      return;
    } catch (erreur: any) {
      if (erreur instanceof InvalidParameterError) {
        res.status(400).json({ error: erreur.message });
      } else if (erreur instanceof NotFoundError) {
        res.status(404).json({ error: erreur.message });
      } else {
        res.status(500).json({ error: erreur?.message ?? "Erreur lors de la suppression de la question" });
      }
      return;
    }
  }

  private static lireTags(tags: unknown): string[] {
    if (Array.isArray(tags)) {
      return tags.map(String).map((t) => t.trim()).filter((t) => t.length > 0);
    }

    if (tags) {
      return String(tags).split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    }

    return [];
  }

  private static lireReponsesChoixMultiple(reponses: unknown): ReponseChoixMultiple[] {
    if (Array.isArray(reponses)) {
      return reponses
        .map((item: any) => ({
          texte: String(item?.texte ?? "").trim(),
          estBonneReponse: item?.estBonneReponse === true,
          retroaction: String(item?.retroaction ?? "").trim(),
        }))
        .filter((item) => item.texte.length > 0);
    }

    const texte = String(reponses ?? "").trim();
    if (!texte) {
      return [];
    }

    return texte
      .split("|")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item, index) => ({
        texte: item,
        estBonneReponse: index === 0,
        retroaction: "",
      }));
  }

  private static lirePairesCorrespondance(paires: unknown): PairDeCorrespondance[] {
    if (Array.isArray(paires)) {
      return paires
        .map((item: any) => ({
          question: String(item?.question ?? "").trim(),
          reponse: String(item?.reponse ?? "").trim(),
        }))
        .filter((item) => item.question.length > 0 || item.reponse.length > 0);
    }

    const texte = String(paires ?? "").trim();
    if (!texte) {
      return [];
    }

    return texte
      .split("|")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => {
        const separateur = item.indexOf(":");
        if (separateur === -1) {
          return { question: item, reponse: "" };
        }

        return {
          question: item.slice(0, separateur).trim(),
          reponse: item.slice(separateur + 1).trim(),
        };
      });
  }

  private static creerQuestionAutreType(
    type: string,
    nom: string,
    enonce: string,
    retroactionValide: string,
    retroactionInvalide: string,
    tags: string[],
    autresDonnees: Record<string, unknown>
  ): Question {
    if (type === "ChoixMultiple") {
      const reponses = QuestionsController.lireReponsesChoixMultiple(autresDonnees.reponses);
      if (reponses.length === 0) {
        throw new InvalidParameterError("Champs manquants: reponses");
      }

      return new QuestionChoixMultipleModele(
        nom,
        enonce,
        retroactionValide,
        retroactionInvalide,
        tags,
        autresDonnees.seulementUnChoix === true || autresDonnees.seulementUnChoix === "true",
        reponses
      );
    }

    if (type === "MiseEnCorrespondance") {
      const paires = QuestionsController.lirePairesCorrespondance(autresDonnees.paires);
      if (paires.length === 0) {
        throw new InvalidParameterError("Champs manquants: paires");
      }

      return new QuestionMiseEnCorrespondanceModele(
        nom,
        enonce,
        retroactionValide,
        retroactionInvalide,
        tags,
        paires
      );
    }

    if (type === "ReponseCourte") {
      const reponseAttendue = String(autresDonnees.reponse ?? "").trim();
      if (!reponseAttendue) {
        throw new InvalidParameterError("Champs manquants: reponse");
      }

      return new QuestionReponseCourteModele(
        nom,
        enonce,
        retroactionValide,
        retroactionInvalide,
        tags,
        reponseAttendue,
        retroactionValide
      );
    }

    if (type === "Numerique") {
      const valeur = Number.parseFloat(String(autresDonnees.reponse ?? "").trim());
      if (!Number.isFinite(valeur)) {
        throw new InvalidParameterError("Champs manquants: reponse");
      }

      return new QuestionNumeriqueModele(
        nom,
        enonce,
        retroactionValide,
        retroactionInvalide,
        tags,
        valeur,
        retroactionValide
      );
    }

    if (type === "Essai") {
      return new QuestionEssaiModele(
        nom,
        enonce,
        retroactionValide,
        retroactionInvalide,
        tags
      );
    }

    throw new InvalidParameterError(`Type de question non supporté: ${type}`);
  }
  
  static async ajouterQuestionVraiFaux(req: any, res: Response): Promise<void> {
    try {
      const { idGroupe } = QuestionsController.extraireContexteRequete(req);
      const { nom, enonce, reponse, retroactionValide, retroactionInvalide, tags } = req.body;

      QuestionsController.validerChampsObligatoires({ nom, enonce, reponse }, ["nom", "enonce", "reponse"]);
      await QuestionsController.validerNomQuestionUnique(idGroupe, String(nom));

      const reponseBoolean = reponse === "true" || reponse === true;

      const tagsValides = QuestionsController.validerTagsObligatoires(tags);

      const nouvelleQuestion = new QuestionVraiFauxModele(
        String(nom).trim(),
        String(enonce).trim(),
        String(retroactionValide || "").trim(),
        String(retroactionInvalide || "").trim(),
        tagsValides,
        reponseBoolean,
        String(retroactionValide || "").trim()
      );

      await ajouterQuestionAuCours(String(idGroupe), nouvelleQuestion);

      res.status(201).json({
        success: true,
        message: "Question ajoutée avec succès",
        question: convertirQuestionModeleEnDonnees(nouvelleQuestion),
      });
      return;
    } catch (erreur: any) {
      if (erreur instanceof AlreadyExistsError) {
        res.status(409).json({ error: erreur.message });
      } else if (erreur instanceof InvalidParameterError) {
        res.status(400).json({ error: erreur.message });
      } else {
        res.status(500).json({ error: erreur?.message ?? "Erreur lors de l'ajout de la question" });
      }
      return;
    }
  }

  private static async ajouterQuestionParType(req: any, res: Response, typeQuestion: string): Promise<void> {
    try {
      const { idGroupe } = QuestionsController.extraireContexteRequete(req);
      const { nom, enonce, retroactionValide, retroactionInvalide, tags, ...donneesComplementairesBrutes } = req.body;

      QuestionsController.validerChampsObligatoires({ nom, enonce }, ["nom", "enonce"]);
      await QuestionsController.validerNomQuestionUnique(idGroupe, String(nom));

      const tagsValides = QuestionsController.validerTagsObligatoires(tags);

      const nouvelleQuestion = QuestionsController.creerQuestionAutreType(
        typeQuestion,
        String(nom).trim(),
        String(enonce).trim(),
        String(retroactionValide || "").trim(),
        String(retroactionInvalide || "").trim(),
        tagsValides,
        donneesComplementairesBrutes
      );

      await ajouterQuestionAuCours(String(idGroupe), nouvelleQuestion);

      res.status(201).json({
        success: true,
        message: "Question ajoutée avec succès",
        question: convertirQuestionModeleEnDonnees(nouvelleQuestion),
      });
      return;
    } catch (erreur: any) {
      if (erreur instanceof AlreadyExistsError) {
        res.status(409).json({ error: erreur.message });
      } else if (erreur instanceof InvalidParameterError) {
        res.status(400).json({ error: erreur.message });
      } else {
        res.status(500).json({ error: erreur?.message ?? "Erreur lors de l'ajout de la question" });
      }
      return;
    }
  }

  static async ajouterQuestionChoixMultiple(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "ChoixMultiple");
  }

  static async ajouterQuestionNumerique(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "Numerique");
  }

  static async ajouterQuestionReponseCourte(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "ReponseCourte");
  }

  static async ajouterQuestionMiseEnCorrespondance(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "MiseEnCorrespondance");
  }

  static async ajouterQuestionEssai(req: any, res: Response): Promise<void> {
    await QuestionsController.ajouterQuestionParType(req, res, "Essai");
  }
}


