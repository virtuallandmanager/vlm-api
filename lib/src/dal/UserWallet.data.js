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
exports.UserWalletDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const User_model_1 = require("../models/User.model");
const Generic_data_1 = require("./Generic.data");
class UserWalletDbManager {
}
exports.UserWalletDbManager = UserWalletDbManager;
_a = UserWalletDbManager;
UserWalletDbManager.obtain = (walletConfig) => __awaiter(void 0, void 0, void 0, function* () {
    let existingWallet, createdWallet;
    try {
        existingWallet = yield _a.get(walletConfig);
        if (!existingWallet) {
            createdWallet = yield _a.put(walletConfig);
        }
        return existingWallet || createdWallet;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "UserWallet.data/obtain",
            walletConfig,
        });
    }
});
UserWalletDbManager.get = (wallet) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: User_model_1.User.Wallet.pk,
            sk: wallet.sk || wallet.address,
        },
    };
    try {
        const walletRecord = yield common_data_1.docClient.get(params).promise();
        return walletRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "UserWallet.data/get",
            wallet,
        });
    }
});
UserWalletDbManager.getIdsForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const partialWallets = yield Generic_data_1.GenericDbManager.getAllForUser(User_model_1.User.Wallet.pk, userId), walletIds = partialWallets.map((transaction) => transaction.sk);
        return walletIds;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "UserWallet.data/getById",
            userId,
        });
    }
});
UserWalletDbManager.put = (wallet) => __awaiter(void 0, void 0, void 0, function* () {
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
            from: "UserWallet.data/put",
            wallet,
        });
    }
});
