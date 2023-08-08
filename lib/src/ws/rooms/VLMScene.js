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
exports.VLMScene = void 0;
const colyseus_1 = require("colyseus");
const axios_1 = __importDefault(require("axios"));
const Session_logic_1 = require("../../logic/Session.logic");
const Analytics_model_1 = require("../../models/Analytics.model");
const User_model_1 = require("../../models/User.model");
const User_logic_1 = require("../../logic/User.logic");
const auth_1 = require("../../middlewares/security/auth");
const VLMScene_events_1 = require("./events/VLMScene.events");
const Analytics_logic_1 = require("../../logic/Analytics.logic");
const VLMSceneState_1 = require("./schema/VLMSceneState");
const schema_1 = require("@colyseus/schema");
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const https_1 = __importDefault(require("https"));
class VLMScene extends colyseus_1.Room {
    onCreate(options) {
        (0, VLMScene_events_1.bindEvents)(this);
        this.setState(new VLMSceneState_1.VLMSceneState());
        this.setSimulationInterval((deltaTime) => this.checkStateOfStreams(), 1000);
    }
    removeDuplicates(arr) {
        // Use a Set to store unique 'sk' values.
        const skSet = new Set();
        const result = new schema_1.ArraySchema();
        for (let obj of arr) {
            // If the 'sk' value is already in the Set, skip this object.
            if (skSet.has(obj.sk)) {
                continue;
            }
            // Add the 'sk' value to the Set and push the object to the result array.
            skSet.add(obj.sk);
            result.push(obj);
        }
        return result;
    }
    checkStateOfStreams() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.streams.length === 0) {
                return;
            }
            else if (this.state.streams.length <= 4 && this.state.skipped >= 2) {
                this.state.batchSize = this.state.streams.length;
                this.state.skipped = 0;
            }
            else if (this.state.streams.length <= 4 && this.state.skipped < 2) {
                this.state.skipped += 1;
                return;
            }
            else if (this.state.streams.length <= 100) {
                // Gradually increase batch size from 1 to 20 as the number of streams goes from 5 to 100
                this.state.batchSize = Math.ceil(((this.state.streams.length - 4) / (100 - 4)) * (20 - 1) + 1);
            }
            else {
                console.warn("There are more than 100 streams. Consider revising the logic.");
                return;
            }
            this.state.streams = this.removeDuplicates(this.state.streams);
            // console.log(`--- Checking Streams ---`);
            // console.log(DateTime.now().toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS));
            // console.log(`Cached Streams: ${this.state.streams.length}`);
            // console.log(`${this.state.streams.map((stream) => `${stream.url} - ${stream.status}`).join("\n ")}`);
            // console.log(`Batch size: ${this.state.batchSize}`);
            // console.log(`------------------------`);
            if (this.state.streamIndex >= this.state.streams.length) {
                this.state.streamIndex = 0;
            }
            const streams = this.state.streams.slice(this.state.streamIndex, this.state.streamIndex + this.state.batchSize);
            for (const stream of streams) {
                const status = yield this.isStreamLive(stream.url);
                // If the status has changed, update it and notify relevant clients
                if (status !== stream.status) {
                    stream.status = status;
                    console.log(`Stream State Changed:`);
                    console.log(`Scene: ${stream.sceneId} | Stream: ${stream.url} | Status: ${status}`);
                    // Send a message to anyone in the room that has a matching sceneId
                    for (const [sessionId, client] of Object.entries(this.clients)) {
                        if (((_a = client.auth) === null || _a === void 0 ? void 0 : _a.session.sceneId) === stream.sceneId) {
                            client.send("scene_video_status", { sk: stream.sk, status });
                        }
                    }
                }
            }
            this.state.streamIndex += this.state.batchSize;
        });
    }
    onAuth(client, sessionConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionToken, sceneId } = sessionConfig;
            try {
                let auth = { session: sessionConfig, user: {} };
                if (sessionConfig.pk == Analytics_model_1.Analytics.Session.Config.pk) {
                    yield (0, auth_1.analyticsAuthMiddleware)(client, { sessionToken, sceneId }, (session) => __awaiter(this, void 0, void 0, function* () {
                        auth.session = session;
                    }));
                }
                else {
                    yield (0, auth_1.userAuthMiddleware)(client, { sessionToken, sceneId }, (session) => __awaiter(this, void 0, void 0, function* () {
                        auth.session = session;
                    }));
                }
                return auth;
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    onJoin(client, sessionConfig, auth) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // connect a VLM scene host
            if (auth.session.pk == Analytics_model_1.Analytics.Session.Config.pk) {
                const response = yield this.connectAnalyticsUser(client, auth.session);
                auth.session = response.session;
                auth.user = response.user;
            }
            // connect a VLM scene host
            if (((_a = auth.session) === null || _a === void 0 ? void 0 : _a.pk) == User_model_1.User.Session.Config.pk && sessionConfig.sceneId) {
                auth.session.sceneId = sessionConfig.sceneId;
                auth.user = yield this.connectHostUser(client, auth.session);
            }
        });
    }
    connectAnalyticsUser(client, sessionConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield Session_logic_1.SessionManager.startAnalyticsSession(sessionConfig);
            const user = yield Analytics_logic_1.AnalyticsManager.getUserById(session.userId);
            console.log(`${user.displayName} joined in ${sessionConfig.world || "world"} - ${client.sessionId}.`);
            return { user, session };
        });
    }
    connectHostUser(client, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_logic_1.UserManager.getById(session.userId);
            client.auth.user = user;
            (0, VLMScene_events_1.handleHostJoined)(client, { session, user }, this);
            return user;
        });
    }
    getHlsContent(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!url) {
                    return;
                }
                const agent = new https_1.default.Agent({
                    rejectUnauthorized: false,
                });
                // console.log("Checking HLS stream: ", url);
                const response = yield axios_1.default.get(url, { httpsAgent: agent });
                // console.log(response);
                if (response.status === 200) {
                    return !!response.data;
                }
                else {
                    ErrorLogging_logic_1.AdminLogManager.logInfo("Received non-200 success status", { url, streams: JSON.stringify(this.state.streams), totalClients: this.clients.length, clients: this.clients, response: JSON.stringify(response) });
                    return false;
                }
            }
            catch (error) {
                console.log(error);
                if (error.response && error.response.status == 403) {
                    this.state.streams = this.state.streams.filter((stream) => stream.url !== url);
                    const clientAuths = this.clients.map((client) => client.auth);
                    try {
                        const log = yield ErrorLogging_logic_1.AdminLogManager.logWarning("Received 403 Forbidden error from HLS stream.", { url, streams: JSON.stringify(this.state.streams), totalClients: this.clients.length, clients: clientAuths, error: JSON.stringify(error) });
                    }
                    catch (error) {
                        return false;
                    }
                }
                else if (error.response && error.response.status === 404) {
                    return false;
                }
                else {
                    return false;
                }
            }
        });
    }
    isStreamLive(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const content = yield this.getHlsContent(url);
                if (content) {
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                return false;
            }
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
