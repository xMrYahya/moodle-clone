import express, { NextFunction } from "express";
import ExpressSession from "express-session";
import logger from "morgan";
import flash from "express-flash-plus";

import indexRoutes from "./routes/indexRoutes";
import coursRoutes from "./routes/coursRoutes";
import questionsRoutes from "./routes/questionsRoutes";
import questionnairesRoutes from "./routes/questionnairesRoutes";

import { viderStoreAuDemarrage } from "./core/coursStore";
import { viderQuestionnairesAuDemarrage } from "./core/questionnairesStore";

class App {
  public expressApp: express.Application;

  constructor() {
    this.expressApp = express();

    viderStoreAuDemarrage().catch(console.error);
    viderQuestionnairesAuDemarrage().catch(console.error);

    this.middleware();
    
    this.expressApp.set("view engine", "pug");
    this.expressApp.use(express.static(__dirname + "/public") as express.RequestHandler);

    this.expressApp.use("/", indexRoutes);
    this.expressApp.use("/cours", coursRoutes);
    this.expressApp.use("/questions", questionsRoutes);
    this.expressApp.use("/cours", questionnairesRoutes);

    this.expressApp.use(this.handleErrors);
  }

  private middleware(): void {
    this.expressApp.use(logger("dev") as express.RequestHandler);
    this.expressApp.use(express.json() as express.RequestHandler);
    this.expressApp.use(express.urlencoded({ extended: false }) as express.RequestHandler);
    this.expressApp.use(
      ExpressSession({
        secret: "My Secret Key",
        resave: false,
        saveUninitialized: true,
      })
    );
    this.expressApp.use(flash());
  }

  private handleErrors(error: any, req: any, res: any, next: NextFunction) {
    const status =
      typeof error?.status === "number"
        ? error.status
        : typeof error?.statusCode === "number"
          ? error.statusCode
          : 500;

    console.error(error);

    try {
      req.flash?.("error", error?.message ?? String(error));
    } catch { }

    res.status(status).json({ error: String(error?.message ?? error) });
  }
}

export default new App().expressApp;
