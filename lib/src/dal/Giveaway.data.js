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
exports.GiveawayDbManager = void 0;
const Giveaway_model_1 = require("../models/Giveaway.model");
const Event_model_1 = require("../models/Event.model");
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const data_1 = require("../helpers/data");
class GiveawayDbManager {
}
exports.GiveawayDbManager = GiveawayDbManager;
_a = GiveawayDbManager;
GiveawayDbManager.get = (giveawayConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const giveaway = new Giveaway_model_1.Giveaway.Config(giveawayConfig), { pk, sk } = giveaway;
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk,
            sk,
        },
    };
    try {
        const giveawayRecord = yield common_data_1.docClient.get(params).promise();
        return giveawayRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Giveaway.data/get",
            giveawayConfig,
        });
        return;
    }
});
GiveawayDbManager.getItemsByIds = (sks) => __awaiter(void 0, void 0, void 0, function* () {
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
                    pk: Event_model_1.Event.Giveaway.Item.pk,
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
            from: "Event.data/getGiveawayItemsByIds",
            sks,
        });
        return;
    }
});
GiveawayDbManager.adminGetAll = () => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: "VLM_MigratedLegacyEvents",
        ExpressionAttributeNames: {
            "#pk": "pk",
        },
        ExpressionAttributeValues: {
            ":pk": Giveaway_model_1.Giveaway.Config.pk,
        },
        KeyConditionExpression: "#pk = :pk",
    };
    try {
        const giveawayQuery = yield common_data_1.docClient.query(params).promise();
        return giveawayQuery.Items;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Giveaway.data/adminGetAll",
        });
        return;
    }
});
GiveawayDbManager.getAllLegacy = (chunkCb) => __awaiter(void 0, void 0, void 0, function* () {
    var params = {
        TableName: "vlm_claims",
    };
    const data = yield (0, data_1.largeScan)(params, chunkCb);
    return data;
});
GiveawayDbManager.addClaim = (analyticsAction, claim, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const ts = Date.now();
    const params = {
        TransactItems: [
            {
                Put: {
                    // Add an analytics action record
                    Item: Object.assign(Object.assign({}, analyticsAction), { ts }),
                    TableName: common_data_1.vlmAnalyticsTable,
                },
            },
            {
                Put: {
                    // Add a claim
                    Item: Object.assign(Object.assign({}, claim), { ts }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    // Add a transaction for the claim
                    Item: Object.assign(Object.assign({}, transaction), { ts }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Giveaway.data/addClaim",
        });
        return;
    }
});
GiveawayDbManager.put = (giveaway) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, giveaway), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return giveaway;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Giveaway.data/put",
            giveaway,
        });
        return;
    }
});
GiveawayDbManager.addItem = (giveawayItem) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, giveawayItem), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return giveawayItem;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Giveaway.data/addItem",
            giveawayItem,
        });
        return;
    }
});
GiveawayDbManager.linkEvent = (link) => __awaiter(void 0, void 0, void 0, function* () {
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
