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
exports.VLMUserRoleDbManager = void 0;
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
const User_model_1 = require("../models/User.model");
class VLMUserRoleDbManager {
}
exports.VLMUserRoleDbManager = VLMUserRoleDbManager;
_a = VLMUserRoleDbManager;
VLMUserRoleDbManager.get = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk: User_model_1.User.Role.pk,
            sk: String(id),
        },
    };
    try {
        const VLMUserRoleRecord = yield common_data_1.docClient.get(params).promise();
        return VLMUserRoleRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "VLMUserRole.data/get",
        });
    }
});
VLMUserRoleDbManager.put = (vlmUserRole) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, vlmUserRole), { ts: Date.now() }),
    };
    try {
        yield common_data_1.docClient.put(params).promise();
        return vlmUserRole;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "VLMUserRole.data/put",
            vlmUserRole,
        });
    }
});
