import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { extractToken } from "../../http/controllers/common.controller";
import { NextFunction } from "express";
import { SessionManager } from "../../logic/Session.logic";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionToken = extractToken(req);

  // If the token is not present, return an error response
  if (!sessionToken) {
    return res
      .status(401)
      .json({ error: "Unauthorized: No session token was provided." });
  }

  // Verify the token
  try {
    const session = await SessionManager.validateSessionToken(sessionToken);
    if (!session) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Session token was invalid or expired." });
    } else {
      req.session = session;
      next();
    }
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

export async function web3AuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signatureToken = extractToken(req),
    { signatureAccount, signatureMessage, signature } = req.body;

  // If the token is not present, return an error response
  if (!signatureToken) {
    return res
      .status(401)
      .json({ error: "Unauthorized: No signature token was provided." });
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
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid signature token" });
  }
}
