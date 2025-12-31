import { Router, Request, Response, NextFunction } from 'express';
import { JeuDeDes } from '../core/jeuDeDes';
import { InvalidParameterError } from '../core/errors/invalidParameterError';

export class JeuRouter {
  private _router: Router;
  private _controleurJeu: JeuDeDes;  // contrôleur GRASP

  get controleurJeu() {
    return this._controleurJeu;
  }

  get router() {
    return this._router;
  }

  /**
   * Initialiser le router
   */
  constructor() {
    this._controleurJeu = new JeuDeDes();  // un routeur pointe vers au moins un contrôleur GRASP
    this._router = Router();
    this.init();
  }

  /**
   * 
   */
  public demarrerJeu(req: Request, res: Response, next: NextFunction) {

    // Obtenir nom du joueur dans la requête POST
    const nom = req.body.nom;

    // POST ne garantit pas que tous les paramètres de l'opération système sont présents
    if (!nom) {
      throw new InvalidParameterError('Le paramètre nom est absent');
    }

    // Invoquer l'opération système (du DSS) dans le contrôleur GRASP
    const joueur = this._controleurJeu.demarrerJeu(nom);

    // Convertir la string JSON en objet pour l'inclure dans la réponse (ce n'est pas un objet du modèle)
    const joueurObj = JSON.parse(joueur);

    req.flash('info', `Nouveau jeu pour ${nom}`);
    res.status(201)
      .send({
        message: 'Success',
        status: res.status,
        joueur: joueurObj
      });
  }

  /**
   * jouer une fois aux dés
   */
  public jouer(req: Request, res: Response, next: NextFunction) {
    const nom = req.params.nom;

    // Invoquer l'opération système (du DSS) dans le contrôleur GRASP
    const resultat = this._controleurJeu.jouer(nom);
    const resultatObj = JSON.parse(resultat);
    // flash un message selon le résultat
    const key = resultatObj.somme == 7 ? 'win' : 'info';
    req.flash(key,
      `Résultat pour ${nom}: ${resultatObj.v1} + ${resultatObj.v2} = ${resultatObj.somme}`);
    res.status(200)
      .send({
        message: 'Success',
        status: res.status,
        resultat
      });
  }

  /**
   * terminer
   */
  public terminerJeu(req: Request, res: Response, next: NextFunction) {

    // obtenir nom de la requête
    const nom = req.params.nom;

    // Invoquer l'opération système (du DSS) dans le contrôleur GRASP
    const resultat = this._controleurJeu.terminerJeu(nom);
    req.flash('info', `Jeu terminé pour ${nom}`);
    res.status(200)
      .send({
        message: 'Success',
        status: res.status,
        resultat
      });
  }

  /**
     * Initialiser les routes du router 
     */
  init() {
    this._router.post('/demarrerJeu', this.demarrerJeu.bind(this)); // pour .bind voir https://stackoverflow.com/a/15605064/1168342
    this._router.get('/jouer/:nom', this.jouer.bind(this)); // pour .bind voir https://stackoverflow.com/a/15605064/1168342
    this._router.get('/terminerJeu/:nom', this.terminerJeu.bind(this)); // pour .bind voir https://stackoverflow.com/a/15605064/1168342
  }

}

// exporter its configured Express.Router
export const jeuRoutes = new JeuRouter();
jeuRoutes.init();
