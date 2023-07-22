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
exports.BalanceDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const User_model_1 = require("../models/User.model");
const Generic_data_1 = require("./Generic.data");
const Organization_model_1 = require("../models/Organization.model");
class BalanceDbManager {
}
exports.BalanceDbManager = BalanceDbManager;
_a = BalanceDbManager;
BalanceDbManager.getIdsForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const partialBalances = yield Generic_data_1.GenericDbManager.getAllForUser(User_model_1.User.Balance.pk, userId), balanceIds = partialBalances.map((transaction) => transaction.sk);
        return balanceIds;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Balance.data/getById",
            userId,
        });
        return;
    }
});
BalanceDbManager.getIdsForOrg = (orgId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const partialBalances = yield Generic_data_1.GenericDbManager.getAllForOrg(Organization_model_1.Organization.Balance.pk, orgId), balanceIds = partialBalances.map((transaction) => transaction.sk);
        return balanceIds;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Balance.data/getById",
            orgId,
        });
        return;
    }
});
BalanceDbManager.put = (wallet) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, wallet), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return wallet;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Balance.data/put",
            wallet,
        });
        return;
    }
});
