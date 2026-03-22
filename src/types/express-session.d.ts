import "express-session";

declare module "express-session" {
  interface SessionData {
    token?: string;
    user?: {
      id: string;
      first_name?: string;
      last_name?: string;
    };
  }
}
