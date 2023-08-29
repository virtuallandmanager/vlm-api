import express, { Request, Response } from "express";
const router = express.Router();
import dcl, { express as dclExpress } from "decentraland-crypto-middleware";
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
import { AdminLogManager } from "../../logic/ErrorLogging.logic";

router.get("/web3", async (req: Request, res: Response) => {
  const address = extractToken(req).toLowerCase(),
    clientIp = req.clientIp;
  try {
    if (process.env.NODE_ENV === "production" && req.hostname !== "vlm.gg" && req.hostname !== "www.vlm.gg") {
      console.log(req.hostname);
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
      SessionManager.issueUserSessionToken(newSession);
      SessionManager.issueSignatureToken(newSession);
      await SessionManager.storePreSession(newSession);
    } else {
      await SessionManager.renew(existingSession);
    }

    const session = existingSession || newSession;

    return res.status(200).json({
      text: `Signature token issued for ${user.connectedWallet}`,
      signatureMessage: getSignatureMessage(user.connectedWallet, clientIp),
      signatureToken: session.signatureToken,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Authentication.controller/web3",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/login", web3AuthMiddleware, async (req: Request, res: Response) => {
  const clientIp = req.clientIp,
    session = req.session;

  try {
    if (!session.sessionStart) {
      await SessionManager.startVLMSession(session);
    }

    const user = await UserManager.obtain(
      new User.Account({
        sk: session.userId,
        connectedWallet: session.connectedWallet,
        clientIp,
      })
    );

    const userOrgs = await OrganizationManager.getUserOrgs(session.userId, Organization.Roles.ORG_OWNER);

    const status = (user?.registeredAt && user?.roles?.length) || userOrgs?.length ? 200 : 201;
    return res.status(status).json({
      text: "Successfully authenticated.",
      session,
      user,
      userOrgs,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Authentication.controller/login",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.get("/restore", authMiddleware, async (req: Request, res: Response) => {
  const clientIp = req.clientIp,
    session = req.session;

  try {
    const user = await UserManager.obtain(
      new User.Account({
        sk: session.userId,
        connectedWallet: session.connectedWallet,
        clientIp,
      })
    );

    if (clientIp !== user.lastIp) {
      await UserManager.updateIp(user);
    }

    const userOrgs = await OrganizationManager.getUserOrgs(session.userId, Organization.Roles.ORG_OWNER);

    const status = (user?.registeredAt && user?.roles?.length) || userOrgs?.length ? 200 : 201;
    return res.status(status).json({
      text: "Successfully authenticated.",
      session,
      user,
      userOrgs,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Authentication.controller/restore",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/decentraland", dclExpress({ expiration: VALID_SIGNATURE_TOLERANCE_INTERVAL_MS }), async (req: Request & dcl.DecentralandSignatureData<Metadata>, res: Response | any) => {
  const { baseParcel, sceneId, user, location, subPlatform, environment } = req.body,
    clientIp = req.clientIp,
    parcelArr = baseParcel?.split(",").map((str: string): number => Number(str));
  let serverAuthenticated = false;

  if (user) {
    user.lastIp = clientIp;
  }

  try {
    await runChecks(req, parcelArr);
    serverAuthenticated = true;
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Authentication.controller/decentraland",
    });
    serverAuthenticated = false;
  }

  try {
    const dbUser = await AnalyticsManager.obtainUserByWallet(
      {
        address: user.userId,
        currency: "ETH",
        ttl: user.hasConnectedWeb3 ? DateTime.now().plus({ hours: 24 }).toMillis() : undefined,
      },
      { displayName: user.displayName, hasConnectedWeb3: user.hasConnectedWeb3 }
    );

    const session = new Analytics.Session.Config({
      userId: dbUser.sk,
      connectedWallet: dbUser.connectedWallet,
      location,
      sceneId,
      clientIp,
      device: subPlatform,
      serverAuthenticated,
      sessionStart: Date.now(),
      ttl: environment === "prod" ? undefined : DateTime.now().plus({ hours: 24 }).toMillis(),
    });
    await SessionManager.getIpData(session);
    SessionManager.issueAnalyticsSessionToken(session);
    await SessionManager.storePreSession(session);

    return res.status(200).json({
      text: "Successfully authenticated.",
      session,
      user: dbUser,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Authentication.controller/decentraland",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

export default router;
