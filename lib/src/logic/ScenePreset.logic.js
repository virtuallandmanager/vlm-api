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
exports.ScenePresetManager = void 0;
const Generic_data_1 = require("../dal/Generic.data");
const Scene_model_1 = require("../models/Scene.model");
const Scene_data_1 = require("../dal/Scene.data");
const ErrorLogging_logic_1 = require("./ErrorLogging.logic");
const SceneElement_logic_1 = require("./SceneElement.logic");
class ScenePresetManager {
}
exports.ScenePresetManager = ScenePresetManager;
_a = ScenePresetManager;
// Scene Preset Operations //
ScenePresetManager.createScenePreset = (scenePreset) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Generic_data_1.GenericDbManager.put(scenePreset);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.createScenePreset" });
        return;
    }
});
ScenePresetManager.createInitialPreset = (scene, sk) => __awaiter(void 0, void 0, void 0, function* () {
    const firstPreset = new Scene_model_1.Scene.Preset({ name: "Signature Arrangement", sk });
    scene.scenePreset = firstPreset.sk;
    const addPresetsResponse = yield _a.addPresetsToScene(scene, [firstPreset]);
    scene = addPresetsResponse.scene;
    scene.presets = addPresetsResponse.presets;
    return scene;
});
ScenePresetManager.getScenePreset = (scenePreset) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Generic_data_1.GenericDbManager.get(scenePreset);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.getScenePreset" });
        return;
    }
});
ScenePresetManager.getPresetFragment = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Generic_data_1.GenericDbManager.getFragment({ pk: Scene_model_1.Scene.Preset.pk, sk }, ["sk", "name", "createdAt"]);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.getScenePresetFragments" });
        return;
    }
});
ScenePresetManager.clonePreset = (scene, presetConfig) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newPreset = new Scene_model_1.Scene.Preset(presetConfig, true);
        return yield Scene_data_1.SceneDbManager.addPresetToScene(scene, newPreset);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.clonePresetsToScene" });
        return;
    }
});
ScenePresetManager.addPresetToScene = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const preset = new Scene_model_1.Scene.Preset();
        return yield Scene_data_1.SceneDbManager.addPresetToScene(scene, preset);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.addPresetToScene" });
        return;
    }
});
ScenePresetManager.addPresetsToScene = (scene, scenePresets) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.addPresetsToScene(scene, scenePresets);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.addPresetsToScene" });
        return;
    }
});
ScenePresetManager.updateScenePreset = (scene, preset) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.updatePreset(scene, preset);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.updateScenePreset" });
    }
});
ScenePresetManager.deleteScenePreset = (sceneId, presetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const scene = yield Scene_data_1.SceneDbManager.deletePreset(sceneId, presetId);
        return { scene };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.deleteScenePreset" });
    }
});
ScenePresetManager.getScenePresetById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Generic_data_1.GenericDbManager.get({ pk: Scene_model_1.Scene.Preset.pk, sk });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.getScenePresetById" });
        return;
    }
});
ScenePresetManager.buildScenePreset = (preset) => __awaiter(void 0, void 0, void 0, function* () {
    if (!preset) {
        ErrorLogging_logic_1.AdminLogManager.logError("Tried to build an undefined preset!", { from: "SceneManager.buildScenePreset" });
        return;
    }
    try {
        const [videos, images, nfts, sounds, widgets] = yield Promise.all([
            SceneElement_logic_1.SceneElementManager.buildElements(Scene_model_1.Scene.Video.Config.pk, preset.videos),
            SceneElement_logic_1.SceneElementManager.buildElements(Scene_model_1.Scene.Image.Config.pk, preset.images),
            SceneElement_logic_1.SceneElementManager.buildElements(Scene_model_1.Scene.NFT.Config.pk, preset.nfts),
            SceneElement_logic_1.SceneElementManager.buildElements(Scene_model_1.Scene.Sound.Config.pk, preset.sounds),
            SceneElement_logic_1.SceneElementManager.buildElements(Scene_model_1.Scene.Widget.Config.pk, preset.widgets),
        ]);
        return new Scene_model_1.Scene.Preset(Object.assign(Object.assign({}, preset), { videos, images, nfts, sounds, widgets }));
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ScenePresetManager.buildScenePreset" });
        return;
    }
});
