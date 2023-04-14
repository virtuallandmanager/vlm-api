import ipHelper from "../helpers/ip";
import jwt from "jsonwebtoken";
import { SessionDbManager } from "../dal/Session.data";
import { DateTime } from "luxon";
import { ethers } from "ethers";
import { AdminLogManager } from "./ErrorLogging.logic";
import { Analytics } from "../models/Analytics.model";
import { User } from "../models/User.model";
import { Session as BaseSession } from "../models/Session.model";

export abstract class SessionManager {
  static initAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    const session = new Analytics.Session.Config(config);
    await SessionDbManager.create(session, { minutes: 10 });
  };

  static startAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    const session = new Analytics.Session.Config(config);
    return await SessionDbManager.start(session);
  };

  static getAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    const session = new Analytics.Session.Config(config);
    await SessionDbManager.get(session);
  };

  static endAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    const dbSession = await SessionDbManager.get(config);
    if (dbSession) {
      dbSession.end();
      await SessionDbManager.end(dbSession);
    }
  };

  static storePreSession: CallableFunction = async (session: Analytics.Session.Config | User.Session.Config) => {
    return await SessionDbManager.create(session, { minutes: 10 });
  };

  static startVLMSession: CallableFunction = async (config: User.Session.Config) => {
    const session = new User.Session.Config(config);
    await SessionDbManager.start(session);
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
    const dbSession = await SessionDbManager.get(config),
      session = dbSession && new User.Session.Config(dbSession);
    if (session) {
      session.end();
      await SessionDbManager.end(session);
    }
  };

  static renew: CallableFunction = async (session: BaseSession.Config) => {
    SessionManager.issueSessionToken(session);
    SessionManager.issueSignatureToken(session);
    await SessionDbManager.renew(session);
  };

  static issueSessionToken: CallableFunction = (session: BaseSession.Config) => {
    session.expires = DateTime.now().plus({ hours: 12 }).toUnixInteger();
    session.sessionToken = jwt.sign(
      {
        ...session,
        iat: Math.floor(Date.now() / 1000) - 30,
        nonce: Date.now(),
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "12h",
      }
    );
    return session.sessionToken;
  };

  static issueSignatureToken: CallableFunction = (session: BaseSession.Config) => {
    session.signatureToken = jwt.sign(
      {
        pk: session.pk,
        sk: session.sk,
        iat: Math.floor(Date.now() / 1000),
        nonce: Date.now(),
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "1h",
      }
    );
    return session.signatureToken;
  };

  static validateSessionToken: CallableFunction = async (sessionToken: string) => {
    let decodedSession;
    try {
      decodedSession = jwt.verify(sessionToken, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      console.log(error);
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
      AdminLogManager.logError("Session Token Mismatch", {
        from: "Session Validation Middleware",
        decodedSession,
      });
      return;
    } else if (dbSession.sessionEnd >= DateTime.now().toUnixInteger()) {
      AdminLogManager.logError("Session Has Ended", {
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
      decodedSession = jwt.verify(signatureToken, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      console.log(error);
      return;
    }

    if (!decodedSession) {
      AdminLogManager.logError("No Session Decoded", {
        from: "Signature Validation Middleware",
        object: jwt.verify(signatureToken, process.env.JWT_ACCESS_SECRET) as String,
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

  static getIpData: CallableFunction = async (session: BaseSession.Config) => {
    session.ipData = await ipHelper.addIpData(session.clientIp);
  };

  static createSessionPath: CallableFunction = async (sessionConfig: Analytics.Session.Config, sessionPathConfig?: Analytics.Session.Path) => {
    const sessionPath = new Analytics.Session.Path(sessionPathConfig);
    await SessionDbManager.createPath(sessionConfig, sessionPath);
    return sessionPath;
  };

  static extendSessionPath: CallableFunction = async (pathId: string, path: Analytics.Session.PathPoint[]) => {
    const dbPath = await SessionDbManager.getPathById(pathId),
      newPathPoints = !path
        ? []
        : path.filter((pathPoint: Analytics.Session.PathPoint) => {
            return pathPoint[0] > dbPath[dbPath.length - 1][0];
          });
    const userSessionPath = new Analytics.Session.Path({
      sk: pathId,
      path: newPathPoints,
    });
    return await SessionDbManager.extendPath(userSessionPath);
  };

  static addSessionPath: CallableFunction = async (userSessionPath: Analytics.Session.Path) => {
    return await SessionDbManager.createPath(userSessionPath);
  };

  static getSessionPath: CallableFunction = async (userSessionPath?: Analytics.Session.Path) => {
    return await SessionDbManager.getPath(userSessionPath);
  };
}
