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
exports.GenericDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const data_1 = require("../helpers/data");
class GenericDbManager {
}
exports.GenericDbManager = GenericDbManager;
_a = GenericDbManager;
GenericDbManager.obtain = (dataConfig) => __awaiter(void 0, void 0, void 0, function* () {
    let existingData, updatedData, finalData;
    try {
        existingData = yield _a.get(dataConfig);
        updatedData = Object.assign({}, existingData, dataConfig);
        finalData = yield _a.put(updatedData);
        return finalData;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Generic.data/obtain",
            dataConfig,
        });
        return;
    }
});
GenericDbManager.get = (dataConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const { pk, sk } = dataConfig;
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk,
            sk,
        },
    };
    try {
        const record = yield common_data_1.docClient.get(params).promise();
        return record.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Generic.data/get",
            dataConfig,
        });
        return;
    }
});
GenericDbManager.getFragment = (dataConfig, props) => __awaiter(void 0, void 0, void 0, function* () {
    const { pk, sk } = dataConfig;
    let ProjectionExpression, ExpressionAttributeNames = {};
    props.forEach((prop) => {
        ExpressionAttributeNames[`#${prop}`] = prop;
    });
    ProjectionExpression = Object.keys(ExpressionAttributeNames).join(", ");
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk,
            sk,
        },
        ProjectionExpression,
        ExpressionAttributeNames,
    };
    try {
        const record = yield common_data_1.docClient.get(params).promise();
        return record.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Generic.data/getFragment",
            dataConfig,
        });
        return;
    }
});
GenericDbManager.getAllForUser = (pk, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        IndexName: "userId-index",
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#userId": "userId",
        },
        ExpressionAttributeValues: {
            ":pk": pk,
            ":userId": userId,
        },
        KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };
    try {
        const records = yield (0, data_1.largeQuery)(params);
        return records;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Generic.data/get",
            pk,
            userId,
        });
        return;
    }
});
GenericDbManager.getAllForOrg = (pk, orgId) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        IndexName: "orgId-index",
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#userId": "userId",
        },
        ExpressionAttributeValues: {
            ":pk": pk,
            ":orgId": orgId,
        },
        KeyConditionExpression: "#pk = :pk and #orgId = :orgId",
    };
    try {
        const records = yield (0, data_1.largeQuery)(params);
        return records;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Generic.data/get",
            pk,
            orgId,
        });
        return;
    }
});
GenericDbManager.put = (dataConfig, useCaching = false) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, dataConfig), { ts: Date.now() }),
    };
    try {
        if (useCaching) {
            yield common_data_1.daxClient.put(params).promise();
        }
        else {
            yield common_data_1.docClient.put(params).promise();
        }
        const dbItem = yield _a.get(dataConfig);
        return dbItem;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Generic.data/put",
            dataConfig,
        });
        return;
    }
});
