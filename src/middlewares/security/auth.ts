import { Request, Response } from "express";
import { extractToken } from "../../http/controllers/common.controller";
import { NextFunction } from "express";
import { SessionManager } from "../../logic/Session.logic";
import { UserManager } from "../../logic/User.logic";
import { User } from "../../models/User.model";
import { Client } from "colyseus";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { Analytics } from "../../models/Analytics.model";
import { AnalyticsManager } from "../../logic/Analytics.logic";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {

  if (process.env.NODE_ENV === "production" && req.headers.referer !== "https://vlm.gg" && req.headers.referer !== "https://www.vlm.gg") {
    console.log(req.headers.referer);
    // return res.status(400).json({
    //   text: "Wait a minute...who ARE you?",
    // });
  }

  const sessionToken = extractToken(req);

  // If the token is not present, return an error response
  if (!sessionToken) {
    return res.status(401).json({ error: "Unauthorized: No session token was provided." });
  }

  // Verify the token
  try {
    const session = await SessionManager.validateUserSessionToken(sessionToken);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session token was invalid or expired." });
    } else {
      req.session = session;
      next();
    }
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

export async function web3AuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const signatureToken = extractToken(req),
    { signatureAccount, signatureMessage, signature } = req.body;

  // If the token is not present, return an error response
  if (!signatureToken) {
    return res.status(401).json({ error: "Unauthorized: No signature token was provided." });
  }

  // Verify the token
  try {
    const session = await SessionManager.validateSignatureToken({
      signatureToken,
      signature,
      signatureMessage,
      signatureAccount,
    });
    if (!session) {
      return res.status(401).json({
        error: "Unauthorized: Web3 signature was invalid or timed out.",
      });
    } else {
      req.session = session;
      next();
    }
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid signature token" });
  }
}

export async function vlmAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId;
    const user = await UserManager.getById(userId);
    if (UserManager.getAdminLevel(user) <= User.Roles.VLM_ADMIN) {
      return res.status(401).json({
        error: "Unauthorized: Insufficient Permissions.",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

export async function analyticsAuthMiddleware(client: Client, message: { sessionToken: string; sceneId: string }, next: (auth?: { session: Analytics.Session.Config, user: Analytics.User.Account }) => void) {
  let session;
  const { sessionToken, sceneId } = message;

  // Perform token validation here
  if (sessionToken) {
    // Token is valid, allow access to the next message handling logic
    session = await SessionManager.validateAnalyticsSessionToken(sessionToken);
  }

  if (session?.sessionToken && session?.sessionToken !== sessionToken) {
    AdminLogManager.logWarning("Client tokens were mismatched over WebSocket connection", { client, message, session });
    AdminLogManager.logWarning("Issued a suspicious session", { client, message, session });
    client.send("authentication_error", { message: "Invalid token" });
    const newBotSession = new Analytics.Session.BotConfig({ sessionToken, sceneId });
    await SessionManager.initAnalyticsSession(newBotSession);
    await SessionManager.startAnalyticsSession(newBotSession);
    session = newBotSession;
  }
  if (session) {
    const user = await AnalyticsManager.getUserById(session.userId);
    next({ session, user });
    return;
  }
  next();
}

export async function userAuthMiddleware(client: Client, message: { sessionToken: string; sceneId: string }, next: ({ session, user }?: { session: User.Session.Config, user: User.Account }) => void) {
  let session;
  const { sessionToken, sceneId } = message;

  // Perform token validation here
  if (sessionToken) {
    // Token is valid, allow access to the next message handling logic
    session = await SessionManager.validateUserSessionToken(sessionToken);
  }

  if (session) {
    const user = await UserManager.getById(session.userId);
    next({ session, user });
    return;
  }
  next();
}

export async function alchemyWebhook(req: Request, res: Response, next: NextFunction) {
  next();
}
