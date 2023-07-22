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
exports.OrganizationManager = void 0;
const Organization_data_1 = require("../dal/Organization.data");
const Balance_model_1 = require("../models/Balance.model");
const Organization_model_1 = require("../models/Organization.model");
const User_model_1 = require("../models/User.model");
class OrganizationManager {
}
exports.OrganizationManager = OrganizationManager;
_a = OrganizationManager;
OrganizationManager.create = (userConfig, orgConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const user = new User_model_1.User.Account(userConfig), org = new Organization_model_1.Organization.Account(orgConfig), orgUserCon = OrganizationManager.addOrgMember(org, user, Organization_model_1.Organization.Roles.ORG_OWNER), orgBalances = OrganizationManager.initBalances(org), userOrgs = yield OrganizationManager.getUserOrgs(user.sk), ownedOrgs = userOrgs.filter((org) => {
        return org.userRole == Organization_model_1.Organization.Roles.ORG_OWNER;
    });
    if (userOrgs && ownedOrgs.length) {
        return;
    }
    return yield Organization_data_1.OrganizationDbManager.init(org, orgUserCon, orgBalances);
});
OrganizationManager.update = (orgConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const org = new Organization_model_1.Organization.Account(orgConfig);
    return yield Organization_data_1.OrganizationDbManager.update(org);
});
OrganizationManager.get = (orgConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const org = new Organization_model_1.Organization.Account(orgConfig);
    return yield Organization_data_1.OrganizationDbManager.get(org);
});
OrganizationManager.getById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Organization_data_1.OrganizationDbManager.getById(id);
});
OrganizationManager.getUserOrgs = (userId, roleFilter) => __awaiter(void 0, void 0, void 0, function* () {
    const userOrgCons = yield Organization_data_1.OrganizationDbManager.getUserConsByUserId(userId, roleFilter);
    if (!userOrgCons.length) {
        return [];
    }
    const userOrgIds = userOrgCons.map((userOrgCon) => userOrgCon.orgId);
    const userOrgs = yield Organization_data_1.OrganizationDbManager.getByIds(userOrgIds);
    return userOrgs;
});
OrganizationManager.addMember = (orgConfig, userConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const user = new User_model_1.User.Account(userConfig);
    const org = new Organization_model_1.Organization.Account(orgConfig);
    return yield Organization_data_1.OrganizationDbManager.update(org);
});
OrganizationManager.addOrgMember = (account, user, role) => {
    return new Organization_model_1.Organization.UserConnector({ account, user, role });
};
OrganizationManager.initBalances = (organization) => {
    return Balance_model_1.PromoBalances.organization.map((balanceConfig) => new Organization_model_1.Organization.Balance(Object.assign({ orgId: organization.sk }, balanceConfig)));
};
