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
exports.HistoryDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const History_model_1 = require("../models/History.model");
class HistoryDbManager {
}
exports.HistoryDbManager = HistoryDbManager;
_a = HistoryDbManager;
HistoryDbManager.get = (history) => __awaiter(void 0, void 0, void 0, function* () {
    const { pk, sk } = history;
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk,
            sk,
        },
    };
    try {
        const historyRecord = yield common_data_1.docClient.get(params).promise();
        return historyRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "History.data/get",
            history,
        });
        return;
    }
});
HistoryDbManager.getById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: History_model_1.History.Config.pk,
            sk,
        },
    };
    try {
        const historyRecord = yield common_data_1.docClient.get(params).promise();
        return historyRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "History.data/getById",
            sk,
        });
        return;
    }
});
HistoryDbManager.getByIds = (sks) => __awaiter(void 0, void 0, void 0, function* () {
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
                    pk: History_model_1.History.Config.pk,
                    sk,
                },
                TableName: common_data_1.vlmMainTable,
            },
        });
    });
    try {
        const response = yield common_data_1.docClient.transactGet(params).promise(), historys = response.Responses.map((item) => item.Item);
        return (historys === null || historys === void 0 ? void 0 : historys.length) ? historys : [];
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "History.data/getHistoryLinksFromIds",
            sks,
        });
        return;
    }
});
HistoryDbManager.initHistory = (config, root, update) => __awaiter(void 0, void 0, void 0, function* () {
    const ts = Date.now();
    const params = {
        TransactItems: [
            {
                Put: {
                    // Add a history
                    Item: Object.assign(Object.assign({}, config), { ts }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    // Add preset for history
                    Item: Object.assign(Object.assign({}, root), { ts }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Put: {
                    // Add preset for history
                    Item: Object.assign(Object.assign({}, update), { ts }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        return history;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "History.data/initHistory",
        });
        return;
    }
});
HistoryDbManager.addUpdateToHistory = (history, update) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TransactItems: [
            {
                Put: {
                    // Add a history update
                    Item: Object.assign(Object.assign({}, update), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
            {
                Update: {
                    // Add history to user
                    Key: {
                        pk: History_model_1.History.Config.pk,
                        sk: history.sk,
                    },
                    UpdateExpression: "set #historyPresetIds = list_append(if_not_exists(#updates, :empty_list), :updateId)",
                    ExpressionAttributeNames: {
                        "#updates": "updates",
                    },
                    ExpressionAttributeValues: {
                        ":updateId": [update.sk],
                        ":empty_list": [],
                    },
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.daxClient.transactWrite(params).promise();
        return { history, update };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "History.data/createHistoryPreset",
        });
        return;
    }
});
HistoryDbManager.put = (history) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, history), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return yield HistoryDbManager.get(history);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "History.data/put",
            history,
        });
        return;
    }
});
