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
exports.MigrationManager = void 0;
const Event_model_1 = require("../models/Event.model");
const Scene_model_1 = require("../models/Scene.model");
const Scene_logic_1 = require("./Scene.logic");
const Event_logic_1 = require("./Event.logic");
const Giveaway_logic_1 = require("./Giveaway.logic");
const Decentraland_model_1 = require("../models/worlds/Decentraland.model");
const Giveaway_model_1 = require("../models/Giveaway.model");
const Accounting_model_1 = require("../models/Accounting.model");
const luxon_1 = require("luxon");
const Analytics_model_1 = require("../models/Analytics.model");
const Migration_data_1 = require("../dal/Migration.data");
const SceneElement_logic_1 = require("./SceneElement.logic");
const SceneSettings_logic_1 = require("./SceneSettings.logic");
const ScenePreset_logic_1 = require("./ScenePreset.logic");
class MigrationManager {
}
exports.MigrationManager = MigrationManager;
_a = MigrationManager;
MigrationManager.migrateLegacyScene = (legacyScene) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e;
    const { baseParcel, propertyName } = legacyScene, scene = new Decentraland_model_1.Decentraland.Scene.Config({
        baseParcel,
        name: propertyName,
        parcels: [baseParcel],
    });
    const scenePresetConfig = new Decentraland_model_1.Decentraland.Scene.Preset();
    scenePresetConfig.videoIds = yield _a.migrateSceneVideos((_b = legacyScene.sceneData) === null || _b === void 0 ? void 0 : _b.videoScreens);
    scenePresetConfig.imageIds = yield _a.migrateSceneImages((_c = legacyScene.sceneData) === null || _c === void 0 ? void 0 : _c.images);
    scenePresetConfig.widgetIds = yield _a.migrateSceneWidgets((_d = legacyScene.sceneData) === null || _d === void 0 ? void 0 : _d.customizations);
    const events = yield _a.migrateSceneEvents(legacyScene === null || legacyScene === void 0 ? void 0 : legacyScene.events);
    yield ScenePreset_logic_1.ScenePresetManager.createScenePreset(scenePresetConfig);
    yield SceneSettings_logic_1.SceneSettingsManager.createSceneSetting((_e = legacyScene.sceneData) === null || _e === void 0 ? void 0 : _e.moderation);
    const newScene = yield Scene_logic_1.SceneManager.createScene(scene);
    yield _a.migrateSceneEvents(newScene, events);
    return newScene;
});
MigrationManager.migrateSceneVideos = (videos) => __awaiter(void 0, void 0, void 0, function* () {
    if (!videos) {
        return [];
    }
    const ids = [];
    yield videos.forEach((videoScreen) => __awaiter(void 0, void 0, void 0, function* () {
        var _f;
        let instances = [];
        if ((_f = videoScreen.instances) === null || _f === void 0 ? void 0 : _f.length) {
            instances = yield _a.migrateSceneVideoInstances(videoScreen.instances);
        }
        const newVideo = yield SceneElement_logic_1.SceneElementManager.createSceneElement({
            element: "video",
            elementData: new Scene_model_1.Scene.Video.Config(Object.assign(Object.assign({}, videoScreen), { instances })),
        });
        ids.push(newVideo.sk);
    }));
    return ids;
});
MigrationManager.migrateSceneVideoInstances = (elementData, instances) => __awaiter(void 0, void 0, void 0, function* () {
    if (!instances) {
        return [];
    }
    const ids = [];
    yield instances.forEach((videoInstance) => __awaiter(void 0, void 0, void 0, function* () {
        const instanceRecord = yield SceneElement_logic_1.SceneElementManager.createSceneElementInstance({ element: "video", instance: true, elementData, instanceData: new Scene_model_1.Scene.Video.Instance(videoInstance) });
        ids.push(instanceRecord.sk);
    }));
    return ids;
});
MigrationManager.migrateSceneImages = (images) => __awaiter(void 0, void 0, void 0, function* () {
    if (!images) {
        return [];
    }
    const ids = [];
    yield images.forEach((image) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        let instances = [];
        if ((_g = image.instances) === null || _g === void 0 ? void 0 : _g.length) {
            instances = yield _a.migrateSceneImageInstances(image.instances);
        }
        const newImage = yield SceneElement_logic_1.SceneElementManager.createSceneElement(new Scene_model_1.Scene.Image.Config(Object.assign(Object.assign({}, image), { instances })));
        ids.push(newImage.sk);
    }));
    return ids;
});
MigrationManager.migrateSceneImageInstances = (instances) => __awaiter(void 0, void 0, void 0, function* () {
    if (!instances) {
        return [];
    }
    const ids = [];
    yield instances.forEach((imageInstance) => __awaiter(void 0, void 0, void 0, function* () {
        const instanceRecord = yield SceneElement_logic_1.SceneElementManager.createSceneElement(new Scene_model_1.Scene.Image.Instance(imageInstance));
        ids.push(instanceRecord.sk);
    }));
    return ids;
});
MigrationManager.migrateSceneWidgets = (config) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(config === null || config === void 0 ? void 0 : config.length)) {
        return [];
    }
    const ids = [];
    yield config.forEach((customization) => __awaiter(void 0, void 0, void 0, function* () {
        customization.type += 1;
        const newWidget = yield SceneElement_logic_1.SceneElementManager.createSceneElement(new Scene_model_1.Scene.Widget.Config(customization));
        ids.push(newWidget.sk);
    }));
    return ids;
});
MigrationManager.migrateSceneEvents = (scene, config) => __awaiter(void 0, void 0, void 0, function* () {
    if (!config) {
        return [];
    }
    const ids = [];
    yield config.forEach((event) => __awaiter(void 0, void 0, void 0, function* () {
        const eventConfig = new Event_model_1.Event.Config({
            name: event.name,
            startTime: new Date(event.startTime).getTime(),
            endTime: new Date(event.endTime).getTime(),
        });
        event.giveawayItems.forEach((giveawayItem) => __awaiter(void 0, void 0, void 0, function* () {
            yield Giveaway_logic_1.GiveawayManager.create(giveawayItem);
        }));
        const newEvent = yield Event_logic_1.EventManager.create(eventConfig);
        ids.push(newEvent.sk);
    }));
    return ids;
});
MigrationManager.migrateGiveawayItems = (config) => __awaiter(void 0, void 0, void 0, function* () {
    if (!config) {
        return [];
    }
    const ids = [];
    yield config.forEach((event) => __awaiter(void 0, void 0, void 0, function* () {
        event.giveawayItems.forEach((item) => __awaiter(void 0, void 0, void 0, function* () {
            const giveawayItem = new Giveaway_model_1.Giveaway.Item({
                contractAddress: item.contractAddress,
                itemId: item.tokenId,
                imageLink: `https://peer.decentraland.org/lambdas/collections/contents/urn:decentraland:matic:collections-v2:${item.contractAddress}:${item.tokenId}/thumbnail`,
            });
            yield Giveaway_logic_1.GiveawayManager.createItem(giveawayItem);
        }));
    }));
    return ids;
});
MigrationManager.migrateEventClaims = (config) => __awaiter(void 0, void 0, void 0, function* () {
    if (!config) {
        return [];
    }
    const ids = [];
    yield config.forEach((claim) => __awaiter(void 0, void 0, void 0, function* () {
        let giveawayId, eventId, transactionId, claimTs;
        switch (claim.baseParcel) {
            case "-54,34":
                if (claim.eventId == "547b57a0-c095-4191-b84d-a49ab8a0c72d") {
                    giveawayId = claim.eventId;
                    eventId = "a0a896d5-92dc-4b22-9f33-dda1c862f522";
                }
                else {
                    giveawayId = "e5fb8f30-7495-4f68-b037-2bef16ee8d20";
                    eventId = "9e938d53-16e6-44a0-ac46-b2444ab4442b";
                }
                break;
            case "44,-2":
                giveawayId = "af82ef25-4207-4526-b512-4d2ed0b22de7";
                eventId = "469b62e4-8415-447d-9d67-be39831377c1";
                break;
            case "-111,22":
                giveawayId = "8cb9f03a-7a4f-42d1-972a-fe7e5b17f59d";
                eventId = "2662bd37-ef9c-424d-a470-e9412f3b7af1";
                break;
            case "35,-65":
                giveawayId = "41742e9f-d962-47d6-88b7-d48146b6a1fb";
                eventId = "0c2e0962-f506-4203-98c2-4d9db87af46b";
                break;
            case "37,-115":
                giveawayId = "2bebba7f-6645-4ddb-ad93-1b20f3ebaa4b";
                eventId = "b505954c-fb56-447f-8f49-2a10c0dcb2ce";
                break;
            case "4,-111":
                giveawayId = "ab46bbac-01db-4bdc-b96b-f621232a85d6";
                eventId = "92c4e4d4-b431-4d46-8cd9-83e26f32d980";
                break;
            case "-14,52":
                giveawayId = "838ea33d-5469-40b6-b2c1-0d820220e19d";
                eventId = "fe445445-195a-4db2-a54b-f3c9df7523e0";
                break;
            case "-11,-133":
                giveawayId = "e5fb8f30-7495-4f68-b037-2bef16ee8d20";
                eventId = "9e938d53-16e6-44a0-ac46-b2444ab4442b";
                break;
            default:
                return;
        }
        if (claim.claimedAt && luxon_1.DateTime.fromISO(claim.claimedAt).isValid) {
            claimTs = luxon_1.DateTime.fromISO(claim.claimedAt).toUnixInteger();
        }
        else if (claim.timestamp && luxon_1.DateTime.fromMillis(claim.timestamp).isValid) {
            claimTs = claim.timestamp;
        }
        else {
            return;
        }
        const newAnalyticsRecord = new Analytics_model_1.Analytics.Session.Action({
            name: "Giveaway Claim",
            origin: { world: "decentraland", location: claim.baseParcel, coordinates: claim.baseParcel.split(",") },
            metadata: { eventId, giveawayId },
            ts: claimTs,
        });
        const newTransaction = new Accounting_model_1.Accounting.Transaction({
            txType: Accounting_model_1.Accounting.TransactionType.AIRDROP,
            paymentType: Accounting_model_1.Accounting.PaymentType.CREDIT,
            txHash: claim.txHash,
            txAmount: 1,
            complete: true,
            ts: claimTs,
        });
        transactionId = newTransaction.sk;
        const newClaim = new Giveaway_model_1.Giveaway.Claim({
            to: claim.wallet,
            analyticsRecord: newAnalyticsRecord.sk,
            eventId,
            clientIp: claim.clientIp,
            giveawayId,
            transactionId,
            claimTs,
        });
        console.log(newAnalyticsRecord, newClaim, newTransaction);
        yield Giveaway_logic_1.GiveawayManager.addClaim(newAnalyticsRecord, newClaim, newTransaction);
    }));
    return ids;
});
MigrationManager.moveDataInBatches = (sourceTableName, destinationTableName, batchSize) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Migration_data_1.MigrationDbManager.moveDataInBatches(sourceTableName, destinationTableName, batchSize);
        console.log("Data migration completed.");
    }
    catch (error) {
        console.error("Data migration failed:", error);
    }
});
