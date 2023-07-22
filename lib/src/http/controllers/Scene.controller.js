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
const Migration_logic_1 = require("../../logic/Migration.logic");
const Scene_logic_1 = require("../../logic/Scene.logic");
const User_logic_1 = require("../../logic/User.logic");
const auth_1 = require("../../middlewares/security/auth");
const Scene_model_1 = require("../../models/Scene.model");
const User_model_1 = require("../../models/User.model");
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const History_logic_1 = require("../../logic/History.logic");
const router = express_1.default.Router();
router.get("/cards", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.session.userId) {
            return res.status(400).json({
                text: "Bad Request.",
            });
        }
        const user = yield User_logic_1.UserManager.getById(req.session.userId), scenes = yield Scene_logic_1.SceneManager.getScenesForUser(user);
        return res.status(200).json({
            text: "Successfully authenticated.",
            scenes: scenes || [],
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Authentication.controller/cards",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.get("/create", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newScene = new Scene_model_1.Scene.Config(), userAccount = User_logic_1.UserManager.getById(req.session.userId), newSceneLink = new User_model_1.User.SceneLink({ sk: req.session.userId }, newScene), sceneLink = yield Scene_logic_1.SceneManager.createUserLink(newSceneLink), scene = yield Scene_logic_1.SceneManager.buildScene(newScene, req.body.locale);
        History_logic_1.HistoryManager.initHistory(userAccount, newScene);
        return res.status(200).json({
            text: "Successfully authenticated.",
            scene,
            sceneLink,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.controller/create",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.get("/demo", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const scene = yield Scene_logic_1.SceneManager.getSceneById("00000000-0000-0000-0000-000000000000");
        yield Scene_logic_1.SceneManager.buildScene(scene);
        return res.status(200).json({
            text: "Successfully authenticated.",
            scene,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.controller/demo",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.get("/migrate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const { x, y } = req.params;
    try {
        const migrations = [];
        const legacyScenes = yield Scene_logic_1.SceneManager.getLegacyScenes();
        yield legacyScenes.forEach((legacyScene) => __awaiter(void 0, void 0, void 0, function* () {
            const migration = yield Migration_logic_1.MigrationManager.migrateLegacyScene(legacyScene);
            migrations.push(migration);
        }));
        return res.status(200).json({
            text: "Successfully migrated!",
            migrations,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.controller/migrate",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.get("/:sceneId", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sk = req.params.sceneId;
    try {
        const scene = yield Scene_logic_1.SceneManager.getSceneById(sk);
        return res.status(200).json({
            text: "Successfully authenticated.",
            scene,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.controller/:sceneId",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
exports.default = router;
