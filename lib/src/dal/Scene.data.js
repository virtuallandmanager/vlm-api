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
exports.SceneDbManager = void 0;
const User_model_1 = require("../models/User.model");
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const data_1 = require("../helpers/data");
const Scene_model_1 = require("../models/Scene.model");
const luxon_1 = require("luxon");
const Generic_data_1 = require("./Generic.data");
class SceneDbManager {
}
exports.SceneDbManager = SceneDbManager;
_a = SceneDbManager;
SceneDbManager.get = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Scene_model_1.Scene.Config.pk,
            sk: scene.sk,
        },
    };
    try {
        const sceneRecord = yield common_data_1.docClient.get(params).promise();
        return sceneRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/get",
            scene,
        });
        return;
    }
});
SceneDbManager.getPreset = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Scene_model_1.Scene.Preset.pk,
            sk,
        },
    };
    try {
        const sceneRecord = yield common_data_1.docClient.get(params).promise();
        return sceneRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/getPreset",
            sk,
        });
        return;
    }
});
SceneDbManager.getSetting = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Scene_model_1.Scene.Setting.pk,
            sk,
        },
    };
    try {
        const sceneRecord = yield common_data_1.docClient.get(params).promise();
        return sceneRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/getSetting",
            sk,
        });
        return;
    }
});
SceneDbManager.getById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Scene_model_1.Scene.Config.pk,
            sk,
        },
    };
    try {
        const sceneRecord = yield common_data_1.docClient.get(params).promise();
        return sceneRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/getById",
            sk,
        });
        return;
    }
});
SceneDbManager.getLegacy = (baseParcel) => __awaiter(void 0, void 0, void 0, function* () {
    var params = {
        TableName: common_data_1.vlmLandLegacyTable,
        IndexName: "vlm_land_baseParcel",
        KeyConditionExpression: "#baseParcel = :baseParcel",
        ExpressionAttributeNames: {
            "#baseParcel": "baseParcel",
        },
        ExpressionAttributeValues: {
            ":baseParcel": baseParcel,
        },
    };
    const data = yield common_data_1.docClient.query(params).promise();
    const scene = data.Items.find((parcel) => {
        return `${parcel.x},${parcel.y}` == baseParcel;
    });
    return scene;
});
SceneDbManager.getAllLegacy = () => __awaiter(void 0, void 0, void 0, function* () {
    var params = {
        TableName: common_data_1.vlmLandLegacyTable,
    };
    const data = yield common_data_1.docClient.scan(params).promise();
    const scenes = data.Items.filter((parcel) => {
        return parcel.baseParcel && parcel.propertyName;
    });
    return scenes;
});
SceneDbManager.getIdsForUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = {
            TableName: common_data_1.vlmMainTable,
            IndexName: "userId-index",
            ExpressionAttributeNames: {
                "#pk": "pk",
                "#userId": "userId",
            },
            ExpressionAttributeValues: {
                ":pk": User_model_1.User.SceneLink.pk,
                ":userId": user.sk,
            },
            KeyConditionExpression: "#pk = :pk and #userId = :userId",
        };
        const sceneLinks = yield (0, data_1.largeQuery)(params), sceneLinkIds = sceneLinks.map((sceneLink) => sceneLink.sk), ids = yield SceneDbManager.getSceneIdsFromLinkIds(sceneLinkIds);
        return ids;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/getIdsByUser",
            user,
        });
        return;
    }
});
SceneDbManager.getSceneIdsFromLinkIds = (sks) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(sks === null || sks === void 0 ? void 0 : sks.length)) {
            return;
        }
        const params = {
            TransactItems: [],
        };
        sks.forEach((sk) => {
            params.TransactItems.push({
                Get: {
                    // Add a connection from organization to user
                    Key: {
                        pk: User_model_1.User.SceneLink.pk,
                        sk,
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            });
        });
        const response = yield common_data_1.docClient.transactGet(params).promise(), sceneLinks = response.Responses.map((item) => item.Item), sceneIds = sceneLinks.map((sceneLink) => sceneLink.sceneId);
        return sceneIds;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/getSceneLinksFromIds",
            sks,
        });
        return;
    }
});
SceneDbManager.getByIds = (sks) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(sks === null || sks === void 0 ? void 0 : sks.length)) {
        return;
    }
    const params = {
        TransactItems: [],
    };
    sks.forEach((sk) => {
        params.TransactItems.push({
            Get: {
                // Add a connection from organization to user
                Key: {
                    pk: Scene_model_1.Scene.Config.pk,
                    sk,
                },
                TableName: common_data_1.vlmMainTable,
            },
        });
    });
    try {
        const response = yield common_data_1.docClient.transactGet(params).promise(), scenes = response.Responses.map((item) => item.Item);
        return (scenes === null || scenes === void 0 ? void 0 : scenes.length) ? scenes : [];
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/getSceneLinksFromIds",
            sks,
        });
        return;
    }
});
SceneDbManager.initScene = (scene, preset, sceneLink) => __awaiter(void 0, void 0, void 0, function* () {
    const ts = Date.now();
    const params = {
        TransactItems: [
            {
                Put: {
                    // Add a scene
                    Item: Object.assign(Object.assign({}, scene), { ts }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    // Add preset for scene
                    Item: Object.assign(Object.assign({}, preset), { ts }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    // Add preset for scene
                    Item: Object.assign(Object.assign({}, sceneLink), { ts }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        return scene;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/initScene",
        });
        return;
    }
});
SceneDbManager.addPresetToScene = (sceneConfig, scenePreset) => __awaiter(void 0, void 0, void 0, function* () {
    const sk = scenePreset.sk;
    const params = {
        TransactItems: [
            {
                Update: {
                    // Add preset id to scene presets array
                    Key: {
                        pk: Scene_model_1.Scene.Config.pk,
                        sk: sceneConfig.sk,
                    },
                    UpdateExpression: "SET #presets = list_append(if_not_exists(#presets, :empty_list), :presetIds)",
                    ExpressionAttributeNames: {
                        "#presets": "presets",
                    },
                    ExpressionAttributeValues: {
                        ":presetIds": [sk],
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    // Create a scene preset
                    Item: Object.assign(Object.assign({}, scenePreset), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const scene = yield _a.get(sceneConfig);
        const preset = yield _a.getPreset(sk);
        return { scene, preset };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/addPresetToScene",
        });
        return;
    }
});
SceneDbManager.addPresetsToScene = (sceneConfig, scenePresets) => __awaiter(void 0, void 0, void 0, function* () {
    const sks = scenePresets.map((preset) => preset.sk).filter((sk) => !sceneConfig.presets.includes(sk));
    const params = {
        TransactItems: [
            {
                Update: {
                    // Add preset id to scene presets array
                    Key: {
                        pk: Scene_model_1.Scene.Config.pk,
                        sk: sceneConfig.sk,
                    },
                    UpdateExpression: "SET #presets = list_append(if_not_exists(#presets, :empty_list), :presetIds)",
                    ExpressionAttributeNames: {
                        "#presets": "presets",
                    },
                    ExpressionAttributeValues: {
                        ":presetIds": sks,
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    // loop through the array of scene presets passed in and add each to the transaction
    scenePresets.forEach((preset) => {
        params.TransactItems.push({
            Put: {
                // Create a scene preset
                Item: Object.assign(Object.assign({}, preset), { ts: Date.now() }),
                TableName: common_data_1.vlmMainTable,
            },
        });
    });
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const scene = yield _a.get(sceneConfig), presets = [];
        for (let i = 0; i < sks.length; i++) {
            const preset = yield _a.getPreset(sks[i]);
            presets.push(preset);
        }
        return { scene, presets };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/addPresetToScene",
        });
        return;
    }
});
SceneDbManager.deletePreset = (sceneId, presetId) => __awaiter(void 0, void 0, void 0, function* () {
    const scene = yield SceneDbManager.getById(sceneId), sks = scene.presets.filter((sk) => sk !== presetId);
    const params = {
        TransactItems: [
            {
                Update: {
                    // Add preset id to scene presets array
                    Key: {
                        pk: Scene_model_1.Scene.Config.pk,
                        sk: sceneId,
                    },
                    UpdateExpression: "SET #presets = :presetIds",
                    ExpressionAttributeNames: {
                        "#presets": "presets",
                    },
                    ExpressionAttributeValues: {
                        ":presetIds": sks,
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Update: {
                    // Add preset id to scene presets array
                    Key: {
                        pk: Scene_model_1.Scene.Preset.pk,
                        sk: presetId,
                    },
                    UpdateExpression: "SET #ttl = :ttl, #deleted = :deleted",
                    ExpressionAttributeNames: {
                        "#ttl": "ttl",
                        "#deleted": "deleted",
                    },
                    ExpressionAttributeValues: {
                        ":ttl": luxon_1.DateTime.now().plus({ days: 90 }).toMillis(),
                        ":deleted": true,
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const scene = yield _a.getById(sceneId);
        return scene;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/deletePreset",
        });
        return;
    }
});
SceneDbManager.addSettingsToScene = (sceneConfig, sceneSettings) => __awaiter(void 0, void 0, void 0, function* () {
    const sks = sceneSettings.map((setting) => setting.sk).filter((sk) => !sceneConfig.settings.includes(sk));
    const params = {
        TransactItems: [
            {
                Update: {
                    // Add scene to user
                    Key: {
                        pk: Scene_model_1.Scene.Config.pk,
                        sk: sceneConfig.sk,
                    },
                    UpdateExpression: "SET #settings = list_append(if_not_exists(#settings, :empty_list), :settingIds)",
                    ExpressionAttributeNames: {
                        "#settings": "settings",
                    },
                    ExpressionAttributeValues: {
                        ":settingIds": sks,
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    sceneSettings.forEach((setting) => {
        params.TransactItems.unshift({
            Put: {
                // Add a scene preset
                Item: Object.assign(Object.assign({}, setting), { ts: Date.now() }),
                TableName: common_data_1.vlmMainTable,
            },
        });
    });
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const scene = yield _a.get(sceneConfig), sceneSettings = [];
        for (let i = 0; i < sks.length; i++) {
            const preset = yield _a.getSetting(sks[i]);
            sceneSettings.push(preset);
        }
        return { scene, sceneSettings };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/addSettingsToScene",
        });
        return;
    }
});
SceneDbManager.addVideoToPreset = (presetId, sceneVideo) => __awaiter(void 0, void 0, void 0, function* () {
    const sk = sceneVideo.sk;
    const params = {
        TransactItems: [
            {
                Update: {
                    Key: {
                        pk: Scene_model_1.Scene.Preset.pk,
                        sk: presetId,
                    },
                    UpdateExpression: "SET #videos = list_append(if_not_exists(#videos, :empty_list), :videoIds)",
                    ExpressionAttributeNames: {
                        "#videos": "videos",
                    },
                    ExpressionAttributeValues: {
                        ":videoIds": [sk],
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    Item: Object.assign(Object.assign({}, sceneVideo), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const elementData = yield Generic_data_1.GenericDbManager.get(sceneVideo);
        const scenePreset = yield _a.getPreset(presetId);
        return { scenePreset, elementData };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/addVideoToPreset",
        });
        return;
    }
});
SceneDbManager.addInstanceToElement = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const elementConfig = message.elementData, instanceConfig = message.instanceData;
    const params = {
        TransactItems: [
            {
                Update: {
                    Key: {
                        pk: elementConfig.pk,
                        sk: elementConfig.sk,
                    },
                    UpdateExpression: "SET #instances = list_append(if_not_exists(#instances, :empty_list), :instanceIds)",
                    ExpressionAttributeNames: {
                        "#instances": "instances",
                    },
                    ExpressionAttributeValues: {
                        ":instanceIds": [instanceConfig.sk],
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    Item: Object.assign(Object.assign({}, instanceConfig), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const scenePreset = yield _a.getPreset(message.scenePreset.sk);
        const elementData = yield Generic_data_1.GenericDbManager.get(elementConfig);
        const instanceData = yield Generic_data_1.GenericDbManager.get(instanceConfig);
        return { scenePreset, elementData, instance: true, instanceData };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/addInstanceToElement",
        });
        return;
    }
});
SceneDbManager.removeInstanceFromElement = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dbElement = yield Generic_data_1.GenericDbManager.get(message.elementData), instanceIds = dbElement.instances, filteredInstanceIds = instanceIds.filter((id) => id !== message.instanceData.sk);
        const params = {
            TransactItems: [
                {
                    Update: {
                        Key: {
                            pk: message.elementData.pk,
                            sk: message.elementData.sk,
                        },
                        ConditionExpression: "#instances = :instanceIds",
                        UpdateExpression: "SET #instances = :newInstanceIds",
                        ExpressionAttributeNames: {
                            "#instances": "instances",
                        },
                        ExpressionAttributeValues: {
                            ":instanceIds": instanceIds,
                            ":newInstanceIds": filteredInstanceIds,
                        },
                        TableName: common_data_1.vlmMainTable,
                    },
                },
                {
                    Update: {
                        Key: {
                            pk: message.instanceData.pk,
                            sk: message.instanceData.sk,
                        },
                        UpdateExpression: "SET #ttl = :ttl, #deleted = :deleted",
                        ExpressionAttributeNames: {
                            "#ttl": "ttl",
                            "#deleted": "deleted",
                        },
                        ExpressionAttributeValues: {
                            ":ttl": luxon_1.DateTime.now().plus({ days: 30 }),
                            ":deleted": true,
                        },
                        TableName: common_data_1.vlmMainTable,
                    },
                },
            ],
        };
        yield common_data_1.docClient.transactWrite(params).promise();
        const elementData = yield Generic_data_1.GenericDbManager.get(dbElement);
        return { elementData };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/removeInstanceFromElement",
        });
        return;
    }
});
SceneDbManager.addImageToPreset = (presetId, sceneImage) => __awaiter(void 0, void 0, void 0, function* () {
    const sk = sceneImage.sk;
    const params = {
        TransactItems: [
            {
                Update: {
                    Key: {
                        pk: Scene_model_1.Scene.Preset.pk,
                        sk: presetId,
                    },
                    UpdateExpression: "SET #images = list_append(if_not_exists(#images, :empty_list), :imageIds)",
                    ExpressionAttributeNames: {
                        "#images": "images",
                    },
                    ExpressionAttributeValues: {
                        ":imageIds": [sk],
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    Item: Object.assign(Object.assign({}, sceneImage), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const elementData = yield Generic_data_1.GenericDbManager.get(sceneImage);
        const scenePreset = yield _a.getPreset(presetId);
        return { scenePreset, elementData };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/addImageToPreset",
        });
        return;
    }
});
SceneDbManager.addNftToPreset = (presetId, sceneNft) => __awaiter(void 0, void 0, void 0, function* () {
    const sk = sceneNft.sk;
    const params = {
        TransactItems: [
            {
                Update: {
                    Key: {
                        pk: Scene_model_1.Scene.Preset.pk,
                        sk: presetId,
                    },
                    UpdateExpression: "SET #nfts = list_append(if_not_exists(#nfts, :empty_list), :nftIds)",
                    ExpressionAttributeNames: {
                        "#nfts": "nfts",
                    },
                    ExpressionAttributeValues: {
                        ":nftIds": [sk],
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    Item: Object.assign(Object.assign({}, sceneNft), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const elementData = yield Generic_data_1.GenericDbManager.get(sceneNft);
        const scenePreset = yield _a.getPreset(presetId);
        return { scenePreset, elementData };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/addNftToPreset",
        });
        return;
    }
});
SceneDbManager.addSoundToPreset = (presetId, sceneSound) => __awaiter(void 0, void 0, void 0, function* () {
    const sk = sceneSound.sk;
    const params = {
        TransactItems: [
            {
                Update: {
                    Key: {
                        pk: Scene_model_1.Scene.Preset.pk,
                        sk: presetId,
                    },
                    UpdateExpression: "SET #sounds = list_append(if_not_exists(#sounds, :empty_list), :soundIds)",
                    ExpressionAttributeNames: {
                        "#sounds": "sounds",
                    },
                    ExpressionAttributeValues: {
                        ":soundIds": [sk],
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    // Create a scene sound
                    Item: Object.assign(Object.assign({}, sceneSound), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const elementData = yield Generic_data_1.GenericDbManager.get(sceneSound);
        const scenePreset = yield _a.getPreset(presetId);
        return { scenePreset, elementData };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/addSoundToPreset",
        });
        return;
    }
});
SceneDbManager.addWidgetToPreset = (presetId, sceneWidget) => __awaiter(void 0, void 0, void 0, function* () {
    const sk = sceneWidget.sk;
    const params = {
        TransactItems: [
            {
                Update: {
                    Key: {
                        pk: Scene_model_1.Scene.Preset.pk,
                        sk: presetId,
                    },
                    UpdateExpression: "SET #widgets = list_append(if_not_exists(#widgets, :empty_list), :widgetIds)",
                    ExpressionAttributeNames: {
                        "#widgets": "widgets",
                    },
                    ExpressionAttributeValues: {
                        ":widgetIds": [sk],
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    // Create a scene preset
                    Item: Object.assign(Object.assign({}, sceneWidget), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const elementData = yield Generic_data_1.GenericDbManager.get(sceneWidget);
        const scenePreset = yield _a.getPreset(presetId);
        return { scenePreset, elementData };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/addWidgetToPreset",
        });
        return;
    }
});
SceneDbManager.updateSceneProperty = (sceneConfig, property, newValue) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: Scene_model_1.Scene.Config.pk, sk: sceneConfig.sk },
        UpdateExpression: "set #prop = :prop, #ts = :ts",
        ConditionExpression: "#ts <= :sceneTs",
        ExpressionAttributeNames: { "#prop": property, "#ts": "ts" },
        ExpressionAttributeValues: {
            ":prop": newValue,
            ":sceneTs": sceneConfig.ts,
            ":ts": Date.now(),
        },
    };
    try {
        yield common_data_1.daxClient.update(params).promise();
        return yield _a.get(sceneConfig);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/updateElementProperty",
            sceneConfig,
            property,
            newValue,
        });
        return yield _a.get(sceneConfig);
    }
});
SceneDbManager.updateSceneElementProperty = (message) => __awaiter(void 0, void 0, void 0, function* () {
    let { elementData, property, scenePreset } = message;
    let valueProp;
    Object.keys(elementData).forEach((key) => {
        if (key == property && elementData.hasOwnProperty(property)) {
            valueProp = key;
        }
    });
    if (!valueProp) {
        return;
    }
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: elementData.pk, sk: elementData.sk },
        UpdateExpression: "set #prop = :prop, #ts = :ts",
        ConditionExpression: "#ts <= :elementTs",
        ExpressionAttributeNames: { "#prop": property, "#ts": "ts" },
        ExpressionAttributeValues: {
            ":prop": elementData[valueProp],
            ":elementTs": elementData.ts,
            ":ts": Date.now(),
        },
    };
    try {
        yield common_data_1.daxClient.update(params).promise();
        elementData = yield Generic_data_1.GenericDbManager.get(elementData);
        scenePreset = yield _a.getPreset(message.scenePreset.sk);
        return { scenePreset, elementData };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/updateElementProperty",
            message,
        });
        return;
    }
});
SceneDbManager.removeSceneElement = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const { elementData, scenePreset } = message;
    const dbPreset = yield _a.getPreset(scenePreset.sk);
    const videos = dbPreset.videos.filter((id) => id !== elementData.sk), images = dbPreset.images.filter((id) => id !== elementData.sk), nfts = dbPreset.nfts.filter((id) => id !== elementData.sk), sounds = dbPreset.sounds.filter((id) => id !== elementData.sk), widgets = dbPreset.widgets.filter((id) => id !== elementData.sk);
    const params = {
        TransactItems: [
            {
                Update: {
                    Key: {
                        pk: dbPreset.pk,
                        sk: dbPreset.sk,
                    },
                    UpdateExpression: "SET #videos = :videos, #images = :images, #nfts = :nfts, #sounds = :sounds, #widgets = :widgets",
                    ExpressionAttributeNames: {
                        "#videos": "videos",
                        "#images": "images",
                        "#nfts": "nfts",
                        "#sounds": "sounds",
                        "#widgets": "widgets",
                    },
                    ExpressionAttributeValues: {
                        ":videos": videos,
                        ":images": images,
                        ":nfts": nfts,
                        ":sounds": sounds,
                        ":widgets": widgets,
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Update: {
                    Key: {
                        pk: elementData.pk,
                        sk: elementData.sk,
                    },
                    UpdateExpression: "SET #ttl = :ttl, #deleted = :deleted",
                    ExpressionAttributeNames: {
                        "#ttl": "ttl",
                        "#deleted": "deleted",
                    },
                    ExpressionAttributeValues: {
                        ":ttl": luxon_1.DateTime.now().plus({ days: 30 }),
                        ":deleted": true,
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        const scenePreset = yield Generic_data_1.GenericDbManager.get(dbPreset);
        return { scenePreset };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/removeSceneElement",
        });
        return;
    }
});
SceneDbManager.updatePreset = (scene, preset) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, preset), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        const scenePreset = yield SceneDbManager.getPreset(preset.sk);
        return { scenePreset };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/put",
            scene,
        });
        return;
    }
});
SceneDbManager.put = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, scene), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return yield SceneDbManager.getById(scene.sk);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/put",
            scene,
        });
        return;
    }
});
SceneDbManager.updateInstance = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, message.instanceData), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        const instanceData = yield Generic_data_1.GenericDbManager.get(message.instanceData);
        const scenePreset = yield _a.getPreset(message.scenePreset.sk);
        return {
            instanceData,
            scenePreset,
        };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Scene.data/updateInstance",
            message,
        });
        return;
    }
});
