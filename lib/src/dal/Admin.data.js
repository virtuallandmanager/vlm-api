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
exports.AdminDbManager = void 0;
const Event_model_1 = require("../models/Event.model");
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const data_1 = require("../helpers/data");
const User_model_1 = require("../models/User.model");
const Organization_model_1 = require("../models/Organization.model");
const Scene_model_1 = require("../models/Scene.model");
const Analytics_model_1 = require("../models/Analytics.model");
class AdminDbManager {
}
exports.AdminDbManager = AdminDbManager;
_a = AdminDbManager;
AdminDbManager.getUsers = (pageSize, lastEvaluated, sort) => __awaiter(void 0, void 0, void 0, function* () {
    let params = {
        TableName: common_data_1.vlmMainTable,
        ExpressionAttributeNames: {
            "#pk": "pk",
        },
        ExpressionAttributeValues: {
            ":pk": User_model_1.User.Account.pk,
        },
        KeyConditionExpression: "#pk = :pk",
        Limit: pageSize || 100,
    };
    if (lastEvaluated) {
        params.ExclusiveStartKey = lastEvaluated;
    }
    try {
        const users = yield (0, data_1.largeQuery)(params);
        return users;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.data/getUsers",
        });
        return;
    }
});
AdminDbManager.getUserSessions = (pageSize, lastEvaluated, sort) => __awaiter(void 0, void 0, void 0, function* () {
    let params = {
        TableName: common_data_1.vlmMainTable,
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#expires": "expires",
        },
        ExpressionAttributeValues: {
            ":pk": User_model_1.User.Session.Config.pk,
            ":ts": Date.now(),
        },
        KeyConditionExpression: "#pk = :pk",
        FilterExpression: "#expires >= :ts",
        Limit: pageSize || 100,
    };
    if (lastEvaluated) {
        params.ExclusiveStartKey = lastEvaluated;
    }
    try {
        const users = yield (0, data_1.largeQuery)(params);
        return users;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.data/getUserSessions",
        });
        return;
    }
});
AdminDbManager.getAnalyticsSessions = (pageSize, lastEvaluated, sort) => __awaiter(void 0, void 0, void 0, function* () {
    let params = {
        TableName: common_data_1.vlmMainTable,
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#expires": "expires",
        },
        ExpressionAttributeValues: {
            ":pk": Analytics_model_1.Analytics.Session.Config.pk,
            ":ts": Date.now(),
        },
        KeyConditionExpression: "#pk = :pk",
        FilterExpression: "#expires >= :ts",
        Limit: pageSize || 100,
    };
    if (lastEvaluated) {
        params.ExclusiveStartKey = lastEvaluated;
    }
    try {
        const users = yield (0, data_1.largeQuery)(params);
        return users;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.data/getAnalyticsSessions",
        });
        return;
    }
});
AdminDbManager.getOrganizations = (pageSize, lastEvaluated, sort) => __awaiter(void 0, void 0, void 0, function* () {
    let params = {
        TableName: common_data_1.vlmMainTable,
        ExpressionAttributeNames: {
            "#pk": "pk",
        },
        ExpressionAttributeValues: {
            ":pk": Organization_model_1.Organization.Account.pk,
        },
        KeyConditionExpression: "#pk = :pk",
        ProjectionExpression: "sk, displayName, createdAt",
        Limit: pageSize || 100,
    };
    if (lastEvaluated) {
        params.ExclusiveStartKey = lastEvaluated;
    }
    try {
        const orgs = yield (0, data_1.largeQuery)(params);
        return orgs;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.data/getOrganizations",
        });
        return;
    }
});
AdminDbManager.getScenes = (pageSize, lastEvaluated, sort) => __awaiter(void 0, void 0, void 0, function* () {
    let params = {
        TableName: common_data_1.vlmMainTable,
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#name": "name",
        },
        ExpressionAttributeValues: {
            ":pk": Scene_model_1.Scene.Config.pk,
        },
        KeyConditionExpression: "#pk = :pk",
        ProjectionExpression: "sk, #name, createdAt, scenePresetIds",
        Limit: pageSize || 100,
    };
    if (lastEvaluated) {
        params.ExclusiveStartKey = lastEvaluated;
    }
    try {
        const scenes = yield (0, data_1.largeQuery)(params);
        return scenes;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.data/getScenes",
        });
        return;
    }
});
AdminDbManager.getEvents = (pageSize, lastEvaluated, sort) => __awaiter(void 0, void 0, void 0, function* () {
    let params = {
        TableName: common_data_1.vlmMainTable,
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#name": "name",
        },
        ExpressionAttributeValues: {
            ":pk": Event_model_1.Event.Config.pk,
        },
        KeyConditionExpression: "#pk = :pk",
        ProjectionExpression: "sk, #name, startTime, endTime, created",
        Limit: pageSize || 100,
    };
    if (lastEvaluated) {
        params.ExclusiveStartKey = lastEvaluated;
    }
    try {
        const events = yield (0, data_1.largeQuery)(params);
        return events;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.data/getEvents",
        });
        return;
    }
});
