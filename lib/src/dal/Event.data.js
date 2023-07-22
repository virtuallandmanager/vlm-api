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
exports.EventDbManager = void 0;
const Event_model_1 = require("../models/Event.model");
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const data_1 = require("../helpers/data");
const Giveaway_model_1 = require("../models/Giveaway.model");
class EventDbManager {
}
exports.EventDbManager = EventDbManager;
_a = EventDbManager;
EventDbManager.obtain = (eventConfig) => __awaiter(void 0, void 0, void 0, function* () {
    let existingEvent, createdEvent;
    try {
        existingEvent = yield _a.get(eventConfig);
        if (!existingEvent) {
            createdEvent = yield _a.put(eventConfig);
        }
        return createdEvent || existingEvent;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/obtain",
            eventConfig,
        });
        return;
    }
});
EventDbManager.get = (eventConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const { pk, sk } = eventConfig;
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk,
            sk,
        },
    };
    try {
        const eventRecord = yield common_data_1.docClient.get(params).promise();
        return eventRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/get",
            eventConfig,
        });
        return;
    }
});
EventDbManager.getById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    if (!sk) {
        return;
    }
    const params = {
        Key: {
            pk: Event_model_1.Event.Config.pk,
            sk,
        },
        TableName: common_data_1.vlmMainTable,
    };
    try {
        const event = yield common_data_1.docClient.get(params).promise();
        return event.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/getByIds",
            sk,
        });
        return;
    }
});
EventDbManager.getByIds = (sks) => __awaiter(void 0, void 0, void 0, function* () {
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
                    pk: Event_model_1.Event.Config.pk,
                    sk,
                },
                TableName: common_data_1.vlmMainTable,
            },
        });
    });
    try {
        const events = yield common_data_1.docClient.transactGet(params).promise();
        return events.Responses.map((item) => item.Item);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/getByIds",
            sks,
        });
        return;
    }
});
EventDbManager.getGiveawaysByIds = (sks) => __awaiter(void 0, void 0, void 0, function* () {
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
                    pk: Event_model_1.Event.Giveaway.Config.pk,
                    sk,
                },
                TableName: common_data_1.vlmMainTable,
            },
        });
    });
    try {
        const events = yield common_data_1.docClient.transactGet(params).promise();
        return events.Responses.map((item) => item.Item);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/getGiveawaysByIds",
            sks,
        });
        return;
    }
});
EventDbManager.getLegacy = (baseParcel) => __awaiter(void 0, void 0, void 0, function* () {
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
    const event = data.Items.find((parcel) => {
        return `${parcel.x},${parcel.y}` == baseParcel;
    });
    return event;
});
EventDbManager.getAllForUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        IndexName: "userId-index",
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#userId": "userId",
        },
        ExpressionAttributeValues: {
            ":pk": Event_model_1.Event.Config.pk,
            ":userId": user.sk,
        },
        KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };
    try {
        const eventRecords = yield (0, data_1.largeQuery)(params), eventIds = eventRecords.map((event) => event.sk), events = yield EventDbManager.getByIds(eventIds);
        return events;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/getAllForUser",
            user,
        });
        return;
    }
});
EventDbManager.getGiveawaysForEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        KeyConditionExpression: "#pk = :pkValue",
        FilterExpression: "#eventId = :eventIdValue",
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#eventId": "eventId",
        },
        ExpressionAttributeValues: {
            ":pkValue": Event_model_1.Event.GiveawayLink.pk,
            ":eventIdValue": event.sk,
        },
    };
    try {
        const eventRecords = yield (0, data_1.largeQuery)(params), giveawayIds = eventRecords.map((link) => link.giveawayId), giveaways = yield EventDbManager.getGiveawaysByIds(giveawayIds);
        return giveaways;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/getGiveawaysForEvent",
            event,
        });
        return;
    }
});
EventDbManager.adminGetAll = () => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: "VLM_MigratedLegacyEvents",
        ExpressionAttributeNames: {
            "#pk": "pk",
        },
        ExpressionAttributeValues: {
            ":pk": Giveaway_model_1.Giveaway.Item.pk,
        },
        KeyConditionExpression: "#pk = :pk",
    };
    try {
        const eventQuery = yield (0, data_1.largeQuery)(params);
        return eventQuery;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/adminGetAll",
        });
        return;
    }
});
EventDbManager.put = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, event), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return event;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/put",
            event,
        });
        return;
    }
});
EventDbManager.linkGiveaway = (link) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, link), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return link;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.data/linkGiveaway",
            link,
        });
        return;
    }
});
