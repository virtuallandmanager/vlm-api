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
exports.VLMScene = void 0;
const colyseus_1 = require("colyseus");
const Session_logic_1 = require("../../logic/Session.logic");
const Analytics_model_1 = require("../../models/Analytics.model");
const User_model_1 = require("../../models/User.model");
const User_logic_1 = require("../../logic/User.logic");
const auth_1 = require("../../middlewares/security/auth");
const VLMScene_events_1 = require("./events/VLMScene.events");
const Analytics_logic_1 = require("../../logic/Analytics.logic");
class VLMScene extends colyseus_1.RelayRoom {
    onCreate(options) {
        (0, VLMScene_events_1.bindEvents)(this);
    }
    onJoin(client, sessionConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionToken, sceneId } = sessionConfig;
            return yield (0, auth_1.wsAuthMiddleware)(client, { sessionToken, sceneId }, (session) => __awaiter(this, void 0, void 0, function* () {
                client.auth = { session, user: {} };
                // connect a VLM scene host
                if (session.pk == Analytics_model_1.Analytics.Session.Config.pk) {
                    client.auth.user = yield this.connectAnalyticsUser(client, session);
                }
                // add VLM session and user data to Colyseus client auth object
                // connect a VLM scene host
                if (session.pk == User_model_1.User.Session.Config.pk && sessionConfig.sceneId) {
                    session.sceneId = sessionConfig.sceneId;
                    client.auth.user = yield this.connectHostUser(client, session);
                }
                return client.auth;
            }));
        });
    }
    connectAnalyticsUser(client, session) {
        return __awaiter(this, void 0, void 0, function* () {
            client.auth.session = yield Session_logic_1.SessionManager.startAnalyticsSession(session);
            client.auth.user = yield Analytics_logic_1.AnalyticsManager.getUserById(session.userId);
            console.log("Analytics User Joined: ", client.auth.user.displayName);
            return client.auth.user;
        });
    }
    connectHostUser(client, session) {
        return __awaiter(this, void 0, void 0, function* () {
            client.auth.user = yield User_logic_1.UserManager.getById(session.userId);
            (0, VLMScene_events_1.handleHostJoined)(client, { session }, this);
            return client.auth.user;
        });
    }
    onLeave(client) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, VLMScene_events_1.handleSessionEnd)(client);
            console.log(((_b = (_a = client.auth) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.displayName) || "Unknown User", "left!");
            return;
        });
    }
}
exports.VLMScene = VLMScene;
