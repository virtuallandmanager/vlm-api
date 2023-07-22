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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const decentraland_crypto_middleware_1 = require("decentraland-crypto-middleware");
const utils_1 = require("../../middlewares/utils");
const securityChecks_1 = require("../../middlewares/security/securityChecks");
const Session_logic_1 = require("../../logic/Session.logic");
const User_logic_1 = require("../../logic/User.logic");
const common_controller_1 = require("./common.controller");
const provider_1 = require("../../web3/provider");
const auth_1 = require("../../middlewares/security/auth");
const Analytics_model_1 = require("../../models/Analytics.model");
const User_model_1 = require("../../models/User.model");
const Analytics_logic_1 = require("../../logic/Analytics.logic");
const luxon_1 = require("luxon");
const Organization_logic_1 = require("../../logic/Organization.logic");
const Organization_model_1 = require("../../models/Organization.model");
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
router.get("/web3", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const address = (0, common_controller_1.extractToken)(req).toLowerCase(), clientIp = req.clientIp;
    try {
        if (!address) {
            return res.status(400).json({
                text: "Wait a minute...who ARE you?",
            });
        }
        const user = yield User_logic_1.UserManager.obtainUserByWallet({
            address,
            currency: "ETH",
        });
        const sessionConfig = {
            userId: user.sk,
            connectedWallet: user.connectedWallet,
            clientIp,
        };
        let existingSession, newSession;
        existingSession = yield Session_logic_1.SessionManager.getVLMSession(sessionConfig);
        if (!existingSession) {
            newSession = new User_model_1.User.Session.Config(sessionConfig);
            yield Session_logic_1.SessionManager.getIpData(newSession);
            Session_logic_1.SessionManager.issueSessionToken(newSession);
            Session_logic_1.SessionManager.issueSignatureToken(newSession);
            yield Session_logic_1.SessionManager.storePreSession(newSession);
        }
        else {
            Session_logic_1.SessionManager.renew(existingSession);
        }
        const session = existingSession || newSession;
        return res.status(200).json({
            text: `Signature token issued for ${user.connectedWallet}`,
            signatureMessage: (0, provider_1.getSignatureMessage)(user.connectedWallet, clientIp),
            signatureToken: session.signatureToken,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Authentication.controller/web3",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.post("/login", auth_1.web3AuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const clientIp = req.clientIp, session = req.session;
    try {
        if (!session.sessionStart) {
            yield Session_logic_1.SessionManager.startVLMSession(session);
        }
        const user = yield User_logic_1.UserManager.obtain(new User_model_1.User.Account({
            sk: session.userId,
            connectedWallet: session.connectedWallet,
            clientIp,
        }));
        const userOrgs = yield Organization_logic_1.OrganizationManager.getUserOrgs(session.userId, Organization_model_1.Organization.Roles.ORG_OWNER);
        const status = (user === null || user === void 0 ? void 0 : user.registeredAt) && ((_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.length) ? 200 : 201;
        return res.status(status).json({
            text: "Successfully authenticated.",
            session,
            user,
            userOrgs,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Authentication.controller/login",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.get("/restore", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const clientIp = req.clientIp, session = req.session;
    try {
        const user = yield User_logic_1.UserManager.obtain(new User_model_1.User.Account({
            sk: session.userId,
            connectedWallet: session.connectedWallet,
            clientIp,
        }));
        if (clientIp !== user.lastIp) {
            yield User_logic_1.UserManager.updateIp(user);
        }
        const userOrgs = yield Organization_logic_1.OrganizationManager.getUserOrgs(session.userId, Organization_model_1.Organization.Roles.ORG_OWNER);
        const status = (user === null || user === void 0 ? void 0 : user.registeredAt) && ((_b = user === null || user === void 0 ? void 0 : user.roles) === null || _b === void 0 ? void 0 : _b.length) ? 200 : 201;
        return res.status(status).json({
            text: "Successfully authenticated.",
            session,
            user,
            userOrgs,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Authentication.controller/restore",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.post("/decentraland", (0, decentraland_crypto_middleware_1.express)({ expiration: utils_1.VALID_SIGNATURE_TOLERANCE_INTERVAL_MS }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { baseParcel, sceneId, user, worldLocation, subPlatform } = req.body, clientIp = req.clientIp, parcelArr = baseParcel === null || baseParcel === void 0 ? void 0 : baseParcel.split(",").map((str) => Number(str));
        if (user) {
            user.lastIp = clientIp;
        }
        yield (0, securityChecks_1.runChecks)(req, parcelArr);
        const dbUser = yield Analytics_logic_1.AnalyticsManager.obtainUserByWallet({
            address: user.userId,
            currency: "ETH",
            ttl: user.hasConnectedWeb3 ? luxon_1.DateTime.now().plus({ hours: 24 }).toMillis() : undefined,
        }, { displayName: user.displayName, hasConnectedWeb3: user.hasConnectedWeb3 });
        const session = new Analytics_model_1.Analytics.Session.Config({
            userId: dbUser.sk,
            connectedWallet: dbUser.connectedWallet,
            worldLocation,
            sceneId,
            clientIp,
            device: subPlatform,
            sessionStart: Date.now(),
        });
        yield Session_logic_1.SessionManager.getIpData(session);
        Session_logic_1.SessionManager.issueSessionToken(session);
        yield Session_logic_1.SessionManager.storePreSession(session);
        return res.status(200).json({
            text: "Successfully authenticated.",
            session,
            user: dbUser,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Authentication.controller/decentraland",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
exports.default = router;
