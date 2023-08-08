"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const ip_1 = __importDefault(require("../helpers/ip"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Session_data_1 = require("../dal/Session.data");
const luxon_1 = require("luxon");
const ethers_1 = require("ethers");
const ErrorLogging_logic_1 = require("./ErrorLogging.logic");
const Analytics_model_1 = require("../models/Analytics.model");
const User_model_1 = require("../models/User.model");
const User_logic_1 = require("./User.logic");
class SessionManager {
}
exports.SessionManager = SessionManager;
_a = SessionManager;
SessionManager.initAnalyticsSession = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const session = new Analytics_model_1.Analytics.Session.Config(config);
    yield Session_data_1.SessionDbManager.create(session, { minutes: 10 });
});
SessionManager.startAnalyticsSession = (config) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Session_data_1.SessionDbManager.start(new Analytics_model_1.Analytics.Session.Config(config));
});
SessionManager.getAnalyticsSession = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const session = new Analytics_model_1.Analytics.Session.Config(config);
    yield Session_data_1.SessionDbManager.get(session);
});
SessionManager.endAnalyticsSession = (session) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (session && session.pk && session.sk && !session.sessionEnd) {
            yield Session_data_1.SessionDbManager.end(session);
        }
        else if (session.sessionEnd) {
            ErrorLogging_logic_1.AdminLogManager.logError("Tried to end a session that is already over", session);
        }
        else {
            ErrorLogging_logic_1.AdminLogManager.logError("Session failed to end", session);
        }
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError("Session failed to end", session);
    }
    return;
});
SessionManager.logAnalyticsAction = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const action = new Analytics_model_1.Analytics.Session.Action(config);
    return yield Session_data_1.SessionDbManager.logAnalyticsAction(action);
});
SessionManager.storePreSession = (session) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Session_data_1.SessionDbManager.create(session, { minutes: 10 });
});
SessionManager.startVLMSession = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const session = new User_model_1.User.Session.Config(config);
    const user = yield User_logic_1.UserManager.getById(session.userId);
    const updatedUser = new User_model_1.User.Account(Object.assign(Object.assign({}, user), { lastIp: session.clientIp }));
    yield User_logic_1.UserManager.updateIp(updatedUser);
    yield Session_data_1.SessionDbManager.start(session);
    return session;
});
SessionManager.getVLMSession = (config) => __awaiter(void 0, void 0, void 0, function* () {
    if (config.sk) {
        const session = new User_model_1.User.Session.Config(config);
        return yield Session_data_1.SessionDbManager.get(session);
    }
    else {
        const activeSessions = yield Session_data_1.SessionDbManager.activeVLMSessionsByUserId(config.userId);
        if (!activeSessions.length) {
            return;
        }
        const chosenSession = yield Session_data_1.SessionDbManager.get(activeSessions[0]);
        yield activeSessions.forEach((session, i) => __awaiter(void 0, void 0, void 0, function* () {
            if (i > 0) {
                yield _a.endVLMSession(session);
            }
        }));
        return chosenSession;
    }
});
SessionManager.endVLMSession = (config) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield Session_data_1.SessionDbManager.get(config);
        if (session && !session.sessionEnd) {
            return yield Session_data_1.SessionDbManager.end(session);
        }
        else {
            return;
        }
    }
    catch (error) { }
});
SessionManager.renew = (session) => __awaiter(void 0, void 0, void 0, function* () {
    SessionManager.issueUserSessionToken(session);
    SessionManager.issueSignatureToken(session);
    return yield Session_data_1.SessionDbManager.renew(session);
});
SessionManager.issueUserSessionToken = (session) => {
    session.expires = luxon_1.DateTime.now().plus({ hours: 12 }).toUnixInteger();
    session.sessionToken = jsonwebtoken_1.default.sign({
        pk: session.pk,
        sk: session.sk,
        userId: session.userId,
        iat: Math.floor(Date.now() / 1000) - 30,
        nonce: Date.now(),
    }, process.env.JWT_ACCESS, {
        expiresIn: "6h",
    });
    return session.sessionToken;
};
SessionManager.issueAnalyticsSessionToken = (session) => {
    session.expires = luxon_1.DateTime.now().plus({ hours: 12 }).toUnixInteger();
    session.sessionToken = jsonwebtoken_1.default.sign({
        pk: session.pk,
        sk: session.sk,
        userId: session.userId,
        iat: Math.floor(Date.now() / 1000) - 30,
        nonce: Date.now(),
    }, process.env.JWT_ANALYTICS, {
        expiresIn: "12h",
    });
    return session.sessionToken;
};
SessionManager.issueRefreshToken = (session) => {
    session.expires = luxon_1.DateTime.now().plus({ hours: 12 }).toUnixInteger();
    session.sessionToken = jsonwebtoken_1.default.sign({
        userId: session.userId,
        iat: Math.floor(Date.now() / 1000) - 30,
        nonce: Date.now(),
    }, process.env.JWT_REFRESH, {
        expiresIn: "24h",
    });
    return session.sessionToken;
};
SessionManager.issueSignatureToken = (session) => {
    session.signatureToken = jsonwebtoken_1.default.sign({
        pk: session.pk,
        sk: session.sk,
        userId: session.userId,
        iat: luxon_1.DateTime.now().toUnixInteger(),
        nonce: Date.now(),
    }, process.env.JWT_SIGNATURE, {
        expiresIn: "90s",
    });
    return session.signatureToken;
};
SessionManager.validateUserSessionToken = (sessionToken) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedSession;
    try {
        decodedSession = jsonwebtoken_1.default.verify(sessionToken, process.env.JWT_ACCESS);
    }
    catch (error) {
        return false;
    }
    let dbSession = yield Session_data_1.SessionDbManager.get(decodedSession);
    if (!dbSession) {
        ErrorLogging_logic_1.AdminLogManager.logError("No Session Found", {
            from: "Session Validation Middleware",
            decodedSession,
        });
        return false;
    }
    if (dbSession.sessionToken !== sessionToken) {
        ErrorLogging_logic_1.AdminLogManager.logWarning("Session Token Mismatch", {
            from: "Session Validation Middleware",
            decodedSession,
        });
        return;
    }
    else if (dbSession.sessionEnd >= luxon_1.DateTime.now().toUnixInteger()) {
        ErrorLogging_logic_1.AdminLogManager.logInfo("Session Has Ended", {
            from: "Session Validation Middleware",
            decodedSession,
        });
        return;
    }
    else {
        return dbSession;
    }
});
SessionManager.validateAnalyticsSessionToken = (sessionToken) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedSession;
    try {
        decodedSession = jsonwebtoken_1.default.verify(sessionToken, process.env.JWT_ANALYTICS);
    }
    catch (error) {
        return false;
    }
    let dbSession = yield Session_data_1.SessionDbManager.get(decodedSession);
    if (!dbSession) {
        ErrorLogging_logic_1.AdminLogManager.logError("No Session Found", {
            from: "Session Validation Middleware",
            decodedSession,
        });
        return false;
    }
    if (dbSession.sessionToken !== sessionToken) {
        ErrorLogging_logic_1.AdminLogManager.logWarning("Session Token Mismatch", {
            from: "Session Validation Middleware",
            decodedSession,
        });
        return;
    }
    else if (dbSession.sessionEnd >= luxon_1.DateTime.now().toUnixInteger()) {
        ErrorLogging_logic_1.AdminLogManager.logInfo("Session Has Ended", {
            from: "Session Validation Middleware",
            decodedSession,
        });
        return;
    }
    else {
        return dbSession;
    }
});
SessionManager.validateSignatureToken = (config) => __awaiter(void 0, void 0, void 0, function* () {
    let dbSession, decodedSession, { signatureToken, signature, signatureAccount, signatureMessage } = config;
    try {
        decodedSession = jsonwebtoken_1.default.verify(signatureToken, process.env.JWT_SIGNATURE);
    }
    catch (error) {
        return;
    }
    if (!decodedSession) {
        ErrorLogging_logic_1.AdminLogManager.logError("No Session Decoded", {
            from: "Signature Validation Middleware",
            object: jsonwebtoken_1.default.verify(signatureToken, process.env.JWT_SIGNATURE),
        });
        return;
    }
    dbSession = yield Session_data_1.SessionDbManager.get(decodedSession);
    if (!dbSession) {
        ErrorLogging_logic_1.AdminLogManager.logError("No Session Found", {
            from: "Signature Validation Middleware",
            decodedSession,
        });
        return;
    }
    if (dbSession.sessionEnd > luxon_1.DateTime.now().toUnixInteger()) {
        ErrorLogging_logic_1.AdminLogManager.logError("Session Already Ended.", {
            from: "Signature Validation Middleware",
            decodedSession,
        });
        return;
    }
    const initialAddress = dbSession === null || dbSession === void 0 ? void 0 : dbSession.connectedWallet, // the address that originally requested to connect
    reportedAddress = signatureAccount, // the address that the client says signed the message
    actualAddress = ethers_1.ethers.verifyMessage(
    // who signed the message according to the cryptographic signature
    signatureMessage, signature);
    if (![initialAddress.toLowerCase(), reportedAddress.toLowerCase()].every((address) => address == actualAddress.toLowerCase())) {
        ErrorLogging_logic_1.AdminLogManager.logError("Signature/Session Address Mismatch", {
            from: "Signature Validation Middleware",
            decodedSession,
            dbSession,
            signatureAccount,
        });
        return;
    }
    if (dbSession.signatureToken !== signatureToken) {
        ErrorLogging_logic_1.AdminLogManager.logError("Signature Token Mismatch", {
            from: "Signature Validation Middleware",
            dbSession,
            signatureToken,
        });
        return;
    }
    return dbSession;
});
SessionManager.validateRefreshToken = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = config;
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH);
        if ((decoded === null || decoded === void 0 ? void 0 : decoded.userId) == config.userId) {
            const user = yield User_logic_1.UserManager.getById(decoded.userId);
            return user;
        }
    }
    catch (error) {
        return;
    }
});
SessionManager.getIpData = (session) => __awaiter(void 0, void 0, void 0, function* () {
    session.ipData = yield ip_1.default.addIpData(session.clientIp);
});
SessionManager.createSessionPath = (sessionConfig, sessionPathConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionPath = new Analytics_model_1.Analytics.Path(sessionPathConfig);
    yield Session_data_1.SessionDbManager.createPath(sessionConfig, sessionPath);
    return sessionPath;
});
SessionManager.extendPath = (pathId, pathSegments) => __awaiter(void 0, void 0, void 0, function* () {
    const segments = pathSegments.map((segment) => new Analytics_model_1.Analytics.PathSegment(Object.assign(Object.assign({}, segment), { pathId })));
    return yield Session_data_1.SessionDbManager.addPathSegments(pathId, segments);
});
SessionManager.addPath = (userSessionPath) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Session_data_1.SessionDbManager.createPath(userSessionPath);
});
SessionManager.getSessionPath = (userSessionPath) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Session_data_1.SessionDbManager.getPath(userSessionPath);
});
