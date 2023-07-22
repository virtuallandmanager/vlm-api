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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneManager = void 0;
const Generic_data_1 = require("../dal/Generic.data");
const Scene_model_1 = require("../models/Scene.model");
const Scene_data_1 = require("../dal/Scene.data");
const ErrorLogging_logic_1 = require("./ErrorLogging.logic");
const SceneSettings_logic_1 = require("./SceneSettings.logic");
const ScenePreset_logic_1 = require("./ScenePreset.logic");
class SceneManager {
}
exports.SceneManager = SceneManager;
_a = SceneManager;
// Base Scene Operations //
SceneManager.loadScene = (sceneId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let scene = yield Scene_data_1.SceneDbManager.getById(sceneId);
        if (scene) {
            scene = yield _a.buildScene(scene);
        }
        else {
            scene = yield _a.createScene(new Scene_model_1.Scene.Config({ sk: sceneId }));
            scene = yield _a.buildScene(scene);
        }
        return scene;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.loadScene" });
    }
});
SceneManager.obtainScene = (sceneConfig) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let scene = yield Scene_data_1.SceneDbManager.get(sceneConfig);
        if (!scene) {
            scene = yield Scene_data_1.SceneDbManager.put(new Scene_model_1.Scene.Config(sceneConfig));
            scene = yield Scene_data_1.SceneDbManager.addPresetToScene(scene, new Scene_model_1.Scene.Preset({ name: "Signature Arrangement" }));
        }
        return scene;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.createScene" });
    }
});
SceneManager.createScene = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.put(scene);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.createScene" });
    }
});
SceneManager.getScene = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.get(scene);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.getScene" });
    }
});
SceneManager.getSceneById = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.getById(scene);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.getSceneById" });
    }
});
SceneManager.getScenesForUser = (vlmUser) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sceneIds = yield Scene_data_1.SceneDbManager.getIdsForUser(vlmUser);
        return yield Scene_data_1.SceneDbManager.getByIds(sceneIds);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.getScenesForUser" });
    }
});
SceneManager.getIdsForUser = (vlmUser) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.getIdsForUser(vlmUser.sk);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.getIdsForUser" });
    }
});
SceneManager.updateSceneProperty = ({ scene, prop, val }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.updateSceneProperty(scene, prop, val);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.updateSceneProperty" });
        return;
    }
});
SceneManager.changeScenePreset = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let scene = yield _a.updateSceneProperty({ scene: message.sceneData, prop: "scenePreset", val: message.id });
        scene = yield _a.buildScene(scene);
        return scene;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.changeScenePreset" });
    }
});
////
SceneManager.buildScene = (sceneConfig, locale) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let presetsLoaded = false;
        let scene = new Scene_model_1.Scene.Config(sceneConfig);
        if (!sceneConfig) {
            yield SceneManager.createScene(scene);
        }
        // create the first preset if one doesn't exist in this scene
        if (!scene.presets || !scene.presets.length) {
            scene = yield ScenePreset_logic_1.ScenePresetManager.createInitialPreset(scene);
            presetsLoaded = true;
        }
        if (!presetsLoaded) {
            yield SceneManager.fillInPresetIds(scene);
        }
        yield SceneManager.fillInSettingIds(scene);
        return scene;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.buildScene" });
        return;
    }
});
SceneManager.fillInPresetIds = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    const presetArr = scene.presets || [], presetIds = [];
    // start looping through the preset array, convert preset ids to preset records
    for (let i = 0; i < presetArr.length; i++) {
        if (typeof presetArr[i] !== "string") {
            continue;
        }
        const sk = presetArr[i];
        presetIds.push(sk);
        let scenePreset = yield ScenePreset_logic_1.ScenePresetManager.getScenePresetById(sk);
        if (!scenePreset) {
            scenePreset = yield ScenePreset_logic_1.ScenePresetManager.createScenePreset(new Scene_model_1.Scene.Preset({ name: `Signature Arrangement`, sk }));
        }
        if (!scene.scenePreset && i == 0) {
            const newPreset = yield ScenePreset_logic_1.ScenePresetManager.buildScenePreset(scenePreset);
            const changeResult = yield SceneManager.changeScenePreset(scene, newPreset.sk);
            scene = changeResult.scene;
            scene.presets[i] = changeResult.preset;
        }
        else {
            scene.presets[i] = yield ScenePreset_logic_1.ScenePresetManager.buildScenePreset(scenePreset);
        }
    }
    // loop ends
});
SceneManager.fillInSettingIds = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    const settingArr = scene.settings || [], settingIds = [], missingSettingIds = [];
    for (let i = 0; i < settingArr.length; i++) {
        const sk = scene.settings[i], sceneSetting = yield SceneSettings_logic_1.SceneSettingsManager.getSceneSettingById(sk);
        if (sceneSetting && sceneSetting.settingName) {
            settingIds.push(sk);
        }
        else {
            missingSettingIds.push(sk);
        }
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////
    // i forget why i thought this would ever be necessary... keep it and log exceptions I guess?
    if (missingSettingIds.length) {
        ErrorLogging_logic_1.AdminLogManager.logWarning("Had to fill in missing scene settings", { scene });
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////
    // add the default scene settings if there are no settings for this scene
    if (!(settingArr === null || settingArr === void 0 ? void 0 : settingArr.length) || missingSettingIds.length) {
        const defaultSettings = new Scene_model_1.Scene.DefaultSettings(scene);
        yield SceneManager.updateSceneProperty({ scene, prop: "settings", val: [] });
        yield SceneSettings_logic_1.SceneSettingsManager.addSettingsToScene(scene, defaultSettings.settings);
        scene.settings = defaultSettings.settings;
    }
});
//
// Legacy Scene Operations //
SceneManager.getLegacyScene = (baseParcel) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.getLegacy(baseParcel);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.getLegacyScene" });
        return;
    }
});
SceneManager.getLegacyScenes = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.getAllLegacy();
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.getLegacyScenes" });
        return;
    }
});
////
// Generic Scene Element Operations //
SceneManager.getSceneElementById = (pk, sk) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Generic_data_1.GenericDbManager.get({ pk, sk });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.getSceneElementById" });
        return;
    }
});
////
// Many-to-Many Link Creation Shortcuts //
SceneManager.createUserLink = (sceneLink) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield Generic_data_1.GenericDbManager.put(sceneLink));
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneManager.createUserLink" });
        return;
    }
});
