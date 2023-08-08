import ipHelper from "../helpers/ip";
import jwt from "jsonwebtoken";
import { SessionDbManager } from "../dal/Session.data";
import { DateTime } from "luxon";
import { ethers } from "ethers";
import { AdminLogManager } from "./ErrorLogging.logic";
import { Analytics } from "../models/Analytics.model";
import { User } from "../models/User.model";
import { Session as BaseSession } from "../models/Session.model";
import { UserManager } from "./User.logic";

export abstract class SessionManager {
  static initAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    const session = new Analytics.Session.Config(config);
    await SessionDbManager.create(session, { minutes: 10 });
  };

  static startAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    return await SessionDbManager.start(new Analytics.Session.Config(config));
  };

  static getAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    const session = new Analytics.Session.Config(config);
    await SessionDbManager.get(session);
  };

  static endAnalyticsSession: CallableFunction = async (session: Analytics.Session.Config) => {
    try {
      if (session && session.pk && session.sk && !session.sessionEnd) {
        await SessionDbManager.end(session);
      } else if (session.sessionEnd) {
        AdminLogManager.logError("Tried to end a session that is already over", session);
      } else {
        AdminLogManager.logError("Session failed to end", session);
      }
    } catch (error) {
      AdminLogManager.logError("Session failed to end", session);
    }
    return;
  };

  static logAnalyticsAction: CallableFunction = async (config: Analytics.Session.Action) => {
    const action = new Analytics.Session.Action(config);
    return await SessionDbManager.logAnalyticsAction(action);
  };

  static storePreSession: CallableFunction = async (session: Analytics.Session.Config | User.Session.Config) => {
    return await SessionDbManager.create(session, { minutes: 10 });
  };

  static startVLMSession: CallableFunction = async (config: User.Session.Config) => {
    const session = new User.Session.Config(config);
    const user = await UserManager.getById(session.userId);
    const updatedUser = new User.Account({ ...user, lastIp: session.clientIp });
    await UserManager.updateIp(updatedUser);
    await SessionDbManager.start(session);
    return session;
  };

  static getVLMSession: CallableFunction = async (config: User.Session.Config) => {
    if (config.sk) {
      const session = new User.Session.Config(config);
      return await SessionDbManager.get(session);
    } else {
      const activeSessions = await SessionDbManager.activeVLMSessionsByUserId(config.userId);

      if (!activeSessions.length) {
        return;
      }

      const chosenSession = await SessionDbManager.get(activeSessions[0]);
      await activeSessions.forEach(async (session: User.Session.Config, i: number) => {
        if (i > 0) {
          await this.endVLMSession(session);
        }
      });
      return chosenSession;
    }
  };

  static endVLMSession: CallableFunction = async (config: User.Session.Config) => {
    try {
      const session = await SessionDbManager.get(config);
      if (session && !session.sessionEnd) {
        return await SessionDbManager.end(session);
      } else {
        return;
      }
    } catch (error) {}
  };

  static renew: CallableFunction = async (session: User.Session.Config) => {
    SessionManager.issueUserSessionToken(session);
    SessionManager.issueSignatureToken(session);
    return await SessionDbManager.renew(session);
  };

  static issueUserSessionToken: CallableFunction = (session: User.Session.Config) => {
    session.expires = DateTime.now().plus({ hours: 12 }).toUnixInteger();
    session.sessionToken = jwt.sign(
      {
        pk: session.pk,
        sk: session.sk,
        userId: session.userId,
        iat: Math.floor(Date.now() / 1000) - 30,
        nonce: Date.now(),
      },
      process.env.JWT_ACCESS,
      {
        expiresIn: "6h",
      }
    );
    return session.sessionToken;
  };

  static issueAnalyticsSessionToken: CallableFunction = (session: Analytics.Session.Config) => {
    session.expires = DateTime.now().plus({ hours: 12 }).toUnixInteger();
    session.sessionToken = jwt.sign(
      {
        pk: session.pk,
        sk: session.sk,
        userId: session.userId,
        iat: Math.floor(Date.now() / 1000) - 30,
        nonce: Date.now(),
      },
      process.env.JWT_ANALYTICS,
      {
        expiresIn: "12h",
      }
    );
    return session.sessionToken;
  };

  static issueRefreshToken: CallableFunction = (session: User.Session.Config | Analytics.Session.Config) => {
    session.expires = DateTime.now().plus({ hours: 12 }).toUnixInteger();
    session.sessionToken = jwt.sign(
      {
        userId: session.userId,
        iat: Math.floor(Date.now() / 1000) - 30,
        nonce: Date.now(),
      },
      process.env.JWT_REFRESH,
      {
        expiresIn: "24h",
      }
    );
    return session.sessionToken;
  };

  static issueSignatureToken: CallableFunction = (session: Analytics.Session.Config | User.Session.Config) => {
    session.signatureToken = jwt.sign(
      {
        pk: session.pk,
        sk: session.sk,
        userId: session.userId,
        iat: DateTime.now().toUnixInteger(),
        nonce: Date.now(),
      },
      process.env.JWT_SIGNATURE,
      {
        expiresIn: "90s",
      }
    );
    return session.signatureToken;
  };

  static validateUserSessionToken: CallableFunction = async (sessionToken: string) => {
    let decodedSession;
    try {
      decodedSession = jwt.verify(sessionToken, process.env.JWT_ACCESS);
    } catch (error) {
      return false;
    }

    let dbSession = await SessionDbManager.get(decodedSession);

    if (!dbSession) {
      AdminLogManager.logError("No Session Found", {
        from: "Session Validation Middleware",
        decodedSession,
      });
      return false;
    }

    if (dbSession.sessionToken !== sessionToken) {
      AdminLogManager.logWarning("Session Token Mismatch", {
        from: "Session Validation Middleware",
        decodedSession,
      });
      return;
    } else if (dbSession.sessionEnd >= DateTime.now().toUnixInteger()) {
      AdminLogManager.logInfo("Session Has Ended", {
        from: "Session Validation Middleware",
        decodedSession,
      });
      return;
    } else {
      return dbSession;
    }
  };

  static validateAnalyticsSessionToken: CallableFunction = async (sessionToken: string) => {
    let decodedSession;
    try {
      decodedSession = jwt.verify(sessionToken, process.env.JWT_ANALYTICS);
    } catch (error) {
      return false;
    }

    let dbSession = await SessionDbManager.get(decodedSession);

    if (!dbSession) {
      AdminLogManager.logError("No Session Found", {
        from: "Session Validation Middleware",
        decodedSession,
      });
      return false;
    }

    if (dbSession.sessionToken !== sessionToken) {
      AdminLogManager.logWarning("Session Token Mismatch", {
        from: "Session Validation Middleware",
        decodedSession,
      });
      return;
    } else if (dbSession.sessionEnd >= DateTime.now().toUnixInteger()) {
      AdminLogManager.logInfo("Session Has Ended", {
        from: "Session Validation Middleware",
        decodedSession,
      });
      return;
    } else {
      return dbSession;
    }
  };

  static validateSignatureToken: CallableFunction = async (config: { signatureToken: string; signature: string; signatureAccount: string; signatureMessage: string }) => {
    let dbSession,
      decodedSession,
      { signatureToken, signature, signatureAccount, signatureMessage } = config;
    try {
      decodedSession = jwt.verify(signatureToken, process.env.JWT_SIGNATURE);
    } catch (error) {
      return;
    }

    if (!decodedSession) {
      AdminLogManager.logError("No Session Decoded", {
        from: "Signature Validation Middleware",
        object: jwt.verify(signatureToken, process.env.JWT_SIGNATURE) as String,
      });
      return;
    }

    dbSession = await SessionDbManager.get(decodedSession);
    if (!dbSession) {
      AdminLogManager.logError("No Session Found", {
        from: "Signature Validation Middleware",
        decodedSession,
      });
      return;
    }

    if (dbSession.sessionEnd > DateTime.now().toUnixInteger()) {
      AdminLogManager.logError("Session Already Ended.", {
        from: "Signature Validation Middleware",
        decodedSession,
      });
      return;
    }

    const initialAddress = dbSession?.connectedWallet, // the address that originally requested to connect
      reportedAddress = signatureAccount, // the address that the client says signed the message
      actualAddress = ethers.verifyMessage(
        // who signed the message according to the cryptographic signature
        signatureMessage,
        signature
      );

    if (![initialAddress.toLowerCase(), reportedAddress.toLowerCase()].every((address) => address == actualAddress.toLowerCase())) {
      AdminLogManager.logError("Signature/Session Address Mismatch", {
        from: "Signature Validation Middleware",
        decodedSession,
        dbSession,
        signatureAccount,
      });
      return;
    }

    if (dbSession.signatureToken !== signatureToken) {
      AdminLogManager.logError("Signature Token Mismatch", {
        from: "Signature Validation Middleware",
        dbSession,
        signatureToken,
      });
      return;
    }

    return dbSession;
  };

  static validateRefreshToken: CallableFunction = async (config: { refreshToken: string; userId: string }) => {
    const { refreshToken } = config;
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH) as BaseSession.Config;
      if (decoded?.userId == config.userId) {
        const user = await UserManager.getById(decoded.userId);
        return user;
      }
    } catch (error) {
      return;
    }
  };

  static getIpData: CallableFunction = async (session: BaseSession.Config) => {
    session.ipData = await ipHelper.addIpData(session.clientIp);
  };

  static createSessionPath: CallableFunction = async (sessionConfig: Analytics.Session.Config, sessionPathConfig?: Analytics.Path) => {
    const sessionPath = new Analytics.Path(sessionPathConfig);
    await SessionDbManager.createPath(sessionConfig, sessionPath);
    return sessionPath;
  };

  static extendPath: CallableFunction = async (pathId: string, pathSegments: Analytics.PathSegment[]) => {
    const segments = pathSegments.map((segment: Analytics.PathSegment) => new Analytics.PathSegment({ ...segment, pathId }));
    return await SessionDbManager.addPathSegments(pathId, segments);
  };

  static addPath: CallableFunction = async (userSessionPath: Analytics.Path) => {
    return await SessionDbManager.createPath(userSessionPath);
  };

  static getSessionPath: CallableFunction = async (userSessionPath?: Analytics.Path) => {
    return await SessionDbManager.getPath(userSessionPath);
  };
}
