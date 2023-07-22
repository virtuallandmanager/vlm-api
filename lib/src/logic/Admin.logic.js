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
exports.AdminManager = void 0;
const Admin_data_1 = require("../dal/Admin.data");
class AdminManager {
}
exports.AdminManager = AdminManager;
_a = AdminManager;
AdminManager.getAdminPanelKeys = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield AdminManager.getUsers(), organizations = yield AdminManager.getOrganizations(), scenes = yield AdminManager.getScenes(), events = yield AdminManager.getEvents(), analyticsSessions = yield AdminManager.getAnalyticsSessions(), userSessions = yield AdminManager.getUserSessions();
    return { users, organizations, scenes, events, analyticsSessions, userSessions };
});
AdminManager.getEvents = (pageSize, lastEvaluated) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Admin_data_1.AdminDbManager.getEvents(pageSize, lastEvaluated)) || [];
});
AdminManager.getOrganizations = (pageSize, lastEvaluated) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Admin_data_1.AdminDbManager.getOrganizations(pageSize, lastEvaluated)) || [];
});
AdminManager.getScenes = (pageSize, lastEvaluated) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Admin_data_1.AdminDbManager.getScenes(pageSize, lastEvaluated)) || [];
});
AdminManager.getUsers = (pageSize, lastEvaluated) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Admin_data_1.AdminDbManager.getUsers(pageSize, lastEvaluated)) || [];
});
AdminManager.getUserSessions = (pageSize, lastEvaluated) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Admin_data_1.AdminDbManager.getUserSessions(pageSize, lastEvaluated)) || [];
});
AdminManager.getAnalyticsSessions = (pageSize, lastEvaluated) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Admin_data_1.AdminDbManager.getAnalyticsSessions(pageSize, lastEvaluated)) || [];
});
