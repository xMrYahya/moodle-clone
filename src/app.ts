import express, { NextFunction } from 'express';
import ExpressSession from 'express-session';
import logger from 'morgan';
import flash from 'express-flash-plus';
import { SgbClient } from "./core/sgbClient";

// Creates and configures an ExpressJS web server.
class App {

  // ref to Express instance
  public expressApp: express.Application;

  //Run configuration methods on the Express instance.
  constructor() {
    this.expressApp = express();
    this.middleware();
    this.routes();
    this.expressApp.use(this.handleErrors);
    this.expressApp.set('view engine', 'pug');
    this.expressApp.use(express.static(__dirname + '/public') as express.RequestHandler); // https://expressjs.com/en/starter/static-files.html
  }

  // Configure Express middleware.
  private middleware(): void {
    this.expressApp.use(logger('dev') as express.RequestHandler);
    this.expressApp.use(express.json() as express.RequestHandler);
    this.expressApp.use(express.urlencoded({ extended: false }) as express.RequestHandler);
    this.expressApp.use(ExpressSession(
      {
        secret: 'My Secret Key',
        resave: false,
        saveUninitialized: true
      }));
    this.expressApp.use(flash());
  }

  // Configure API endpoints.
  private routes(): void {
    const titreBase = 'Moodle';
    let router = express.Router();
    const sgbBaseUrl = process.env.SGB_BASE_URL ?? "http://localhost:3200"; // change to real SGB host
    const sgbClient = new SgbClient(sgbBaseUrl);
    // Si user.isAnonymous est vrai, le gabarit Pug affiche une option pour se connecter.
    // user = { isAnonymous: true }; // utilisateur quand personne n'est connecté


    function requireAuth(req: any, res: any, next: any) {
      if (!req.session?.token) return res.redirect('/signin');
      next();
    }

    router.get('/signin', (req: any, res) => {
      if (req.session?.token) return res.redirect('/index');
      res.render('signin', { title: titreBase });
    });

    router.get('/index', requireAuth, (req: any, res) => {
      const teacher = req.session.user; // on va stocker ça au login
      const displayName = teacher
        ? `${teacher.first_name} ${teacher.last_name}`
        : (req.session.email ?? "Enseignant");

      res.render('index', {
        title: titreBase,
        displayName // ✅ pour navbar
      });
    });


    // Route pour jouer (index)
    router.get('/', (req: any, res) => {
      const user = req.session?.token
        ? { nom: req.session.email ?? "Teacher", hasPrivileges: true, isAnonymous: false }
        : { isAnonymous: true, hasPrivileges: false };

      res.render('signin', {
        title: titreBase,
        user,
        messages: req.flash()
      });
    });

    router.post('/signin', async (req: any, res: any): Promise<void> => {
      try {
        const { email, password } = req.body;
        const login = await sgbClient.loginTeacher(email, password);

        req.session.token = login.token;
        req.session.user = login.user;   // {first_name,last_name,id}
        req.session.email = email;

        res.status(200).json({ ok: true });
        return;
      } catch (e: any) {
        res.status(401).json({ ok: false, message: e?.message ?? "Login failed" });
        return;
      }
    });

    // Route to login
    router.get('/signout', (req: any, res) => {
      req.session.destroy(() => res.redirect('/'));
    });


    this.expressApp.use('/', router);  // routage de base
  }

  private handleErrors(error: any, req: any, res: any, next: NextFunction) {
    req.flash('error', error.message);
    res.status(error.code ?? 500).json({ error: error.toString() });

  }
}

export default new App().expressApp;
