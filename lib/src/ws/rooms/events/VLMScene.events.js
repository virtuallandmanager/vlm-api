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
exports.handleToggleSoundLocators = exports.handleSceneVideoUpdate = exports.handleSceneDelete = exports.handlePresetUpdate = exports.handleSceneDeletePresetRequest = exports.handleSceneChangePreset = exports.handleSceneClonePresetRequest = exports.handleSceneAddPresetRequest = exports.handleSceneLoadRequest = exports.handleSceneCreate = exports.handlePathEnd = exports.handlePathIdle = exports.handlePathResume = exports.handlePathUpdate = exports.handlePathAddSegments = exports.handlePathStart = exports.handleHostLeft = exports.handleHostJoined = exports.handleSessionEnd = exports.bindEvents = exports.VLMSceneMessage = void 0;
const Session_logic_1 = require("../../../logic/Session.logic");
const Scene_logic_1 = require("../../../logic/Scene.logic");
const Scene_model_1 = require("../../../models/Scene.model");
const Analytics_model_1 = require("../../../models/Analytics.model");
const User_model_1 = require("../../../models/User.model");
const ScenePreset_logic_1 = require("../../../logic/ScenePreset.logic");
const SceneElement_logic_1 = require("../../../logic/SceneElement.logic");
const auth_1 = require("../../../middlewares/security/auth");
const ErrorLogging_logic_1 = require("../../../logic/ErrorLogging.logic");
const VLMSceneState_1 = require("../schema/VLMSceneState");
const History_logic_1 = require("../../../logic/History.logic");
class VLMSceneMessage {
    constructor(message) {
        this.action = message.action;
        this.property = message.property;
        this.id = message.id;
        this.element = message.element;
        this.instance = message.instance;
        this.setting = message.setting;
        this.elementData = message.elementData;
        this.instanceData = message.instanceData;
        this.settingData = message.settingData;
        this.scenePreset = message.scenePreset;
    }
}
exports.VLMSceneMessage = VLMSceneMessage;
function bindEvents(room) {
    const eventHandlers = {
        session_start: handleSessionStart,
        session_action: handleSessionAction,
        session_end: handleSessionEnd,
        host_joined: handleHostJoined,
        host_left: handleHostLeft,
        path_start: handlePathStart,
        path_segments_add: handlePathAddSegments,
        path_end: handlePathEnd,
        scene_create: handleSceneCreate,
        scene_load_request: handleSceneLoadRequest,
        scene_add_preset_request: handleSceneAddPresetRequest,
        scene_change_preset: handleSceneChangePreset,
        scene_clone_preset_request: handleSceneClonePresetRequest,
        scene_delete_preset_request: handleSceneDeletePresetRequest,
        scene_delete: handleSceneDelete,
        scene_preset_update: handlePresetUpdate,
        scene_video_update: handleSceneVideoUpdate,
        scene_sound_locator: handleToggleSoundLocators,
    };
    Object.keys(eventHandlers).forEach((eventType) => {
        room.onMessage(eventType, (client, message) => __awaiter(this, void 0, void 0, function* () {
            if (eventHandlers.hasOwnProperty(eventType)) {
                const handler = eventHandlers[eventType];
                const broadcast = yield handler(client, message, room);
                if (broadcast) {
                    const { sceneId } = client.auth;
                    room.clients.forEach((roomClient) => {
                        if (roomClient.auth.sceneId == sceneId) {
                            roomClient.send(eventType, message);
                        }
                    });
                }
            }
            else {
                // Handle unrecognized message types
            }
        }));
    });
}
exports.bindEvents = bindEvents;
// THE TRUE OR FALSE IN THESE EVENT HANDLERS DETERMINES WHETHER THE MESSAGE GETS BROADCAST TO THE REST OF THE ROOM
// IF FALSE THEN IT IS ONLY ACTED UPON BY THE SERVER
function handleSessionStart(client, sessionConfig, room) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { sessionToken, sceneId } = sessionConfig;
            yield (0, auth_1.analyticsAuthMiddleware)(client, { sessionToken, sceneId }, (session) => __awaiter(this, void 0, void 0, function* () {
                client.auth = { session, user: {} };
                let dbSession = yield Session_logic_1.SessionManager.startAnalyticsSession(Object.assign(Object.assign({}, sessionConfig), { sk: client.auth.sessionId })), worldLocation = session.worldLocation, scene = yield Scene_logic_1.SceneManager.obtainScene(new Scene_model_1.Scene.Config({ sk: sceneId, locations: [worldLocation] })), scenePreset;
                const worldHasBeenAdded = (scene === null || scene === void 0 ? void 0 : scene.locations) && scene.locations.indexOf((location) => location == worldLocation) > -1;
                if (scene && !worldHasBeenAdded) {
                    yield Scene_logic_1.SceneManager.updateSceneProperty({ scene, prop: "locations", val: [...scene.locations, worldLocation] });
                }
                else if (scene && (!scene.locations || scene.locations.length == 0)) {
                    yield Scene_logic_1.SceneManager.updateSceneProperty({ scene, prop: "locations", val: [worldLocation] });
                }
                client.send("session_started", { session: dbSession });
                if (scene === null || scene === void 0 ? void 0 : scene.scenePreset) {
                    scenePreset = yield ScenePreset_logic_1.ScenePresetManager.getScenePresetById(scene.scenePreset);
                    scenePreset = yield ScenePreset_logic_1.ScenePresetManager.buildScenePreset(scenePreset, { skToId: true });
                    for (let i = 0; i < scenePreset.videos.length; i++) {
                        const video = scenePreset.videos[i];
                        const cachedStream = room.state.streams.find((stream) => stream.sk == video.sk);
                        if (cachedStream) {
                            video.isLive = cachedStream.status;
                            continue;
                        }
                        else if (video.liveSrc) {
                            const status = yield room.isStreamLive(video.liveSrc), stream = new VLMSceneState_1.SceneStream({ sk: video.sk, url: video.liveSrc, status, sceneId });
                            room.state.streams.push(stream);
                            video.isLive = status;
                        }
                    }
                    client.send("scene_preset_update", { action: "init", scenePreset });
                }
            }));
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
function handleSessionAction(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { action, metadata, pathPoint, sessionToken } = message, { session } = client.auth, { sceneId } = session;
            yield (0, auth_1.analyticsAuthMiddleware)(client, { sessionToken, sceneId }, () => __awaiter(this, void 0, void 0, function* () {
                const response = yield Session_logic_1.SessionManager.logAnalyticsAction({ action, metadata, pathPoint, sessionId: session.sk });
                if (!response) {
                    ErrorLogging_logic_1.AdminLogManager.logError("Failed to log analytics action", Object.assign(Object.assign({}, message), client.auth));
                }
            }));
            return false;
        }
        catch (error) {
            ErrorLogging_logic_1.AdminLogManager.logError("Failed to log analytics action - UNAUTHENTICATED", Object.assign(Object.assign({}, message), client.auth));
            return false;
        }
    });
}
function handleSessionEnd(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        // Logic for session_end message
        try {
            const session = client.auth.session || message.session;
            if (session.pk == Analytics_model_1.Analytics.Session.Config) {
                yield Session_logic_1.SessionManager.endAnalyticsSession(session);
            }
            else if (session.pk == User_model_1.User.Session.Config.pk) {
                yield Session_logic_1.SessionManager.endVLMSession(session);
            }
            // check for other clients with the same sceneId and remove the scene's videos from the cache if there are none
            const sceneClients = room.clients.filter((c) => c.auth.session.sceneId == session.sceneId && c.auth.user.sk != client.auth.user.sk);
            console.log(`sceneClients remaining for ${session.sceneId} - ${sceneClients}`);
            if (sceneClients.length < 1) {
                room.state.streams = room.state.streams.filter((stream) => stream.sceneId != session.sceneId);
            }
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
exports.handleSessionEnd = handleSessionEnd;
function handleHostJoined(client, message, room) {
    // Logic for host_joined message
    try {
        const { user } = message;
        // Find the client who triggered the message
        const triggeringClient = room.clients.find((c) => c.sessionId === client.sessionId);
        // Iterate over all clients and send the message to each client except the triggering client
        room.clients.forEach((c) => {
            if (c !== triggeringClient) {
                c.send("host_joined");
            }
            History_logic_1.HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "accessed scene in VLM" });
            console.log("Host User Joined: ", user.displayName, user.connectedWallet);
        });
        return false;
    }
    catch (error) {
        return false;
    }
}
exports.handleHostJoined = handleHostJoined;
function handleHostLeft(client, message, room) {
    // Logic for host_left message
    try {
        History_logic_1.HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "left scene in VLM" });
        return false;
    }
    catch (error) {
        return false;
    }
}
exports.handleHostLeft = handleHostLeft;
function handlePathStart(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const path = yield Session_logic_1.SessionManager.createSessionPath(message.session);
            client.send("path_started", { pathId: path.sk });
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
exports.handlePathStart = handlePathStart;
function handlePathAddSegments(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { added, total } = yield Session_logic_1.SessionManager.extendPath(message.pathId, message.pathSegments);
            client.send("path_segments_added", { action: "path_segments_added", pathId: message.pathId, added, total });
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
exports.handlePathAddSegments = handlePathAddSegments;
function handlePathUpdate(client, message, room) {
    // Logic for path_update message
    try {
        return false;
    }
    catch (error) {
        return false;
    }
}
exports.handlePathUpdate = handlePathUpdate;
function handlePathResume(client, message, room) {
    // Logic for path_resume message
    try {
        return false;
    }
    catch (error) {
        return false;
    }
}
exports.handlePathResume = handlePathResume;
function handlePathIdle(client, message, room) {
    // Logic for path_idle message
    try {
        return false;
    }
    catch (error) {
        return false;
    }
}
exports.handlePathIdle = handlePathIdle;
function handlePathEnd(client, message, room) {
    // Logic for path_end message
    try {
        return false;
    }
    catch (error) {
        return false;
    }
}
exports.handlePathEnd = handlePathEnd;
function handleSceneCreate(client, message, room) {
    // Logic for scene_create message
    try {
        return false;
    }
    catch (error) {
        return false;
    }
}
exports.handleSceneCreate = handleSceneCreate;
function handleSceneLoadRequest(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        // Logic for scene_load message
        try {
            let dbScene = yield Scene_logic_1.SceneManager.loadScene(message.sceneId), activePreset;
            if (!dbScene) {
                console.log("Scene not found: ", message.sceneId);
            }
            else {
                activePreset = dbScene.presets.find((preset) => preset.sk === dbScene.scenePreset);
            }
            if (!activePreset) {
                client.send("scene_load_response", Object.assign(Object.assign(Object.assign({}, message.scene), dbScene), { error: "No active preset." }));
                return;
            }
            client.send("scene_load_response", Object.assign(Object.assign({}, message.scene), dbScene));
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
exports.handleSceneLoadRequest = handleSceneLoadRequest;
function handleSceneAddPresetRequest(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        // Logic for scene_add_preset_request message
        try {
            const { user } = client.auth;
            const { scene, preset } = yield ScenePreset_logic_1.ScenePresetManager.addPresetToScene(message.scene);
            History_logic_1.HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "create", element: "scene", property: "preset" }, message.scene);
            client.send("scene_add_preset_response", { user, scene, preset });
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
exports.handleSceneAddPresetRequest = handleSceneAddPresetRequest;
function handleSceneClonePresetRequest(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        // Logic for scene_clone_preset_request message
        try {
            const { user } = client.auth;
            const { scene, preset } = yield ScenePreset_logic_1.ScenePresetManager.clonePreset(message.scene, message.presetId);
            History_logic_1.HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "clone", element: "scene", property: "preset", id: message.presetId }, message.scene);
            client.send("scene_clone_preset_response", { user, scene, preset, presetId: message.presetId });
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
exports.handleSceneClonePresetRequest = handleSceneClonePresetRequest;
function handleSceneChangePreset(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        // Logic for scene_change_preset message
        try {
            const { user } = client.auth;
            const scene = yield Scene_logic_1.SceneManager.changeScenePreset(message), preset = scene.presets.find((scenePreset) => scenePreset.sk == scene.scenePreset);
            History_logic_1.HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "update", element: "scene", property: "preset", from: message.sceneData.scenePreset, to: preset.sk }, scene);
            room.broadcast("scene_change_preset", { user, scene, preset });
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
exports.handleSceneChangePreset = handleSceneChangePreset;
function handleSceneDeletePresetRequest(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        // Logic for scene_delete_preset_request message
        try {
            const { user } = client.auth;
            const scene = yield ScenePreset_logic_1.ScenePresetManager.deleteScenePreset(message.sceneId, message.presetId);
            History_logic_1.HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "deleted", element: "scene", property: "preset", id: message.presetId }, scene);
            client.send("scene_delete_preset_response", { user, scene: scene, presetId: message.presetId });
            return false;
        }
        catch (error) {
            return false;
        }
    });
}
exports.handleSceneDeletePresetRequest = handleSceneDeletePresetRequest;
function handlePresetUpdate(client, message, room) {
    return __awaiter(this, void 0, void 0, function* () {
        // Logic for scene_preset_update message
        try {
            let presetResponse;
            if (message.instance) {
                switch (message.action) {
                    case "create":
                        presetResponse = yield SceneElement_logic_1.SceneElementManager.addInstanceToElement(message);
                        break;
                    case "update":
                        presetResponse = yield SceneElement_logic_1.SceneElementManager.updateInstance(message);
                        break;
                    case "delete":
                        presetResponse = yield SceneElement_logic_1.SceneElementManager.removeInstanceFromElement(message);
                        break;
                }
            }
            else {
                switch (message.action) {
                    case "create":
                        presetResponse = yield SceneElement_logic_1.SceneElementManager.createSceneElement(message);
                        break;
                    case "update":
                        presetResponse = yield SceneElement_logic_1.SceneElementManager.updateSceneElement(message);
                        break;
                    case "delete":
                        presetResponse = yield SceneElement_logic_1.SceneElementManager.removeSceneElement(message);
                        break;
                }
            }
            if (presetResponse) {
                message.scenePreset = yield ScenePreset_logic_1.ScenePresetManager.buildScenePreset(presetResponse.scenePreset);
            }
            if (message.element === "video" && message.elementData.instances.length > 0) {
                room.state.streams = room.state.streams.filter((stream) => { var _a; return stream.sceneId !== ((_a = message.sceneData) === null || _a === void 0 ? void 0 : _a.sk) || message.id; });
                const presetVideos = message.scenePreset.videos;
                presetVideos.forEach((video) => {
                    const stream = new VLMSceneState_1.SceneStream({ sk: video.sk, url: video.liveSrc, status: null, sceneId: client.auth.session.sceneId });
                    room.state.streams.push(stream);
                });
            }
            message.user = (({ displayName, sk }) => ({ displayName, sk }))(client.auth.user);
            message.stage = "post";
            History_logic_1.HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: message.action, element: message.element, property: message.property || "preset", id: message.id });
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    });
}
exports.handlePresetUpdate = handlePresetUpdate;
function handleSceneDelete(client, message, room) {
    // Logic for scene_delete message
    History_logic_1.HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "delete", element: "scene", id: message.id });
    try {
        return false;
    }
    catch (error) {
        return false;
    }
}
exports.handleSceneDelete = handleSceneDelete;
function handleSceneVideoUpdate(client, message, room) {
    // Logic for scene_video_update message
    try {
        if (message.reason == "url_changed") {
            room.state.streams = room.state.streams.filter((stream) => stream.sk !== message.instanceData.sk);
        }
        return false;
    }
    catch (error) {
        return false;
    }
}
exports.handleSceneVideoUpdate = handleSceneVideoUpdate;
function handleToggleSoundLocators(client, message, room) {
    // Logic for scene_video_update message
    try {
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.handleToggleSoundLocators = handleToggleSoundLocators;
