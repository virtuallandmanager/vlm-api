import { Request } from "express";
import { Session } from "../../models/Session.model";

declare module "express-serve-static-core" {
  interface Request {
    session: Session.Config;
    uploadedImage: ImageBitmap;
    imageKeys: { original: string; texture: string; thumbnail: string };
  }
  interface Response {
    session: Session.Config;
  }
}

export function extractToken(req: Request) {
  let token: string;
  if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  }
  if (token) {
    return token;
  }
  return null;
}
