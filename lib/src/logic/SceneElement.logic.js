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
exports.SceneElementManager = void 0;
const Scene_model_1 = require("../models/Scene.model");
const Scene_data_1 = require("../dal/Scene.data");
const ErrorLogging_logic_1 = require("./ErrorLogging.logic");
const Scene_logic_1 = require("./Scene.logic");
const alchemy_sdk_1 = require("alchemy-sdk");
const Generic_data_1 = require("../dal/Generic.data");
const alchemy = new alchemy_sdk_1.Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: alchemy_sdk_1.Network.ETH_MAINNET, // Replace with your network.
});
const alchemyPoly = new alchemy_sdk_1.Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: alchemy_sdk_1.Network.MATIC_MAINNET, // Replace with your network.
});
class SceneElementManager {
}
exports.SceneElementManager = SceneElementManager;
_a = SceneElementManager;
SceneElementManager.buildElements = (pk, sks) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sceneElements = [];
        if (sks && sks.length) {
            for (let i = 0; i < sks.length; i++) {
                let sceneElement = yield Scene_logic_1.SceneManager.getSceneElementById(pk, sks[i]);
                if (pk == "vlm.scene.nft" && sceneElement.contractAddress && sceneElement.tokenId > -1) {
                    yield alchemy.nft.getNftMetadata(sceneElement.contractAddress, sceneElement.tokenId);
                }
                if (sceneElement.instances && sceneElement.instances.length) {
                    if (typeof sceneElement.instances[0] == "string") {
                        sceneElement.instances = yield _a.buildElementInstances(pk + ":instance", sceneElement.instances);
                    }
                    else if (sceneElement.instances[0].sk) {
                        sceneElement = yield Generic_data_1.GenericDbManager.put(Object.assign(Object.assign({}, sceneElement), { instances: sceneElement.instances.map((instance) => instance.sk) }), true);
                        sceneElement.instances = yield _a.buildElementInstances(pk + ":instance", sceneElement.instances);
                    }
                }
                sceneElements.push(sceneElement);
            }
            return sceneElements;
        }
        else {
            return [];
        }
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.buildElements" });
        return;
    }
});
SceneElementManager.buildElementInstances = (pk, sks, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sceneInstances = [];
        if (sks && sks.length) {
            for (let i = 0; i < sks.length; i++) {
                const sceneInstance = yield Scene_logic_1.SceneManager.getSceneElementById(pk, sks[i]);
                if (options === null || options === void 0 ? void 0 : options.skToId) {
                    sceneInstance.id = sceneInstance.sk;
                }
                sceneInstances.push(sceneInstance);
            }
            return sceneInstances;
        }
        else {
            return [];
        }
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.buildElements" });
        return;
    }
});
SceneElementManager.createSceneElement = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        switch (message.element) {
            case "video":
                return yield _a.addVideoToPreset(message);
            case "image":
                return yield _a.addImageToPreset(message);
            case "nft":
                return yield _a.addNftToPreset(message);
            case "sound":
                return yield _a.addSoundToPreset(message);
            case "widget":
                return yield _a.addWidgetToPreset(message);
        }
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.createSceneElement" });
        return;
    }
});
SceneElementManager.createSceneElementInstance = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        switch (message.element) {
            case "video":
                return yield _a.addInstanceToElement(message);
            case "image":
                return yield _a.addImageToPreset(message);
            case "nft":
                return yield _a.addNftToPreset(message);
            case "sound":
                return yield _a.addSoundToPreset(message);
            case "widget":
                return yield _a.addWidgetToPreset(message);
        }
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.createSceneElementInstance" });
        return;
    }
});
// ADD ELEMENTS //
SceneElementManager.addVideoToPreset = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = new Scene_model_1.Scene.Video.Config(message.elementData);
        return yield Scene_data_1.SceneDbManager.addVideoToPreset(message.scenePreset.sk, video);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.addVideoToPreset" });
        return;
    }
});
SceneElementManager.addImageToPreset = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const image = new Scene_model_1.Scene.Image.Config(message.elementData);
        return yield Scene_data_1.SceneDbManager.addImageToPreset(message.scenePreset.sk, image);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.addVideoToPreset" });
        return;
    }
});
SceneElementManager.addNftToPreset = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const nft = new Scene_model_1.Scene.NFT.Config(message.elementData);
        return yield Scene_data_1.SceneDbManager.addNftToPreset(message.scenePreset.sk, nft);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.addVideoToPreset" });
        return;
    }
});
SceneElementManager.addSoundToPreset = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sound = new Scene_model_1.Scene.Sound.Config(message.elementData);
        return yield Scene_data_1.SceneDbManager.addSoundToPreset(message.scenePreset.sk, sound);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.addSoundToPreset" });
        return;
    }
});
SceneElementManager.addWidgetToPreset = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const widget = new Scene_model_1.Scene.Widget.Config(message.elementData);
        return yield Scene_data_1.SceneDbManager.addWidgetToPreset(message.scenePreset.sk, widget);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.addWidgetToPreset" });
        return;
    }
});
//
SceneElementManager.updateSceneElement = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (message.property) {
            return yield Scene_data_1.SceneDbManager.updateSceneElementProperty(message);
        }
        else {
            message.elementData.pk = message.elementData.pk || `vlm:scene:${message.element}`;
            const elementData = yield Generic_data_1.GenericDbManager.put(message.elementData);
            const scenePreset = yield Scene_data_1.SceneDbManager.getPreset(message.scenePreset.sk);
            return { scenePreset, elementData };
        }
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.updateElement" });
        return;
    }
});
SceneElementManager.removeSceneElement = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.removeSceneElement(message);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.deleteSceneElement" });
        return;
    }
});
SceneElementManager.addInstanceToElement = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        switch (message.element) {
            case "video":
                message.instanceData.pk = Scene_model_1.Scene.Video.Instance.pk;
                break;
            case "image":
                message.instanceData.pk = Scene_model_1.Scene.Image.Instance.pk;
                break;
            case "nft":
                message.instanceData.pk = Scene_model_1.Scene.NFT.Instance.pk;
                break;
            case "sound":
                message.instanceData.pk = Scene_model_1.Scene.Sound.Instance.pk;
                break;
        }
        return yield Scene_data_1.SceneDbManager.addInstanceToElement(message);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.addInstanceToElement" });
        return;
    }
});
SceneElementManager.updateInstance = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.updateInstance(message);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.updateInstance" });
        return;
    }
});
SceneElementManager.removeInstanceFromElement = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Scene_data_1.SceneDbManager.removeInstanceFromElement(message);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "SceneElementManager.removeInstanceFromElement" });
        return;
    }
});
