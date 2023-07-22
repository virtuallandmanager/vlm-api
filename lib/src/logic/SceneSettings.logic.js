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
exports.SceneSettingsManager = void 0;
const Generic_data_1 = require("../dal/Generic.data");
const Scene_model_1 = require("../models/Scene.model");
const Scene_data_1 = require("../dal/Scene.data");
const ErrorLogging_logic_1 = require("./ErrorLogging.logic");
class SceneSettingsManager {
}
exports.SceneSettingsManager = SceneSettingsManager;
_a = SceneSettingsManager;
SceneSettingsManager.addSettingsToScene = (scene, sceneSettings) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.addSettingsToScene(scene, sceneSettings);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneSettingsManager.addSettingsToScene" });
        return;
    }
});
SceneSettingsManager.createSceneSetting = (config) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sceneSetting = new Scene_model_1.Scene.Setting(config);
        return (yield Generic_data_1.GenericDbManager.put(sceneSetting));
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneSettingsManager.createSceneSetting" });
        return;
    }
});
SceneSettingsManager.getSceneSettingById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield Generic_data_1.GenericDbManager.get({ pk: Scene_model_1.Scene.Setting.pk, sk }));
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneSettingsManager.getSceneSettingById" });
        return;
    }
});
