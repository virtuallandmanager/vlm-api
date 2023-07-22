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
exports.OrganizationDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const Organization_model_1 = require("../models/Organization.model");
const data_1 = require("../helpers/data");
class OrganizationDbManager {
}
exports.OrganizationDbManager = OrganizationDbManager;
_a = OrganizationDbManager;
OrganizationDbManager.get = (org) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield OrganizationDbManager.getById(org.sk);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/get",
        });
        return;
    }
});
OrganizationDbManager.getById = (orgId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!orgId) {
        return;
    }
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Organization_model_1.Organization.Account.pk,
            sk: orgId,
        },
    };
    try {
        const organizationRecord = yield common_data_1.docClient.get(params).promise();
        return organizationRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/getById",
        });
        return;
    }
});
OrganizationDbManager.getByIds = (sks) => __awaiter(void 0, void 0, void 0, function* () {
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
                    pk: Organization_model_1.Organization.Account.pk,
                    sk,
                },
                TableName: common_data_1.vlmMainTable,
            },
        });
    });
    try {
        const organizations = yield common_data_1.docClient.transactGet(params).promise();
        return organizations.Responses.map((item) => item.Item);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/getOrgsFromIds",
            sks,
        });
        return;
    }
});
OrganizationDbManager.getUserCon = (userCon) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Organization_model_1.Organization.UserConnector.pk,
            sk: userCon.sk,
        },
    };
    try {
        const userConRecord = yield common_data_1.docClient.get(params).promise();
        return userConRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/getUserConById",
        });
        return;
    }
});
OrganizationDbManager.getUserConById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Organization_model_1.Organization.UserConnector.pk,
            sk,
        },
    };
    try {
        const organizationRecord = yield common_data_1.docClient.get(params).promise();
        return organizationRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/getUserConById",
        });
        return;
    }
});
OrganizationDbManager.getUserConsByUserId = (userId, roleFilter) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        IndexName: "userId-index",
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#userId": "userId",
        },
        ExpressionAttributeValues: {
            ":pk": Organization_model_1.Organization.UserConnector.pk,
            ":userId": userId,
        },
        KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };
    try {
        const userConRecords = yield (0, data_1.largeQuery)(params);
        if (!(userConRecords === null || userConRecords === void 0 ? void 0 : userConRecords.length)) {
            return [];
        }
        const userConIds = userConRecords.map((fragment) => fragment.sk);
        const userCons = yield _a.getUserConsFromIds(userConIds);
        return userCons.filter((userCon) => userCon.userRole === roleFilter);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/getUserConsByUserId",
        });
        return;
    }
});
OrganizationDbManager.getBalance = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: Organization_model_1.Organization.Balance.pk,
            sk: String(id),
        },
    };
    try {
        const organizationRecord = yield common_data_1.docClient.get(params).promise();
        return organizationRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/getBalance",
        });
        return;
    }
});
OrganizationDbManager.update = (organization) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: organization.pk, sk: organization.sk },
        UpdateExpression: "set #ts = :ts",
        ConditionExpression: "#ts = :sessionTs",
        ExpressionAttributeNames: { "#ts": "ts" },
        ExpressionAttributeValues: {
            ":sessionTs": organization.ts,
            ":ts": Date.now(),
        },
    };
    try {
        yield common_data_1.docClient.update(params).promise();
        return yield OrganizationDbManager.get(organization);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/update",
            organization,
        });
        return;
    }
});
OrganizationDbManager.updateBalance = (balance) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: balance.pk, sk: balance.sk },
        UpdateExpression: "set #ts = :ts",
        ConditionExpression: "#ts = :sessionTs",
        ExpressionAttributeNames: { "#ts": "ts" },
        ExpressionAttributeValues: {
            ":sessionTs": balance.ts,
            ":ts": Date.now(),
        },
    };
    try {
        yield common_data_1.docClient.update(params).promise();
        return yield OrganizationDbManager.getBalance(balance);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/update",
            balance,
        });
        return;
    }
});
OrganizationDbManager.addMember = (orgUserCon) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign({}, orgUserCon),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return yield OrganizationDbManager.getUserCon(orgUserCon);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/addMember",
            orgUserCon,
        });
        return;
    }
});
OrganizationDbManager.init = (orgAccount, orgUserCon, orgBalances) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TransactItems: [
            {
                Put: {
                    // Add an organization
                    Item: Object.assign(Object.assign({}, orgAccount), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            },
        ],
    };
    if (orgUserCon) {
        params.TransactItems.push({
            Put: {
                // Add a connection from organization to user
                Item: Object.assign(Object.assign({}, orgUserCon), { ts: Date.now() }),
                TableName: common_data_1.vlmMainTable,
            },
        });
    }
    if (orgBalances) {
        orgBalances.forEach((orgBalance) => {
            params.TransactItems.push({
                Put: {
                    // Add a connection from organization to user
                    Item: Object.assign(Object.assign({}, orgBalance), { ts: Date.now() }),
                    TableName: common_data_1.vlmMainTable,
                },
            });
        });
    }
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        return orgAccount;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/put",
            orgAccount,
            orgUserCon,
            orgBalances,
        });
        return;
    }
});
OrganizationDbManager.getUserConsFromIds = (sks) => __awaiter(void 0, void 0, void 0, function* () {
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
                    pk: Organization_model_1.Organization.UserConnector.pk,
                    sk,
                },
                TableName: common_data_1.vlmMainTable,
            },
        });
    });
    try {
        const userCons = yield common_data_1.docClient.transactGet(params).promise();
        return userCons.Responses.map((item) => item.Item);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.data/getUserConsFromIds",
            sks,
        });
        return;
    }
});
