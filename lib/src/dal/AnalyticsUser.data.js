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
exports.AnalyticsUserDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const Analytics_model_1 = require("../models/Analytics.model");
class AnalyticsUserDbManager {
}
exports.AnalyticsUserDbManager = AnalyticsUserDbManager;
_a = AnalyticsUserDbManager;
AnalyticsUserDbManager.obtain = (analyticsUserConfig) => __awaiter(void 0, void 0, void 0, function* () {
    let existingUser, newUser;
    try {
        existingUser = yield _a.get(analyticsUserConfig);
        if (existingUser) {
            return existingUser;
        }
        newUser = yield _a.put(analyticsUserConfig);
        return newUser;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "AnalyticsUser.data/obtain",
            analyticsUserConfig,
        });
        return;
    }
});
AnalyticsUserDbManager.get = (analyticsUser) => __awaiter(void 0, void 0, void 0, function* () {
    const { pk, sk } = analyticsUser;
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk,
            sk,
        },
    };
    try {
        const analyticsUserRecord = yield common_data_1.docClient.get(params).promise();
        return analyticsUserRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "AnalyticsUser.data/get",
            analyticsUser,
        });
        return;
    }
});
AnalyticsUserDbManager.getById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Analytics_model_1.Analytics.User.Account.pk,
            sk,
        },
    };
    try {
        const analyticsUserRecord = yield common_data_1.docClient.get(params).promise();
        return analyticsUserRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "AnalyticsUser.data/getById",
            sk,
        });
        return;
    }
});
AnalyticsUserDbManager.put = (analyticsUser) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, analyticsUser), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return yield AnalyticsUserDbManager.get(analyticsUser);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "AnalyticsUser.data/put",
            analyticsUser,
        });
        return;
    }
});
