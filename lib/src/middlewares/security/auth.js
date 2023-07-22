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
Object.defineProperty(exports, "__esModule", { value: true });
exports.alchemyWebhook = exports.wsAuthMiddleware = exports.vlmAdminMiddleware = exports.web3AuthMiddleware = exports.authMiddleware = void 0;
const common_controller_1 = require("../../http/controllers/common.controller");
const Session_logic_1 = require("../../logic/Session.logic");
const User_logic_1 = require("../../logic/User.logic");
const User_model_1 = require("../../models/User.model");
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const Analytics_model_1 = require("../../models/Analytics.model");
function authMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionToken = (0, common_controller_1.extractToken)(req);
        // If the token is not present, return an error response
        if (!sessionToken) {
            return res.status(401).json({ error: "Unauthorized: No session token was provided." });
        }
        // Verify the token
        try {
            const session = yield Session_logic_1.SessionManager.validateSessionToken(sessionToken);
            if (!session) {
                return res.status(401).json({ error: "Unauthorized: Session token was invalid or expired." });
            }
            else {
                req.session = session;
                next();
            }
        }
        catch (error) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
    });
}
exports.authMiddleware = authMiddleware;
function web3AuthMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const signatureToken = (0, common_controller_1.extractToken)(req), { signatureAccount, signatureMessage, signature } = req.body;
        // If the token is not present, return an error response
        if (!signatureToken) {
            return res.status(401).json({ error: "Unauthorized: No signature token was provided." });
        }
        // Verify the token
        try {
            const session = yield Session_logic_1.SessionManager.validateSignatureToken({
                signatureToken,
                signature,
                signatureMessage,
                signatureAccount,
            });
            if (!session) {
                return res.status(401).json({
                    error: "Unauthorized: Web3 signature was invalid or timed out.",
                });
            }
            else {
                req.session = session;
                next();
            }
        }
        catch (error) {
            return res.status(401).json({ error: "Unauthorized: Invalid signature token" });
        }
    });
}
exports.web3AuthMiddleware = web3AuthMiddleware;
function vlmAdminMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.session.userId;
            const user = yield User_logic_1.UserManager.getById(userId);
            if (User_logic_1.UserManager.getAdminLevel(user) <= User_model_1.User.Roles.VLM_ADMIN) {
                return res.status(401).json({
                    error: "Unauthorized: Insufficient Permissions.",
                });
            }
            next();
        }
        catch (error) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
    });
}
exports.vlmAdminMiddleware = vlmAdminMiddleware;
function wsAuthMiddleware(client, message, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let session;
        const { sessionToken, sceneId } = message;
        // Perform token validation here
        if (sessionToken) {
            // Token is valid, allow access to the next message handling logic
            session = yield Session_logic_1.SessionManager.validateSessionToken(sessionToken);
        }
        if (((_a = client === null || client === void 0 ? void 0 : client.auth) === null || _a === void 0 ? void 0 : _a.sessionToken) && client.auth.sessionToken !== sessionToken) {
            ErrorLogging_logic_1.AdminLogManager.logWarning("Client tokens were mismatched over WebSocket connection", { client, message, session });
            ErrorLogging_logic_1.AdminLogManager.logWarning("Issued a suspicious session", { client, message, session });
            client.send("authentication_error", { message: "Invalid token" });
            const newBotSession = new Analytics_model_1.Analytics.Session.BotConfig({ sessionToken, sceneId });
            yield Session_logic_1.SessionManager.initAnalyticsSession(newBotSession);
            yield Session_logic_1.SessionManager.startAnalyticsSession(newBotSession);
            session = newBotSession;
        }
        if (session) {
            next(session);
            return;
        }
        next();
    });
}
exports.wsAuthMiddleware = wsAuthMiddleware;
function alchemyWebhook(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        next();
    });
}
exports.alchemyWebhook = alchemyWebhook;
