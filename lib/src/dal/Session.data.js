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
exports.SessionDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const luxon_1 = require("luxon");
const data_1 = require("../helpers/data");
const Analytics_model_1 = require("../models/Analytics.model");
const User_model_1 = require("../models/User.model");
class SessionDbManager {
}
exports.SessionDbManager = SessionDbManager;
_a = SessionDbManager;
SessionDbManager.start = (sessionConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = luxon_1.DateTime.now();
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: sessionConfig.pk, sk: sessionConfig.sk },
        ExpressionAttributeNames: {
            "#ts": "ts",
            "#sessionStart": "sessionStart",
        },
        ExpressionAttributeValues: {
            ":sessionStart": startTime.toMillis(),
            ":ts": Date.now(),
        },
        UpdateExpression: "SET #ts = :ts, #sessionStart = :sessionStart",
    };
    try {
        yield common_data_1.docClient.update(params).promise();
        return yield _a.get(sessionConfig);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/start",
            sessionConfig,
        });
    }
});
SessionDbManager.create = (session, expirationTime) => __awaiter(void 0, void 0, void 0, function* () {
    const ttl = expirationTime ? luxon_1.DateTime.now().plus(expirationTime).toMillis() : undefined;
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, session), { ts: Date.now(), ttl }),
    };
    try {
        const dbSession = yield common_data_1.docClient.put(params).promise();
        return dbSession.Attributes;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/create",
            session,
        });
    }
});
SessionDbManager.logAnalyticsAction = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, config), { ts: Date.now(), ttl: luxon_1.DateTime.now().plus({ months: 12 }).toMillis() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return true;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/logAnalyticsAction",
        });
        return false;
    }
});
SessionDbManager.get = (session) => __awaiter(void 0, void 0, void 0, function* () {
    const { pk, sk } = session;
    if (!pk || !sk) {
        console.log(`PROBLEM: ${session}`);
    }
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk,
            sk,
        },
    };
    try {
        const sessionRecord = yield common_data_1.daxClient.get(params).promise();
        return sessionRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/get",
            session,
        });
        throw error;
    }
});
SessionDbManager.activeVLMSessionsByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        IndexName: "userId-index",
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#userId": "userId",
        },
        ExpressionAttributeValues: {
            ":pk": User_model_1.User.Session.Config.pk,
            ":userId": userId,
        },
        KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };
    try {
        const sessionRecords = yield (0, data_1.largeQuery)(params), expandedRecords = [];
        for (let i = 0; i < sessionRecords.length; i++) {
            const expanded = yield _a.get(sessionRecords[i]);
            if (expanded && !expanded.sessionEnd) {
                expandedRecords.push(expanded);
            }
        }
        return expandedRecords;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/getVLMByUserId",
            userId,
        });
        return [];
    }
});
SessionDbManager.update = (session) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: session.pk, sk: session.sk },
        UpdateExpression: "set #ts = :ts",
        ConditionExpression: "#ts = :sessionTs",
        ExpressionAttributeNames: { "#ts": "ts" },
        ExpressionAttributeValues: {
            ":sessionTs": session.ts,
            ":ts": Date.now(),
        },
    };
    try {
        yield common_data_1.daxClient.update(params).promise();
        return yield SessionDbManager.get(session);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/update",
            session,
        });
    }
});
SessionDbManager.addPathId = (session, path) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: session.pk, sk: session.sk },
        UpdateExpression: "set #ts = :ts, #pathIds = list_append(if_not_exists(#pathIds, :emptyList), :pathIds)",
        ConditionExpression: "#ts = :sessionTs",
        ExpressionAttributeNames: { "#ts": "ts", "#pathIds": "pathIds" },
        ExpressionAttributeValues: {
            ":pathIds": [path.sk],
            ":sessionTs": session.ts,
            ":emptyList": new Array(),
            ":ts": Date.now(),
        },
    };
    try {
        yield common_data_1.daxClient.update(params).promise();
        return yield SessionDbManager.get(session);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/addPathId",
            session,
        });
    }
});
SessionDbManager.renew = (session) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: { pk: session.pk, sk: session.sk },
        ConditionExpression: "attribute_not_exists(sessionEnd) AND #ts <= :sessionTs",
        UpdateExpression: "set #ts = :ts, #expires = :expires, #sessionToken = :sessionToken, #signatureToken = :signatureToken",
        ExpressionAttributeNames: { "#ts": "ts", "#expires": "expires", "#sessionToken": "sessionToken", "#signatureToken": "signatureToken" },
        ExpressionAttributeValues: {
            ":sessionTs": session.ts,
            ":sessionToken": session.sessionToken,
            ":signatureToken": session.signatureToken,
            ":expires": session.expires,
            ":ts": Date.now(),
        },
    };
    try {
        yield common_data_1.daxClient.update(params).promise();
        return yield SessionDbManager.get(session);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/renew",
            session,
        });
    }
});
SessionDbManager.end = (session) => __awaiter(void 0, void 0, void 0, function* () {
    const endTime = luxon_1.DateTime.now().toUnixInteger();
    try {
        const params = {
            TableName: common_data_1.vlmMainTable,
            Key: { pk: session.pk, sk: session.sk },
            UpdateExpression: "set #ts = :ts, #sessionEnd = :sessionEnd",
            ExpressionAttributeNames: { "#ts": "ts", "#sessionEnd": "sessionEnd" },
            ExpressionAttributeValues: {
                ":sessionEnd": endTime,
                ":ts": endTime,
            },
        };
        yield common_data_1.docClient.update(params).promise();
        return session;
    }
    catch (error) {
        console.log(error);
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/end",
            session,
        });
    }
    return;
});
SessionDbManager.getPath = (userSessionPath) => __awaiter(void 0, void 0, void 0, function* () {
    const { pk, sk } = userSessionPath;
    const params = {
        TableName: common_data_1.vlmAnalyticsTable,
        Key: {
            pk,
            sk,
        },
    };
    try {
        const userSessionPathRecord = yield common_data_1.daxClient.get(params).promise();
        return userSessionPathRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/getPath",
            userSessionPath,
        });
    }
});
SessionDbManager.getPathById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmAnalyticsTable,
        Key: {
            pk: Analytics_model_1.Analytics.Path.pk,
            sk,
        },
    };
    try {
        const userSessionPathRecord = yield common_data_1.daxClient.get(params).promise();
        return userSessionPathRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/getPathById",
            sk,
        });
    }
});
SessionDbManager.createPath = (path, pathSegment) => __awaiter(void 0, void 0, void 0, function* () {
    const ts = Date.now();
    const params = {
        TransactItems: [
            {
                Put: {
                    // Add a path
                    Item: Object.assign(Object.assign({}, path), { ts }),
                    TableName: common_data_1.vlmAnalyticsTable,
                },
            },
            {
                Put: {
                    // Add the first path segment
                    Item: Object.assign(Object.assign({}, pathSegment), { ts }),
                    TableName: common_data_1.vlmAnalyticsTable,
                },
            },
        ],
    };
    try {
        yield common_data_1.docClient.transactWrite(params).promise();
        return yield SessionDbManager.getPath(path);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/createPath",
        });
    }
});
SessionDbManager.addPathSegments = (pathId, pathSegments) => __awaiter(void 0, void 0, void 0, function* () {
    const ts = Date.now(), pathSegmentIds = pathSegments.map((pathSegment) => pathSegment.sk);
    try {
        for (let i = 0; i < pathSegments.length; i++) {
            const params = {
                TransactItems: [
                    {
                        Put: {
                            // Add a path segment to the path
                            Item: Object.assign(Object.assign({}, pathSegments[i]), { ts }),
                            TableName: common_data_1.vlmAnalyticsTable,
                        },
                    },
                    {
                        Update: {
                            // Update the path with the new path segments
                            TableName: common_data_1.vlmAnalyticsTable,
                            Key: {
                                pk: Analytics_model_1.Analytics.Path.pk,
                                sk: pathId,
                            },
                            UpdateExpression: "set #segments = list_append(if_not_exists(#segments, :emptyList), :pathSegment), #ts = :ts",
                            ExpressionAttributeNames: {
                                "#segments": "segments",
                                "#ts": "ts",
                            },
                            ExpressionAttributeValues: {
                                ":pathSegment": [pathSegments[i].sk],
                                ":emptyList": [],
                                ":ts": ts,
                            },
                        },
                    },
                ],
            };
            yield common_data_1.docClient.transactWrite(params).promise();
        }
        const path = yield SessionDbManager.getPathById(pathId);
        return { added: pathSegments.length, total: path.pathSegments.length };
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.data/addPathSegments",
        });
    }
});
