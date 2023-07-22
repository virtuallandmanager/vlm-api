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
exports.UserDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const User_model_1 = require("../models/User.model");
const UserWallet_data_1 = require("./UserWallet.data");
const Generic_data_1 = require("./Generic.data");
class UserDbManager {
}
exports.UserDbManager = UserDbManager;
_a = UserDbManager;
UserDbManager.obtain = (user) => __awaiter(void 0, void 0, void 0, function* () {
    let existingUser, createdUser;
    try {
        existingUser = yield _a.get(user);
        if (!existingUser) {
            createdUser = yield _a.put(user);
        }
        return existingUser || createdUser;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/obtain",
            user,
        });
    }
});
UserDbManager.get = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (!user.sk) {
        const walletRecord = yield UserWallet_data_1.UserWalletDbManager.get({
            wallet: user.connectedWallet,
        });
        user.sk = walletRecord.userId;
    }
    const { pk, sk } = user;
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk,
            sk,
        },
    };
    try {
        const userRecord = yield common_data_1.docClient.get(params).promise();
        const user = userRecord.Item;
        return user;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/get",
            user,
        });
    }
});
UserDbManager.getById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: User_model_1.User.Account.pk,
            sk,
        },
    };
    try {
        const userRecord = yield common_data_1.docClient.get(params).promise();
        const user = userRecord.Item;
        return user;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/getById",
            sk,
        });
    }
});
UserDbManager.getBalance = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: User_model_1.User.Balance.pk,
            sk,
        },
    };
    try {
        const userRecord = yield common_data_1.docClient.get(params).promise();
        const user = userRecord.Item;
        return user;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/getById",
            sk,
        });
    }
});
UserDbManager.obtainBalance = (balance) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: User_model_1.User.Balance.pk,
            sk: String(balance.sk),
        },
    };
    try {
        const balanceRecord = yield common_data_1.docClient.get(params).promise();
        const userBalance = balanceRecord.Item;
        if (userBalance) {
            return userBalance;
        }
        else {
            yield Generic_data_1.GenericDbManager.put(balance);
            return balance;
        }
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/getBalance",
            balance,
        });
    }
});
UserDbManager.createNewBalance = (userAccount, userBalances) => __awaiter(void 0, void 0, void 0, function* () {
    const balanceIds = userBalances.map((balance) => balance.sk);
    const params = {
        TransactItems: [
            {
                Update: {
                    TableName: common_data_1.vlmMainTable,
                    // Add the balance id to the user's account
                    Key: Object.assign(Object.assign({}, userAccount), { ts: Date.now() }),
                    UpdateExpression: "SET #ts = :ts, #attr = list_append(#attr, :balanceIds)",
                    ConditionExpression: "#ts = :userTs",
                    ExpressionAttributeNames: { "#ts": "ts", "#value": "value" },
                    ExpressionAttributeValues: {
                        ":balanceIds": balanceIds,
                        ":userTs": userAccount.ts || 0,
                        ":ts": Date.now(),
                        TableName: common_data_1.vlmMainTable,
                    },
                },
            },
        ],
    };
    if (userBalances) {
        userBalances.forEach((userBalance) => {
            params.TransactItems.push({
                Put: {
                    // Add a connection from organization to user
                    Item: Object.assign(Object.assign({}, userBalance), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            });
        });
    }
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        return userAccount;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/createNewBalance",
            userAccount,
        });
    }
});
UserDbManager.updateBalance = (balance) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: balance.pk, sk: balance.sk },
        UpdateExpression: "SET #ts = :ts, #value = :value",
        ConditionExpression: "#ts = :balanceTs",
        ExpressionAttributeNames: { "#ts": "ts", "#value": "value" },
        ExpressionAttributeValues: {
            ":value": balance.value || 0,
            ":balanceTs": balance.ts || 0,
            ":ts": Date.now(),
        },
    };
    try {
        yield common_data_1.docClient.update(params).promise();
        return yield UserDbManager.obtainBalance(balance);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/updateBalance",
            balance,
        });
    }
});
UserDbManager.getUserRole = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: User_model_1.User.Role.pk,
            sk: id,
        },
    };
    try {
        const roleRecord = yield common_data_1.docClient.get(params).promise();
        const role = roleRecord.Item;
        return role;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/getUserRole",
            id,
        });
    }
});
UserDbManager.updateIp = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: user.pk, sk: user.sk },
        UpdateExpression: "set #ts = :ts, lastIp = :lastIp",
        ExpressionAttributeNames: { "#ts": "ts" },
        ExpressionAttributeValues: {
            ":ts": Date.now(),
            ":lastIp": user.lastIp,
        },
    };
    try {
        yield common_data_1.docClient.update(params).promise();
        return yield UserDbManager.get(user);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/update",
            user,
        });
    }
    return false;
});
UserDbManager.put = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, user), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return yield UserDbManager.get(user);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.data/put",
            user,
        });
    }
});
