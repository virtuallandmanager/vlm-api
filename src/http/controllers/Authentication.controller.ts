import express, { Request, Response } from "express";
const router = express.Router();
import * as dcl from "decentraland-crypto-middleware";
import { VALID_SIGNATURE_TOLERANCE_INTERVAL_MS, Metadata } from "../../middlewares/utils";
import { runChecks } from "../../middlewares/security/securityChecks";
import { SessionManager } from "../../logic/Session.logic";
import { UserManager } from "../../logic/User.logic";
import { extractToken } from "./common.controller";
import { getSignatureMessage } from "../../web3/provider";
import { authMiddleware, web3AuthMiddleware } from "../../middlewares/security/auth";
import { Analytics } from "../../models/Analytics.model";
import { User } from "../../models/User.model";
import { AnalyticsManager } from "../../logic/Analytics.logic";
import { DateTime } from "luxon";
import { OrganizationManager } from "../../logic/Organization.logic";
import { Organization } from "../../models/Organization.model";

router.post("/dcl", dcl.express({ expiration: VALID_SIGNATURE_TOLERANCE_INTERVAL_MS }), async (req: Request & dcl.DecentralandSignatureData<Metadata>, res: Response | any) => {
  const { baseParcel, sceneId, player } = req.body,
    clientIp = req.clientIp,
    parcelArr = baseParcel.split(",").map((str: string): number => Number(str));

  if (player) {
    player.lastIp = clientIp;
  }

  await runChecks(req, parcelArr);

  const user = await AnalyticsManager.obtainUserByWallet({
    address: player.userId,
    currency: "ETH",
    ttl: player.hasConnectedWeb3 ? DateTime.now().plus({ hours: 24 }).toUnixInteger() : undefined,
  });

  const session = new Analytics.Session.Config({
    userId: user.sk,
    connectedWallet: user.connectedWallet,
    baseParcel,
    sceneId,
    clientIp,
    sessionStart: DateTime.now().toUnixInteger(),
  });
  await SessionManager.getIpData(session);
  SessionManager.issueSessionToken(session);
  await SessionManager.storePreSession(session);

  return res.status(200).json({
    text: "Successfully authenticated.",
    session,
    user,
  });
});

router.get("/web3", async (req: Request, res: Response) => {
  const address = extractToken(req).toLowerCase(),
    clientIp = req.clientIp;

  if (!address) {
    return res.status(400).json({
      text: "Wait a minute...who ARE you?",
    });
  }

  const user = await UserManager.obtainUserByWallet({
    address,
    currency: "ETH",
  });

  const sessionConfig = {
    userId: user.sk,
    connectedWallet: user.connectedWallet,
    clientIp,
  };

  let existingSession, newSession;
  existingSession = await SessionManager.getVLMSession(sessionConfig);

  if (!existingSession) {
    newSession = new User.Session.Config(sessionConfig);
    await SessionManager.getIpData(newSession);
    SessionManager.issueSessionToken(newSession);
    SessionManager.issueSignatureToken(newSession);
    await SessionManager.storePreSession(newSession);
  }

  const session = existingSession || newSession;

  return res.status(200).json({
    text: `Signature token issued for ${user.connectedWallet}`,
    signatureMessage: getSignatureMessage(user.connectedWallet, clientIp),
    signatureToken: session.signatureToken,
  });
});

router.post("/login", web3AuthMiddleware, async (req: Request, res: Response) => {
  const clientIp = req.clientIp,
    session = req.session;

  await SessionManager.startVLMSession(session);

  const user = await UserManager.obtain(
    new User.Account({
      sk: session.userId,
      connectedWallet: session.connectedWallet,
      clientIp,
    })
  );

  const userOrgs = await OrganizationManager.getUserOrgs(session.userId, Organization.Roles.ORG_OWNER);

  const status = user?.registeredAt && user?.roles?.length ? 200 : 201;
  return res.status(status).json({
    text: "Successfully authenticated.",
    session,
    user,
    userOrgs,
  });
});

router.get("/restore", authMiddleware, async (req: Request, res: Response) => {
  const clientIp = req.clientIp,
    session = req.session;

  const user = await UserManager.obtain(
    new User.Account({
      sk: session.userId,
      connectedWallet: session.connectedWallet,
      clientIp,
    })
  );

  const userOrgs = await OrganizationManager.getUserOrgs(session.userId, Organization.Roles.ORG_OWNER);

  const status = user?.registeredAt && user?.roles?.length ? 200 : 201;
  return res.status(status).json({
    text: "Successfully authenticated.",
    session,
    user,
    userOrgs,
  });
});

export default router;
