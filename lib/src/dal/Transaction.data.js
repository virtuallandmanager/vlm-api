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
exports.TransactionDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const Generic_data_1 = require("./Generic.data");
const Accounting_model_1 = require("../models/Accounting.model");
class TransactionDbManager {
}
exports.TransactionDbManager = TransactionDbManager;
_a = TransactionDbManager;
TransactionDbManager.get = (wallet) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Accounting_model_1.Accounting.Transaction.pk,
            sk: wallet.address,
        },
    };
    try {
        const walletRecord = yield common_data_1.docClient.get(params).promise();
        return walletRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Transaction.data/get",
            wallet,
        });
    }
});
TransactionDbManager.getIdsForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const partialTransactions = yield Generic_data_1.GenericDbManager.getAllForUser(Accounting_model_1.Accounting.Transaction.pk, userId), transactionIds = partialTransactions.map((transaction) => transaction.sk);
        return transactionIds;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Transaction.data/getById",
            userId,
        });
    }
});
TransactionDbManager.put = (wallet) => __awaiter(void 0, void 0, void 0, function* () {
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
            from: "Transaction.data/put",
            wallet,
        });
    }
});
