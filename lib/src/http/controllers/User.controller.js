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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_logic_1 = require("../../logic/User.logic");
const auth_1 = require("../../middlewares/security/auth");
const Organization_logic_1 = require("../../logic/Organization.logic");
const User_model_1 = require("../../models/User.model");
const Organization_model_1 = require("../../models/Organization.model");
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const router = express_1.default.Router();
router.post("/vlm/update", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userInfo = req.body.userInfo;
        yield User_logic_1.UserManager.update(userInfo);
        return res.status(200).json({
            text: "Successfully updated user.",
            userInfo,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.controller/vlm/update",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
// set up a user who is connecting for the first time
router.post("/setup", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let userInfo = req.body.userInfo, userOrgInfo = req.body.userOrgInfo, userOrgs;
        // ensure the user only passes up roles they're allowed to set
        if ((_a = userInfo === null || userInfo === void 0 ? void 0 : userInfo.roles) === null || _a === void 0 ? void 0 : _a.length) {
            userInfo.roles = [User_model_1.User.Roles.BASIC_USER, User_model_1.User.Roles.ADVANCED_USER, User_model_1.User.Roles.ORG_ADMIN].filter((roleId) => userInfo.roles.includes(roleId) || roleId == User_model_1.User.Roles.BASIC_USER);
        }
        else {
            userInfo.roles = [User_model_1.User.Roles.BASIC_USER];
        }
        const dbUser = yield User_logic_1.UserManager.get(userInfo);
        userOrgs = yield Organization_logic_1.OrganizationManager.getUserOrgs(dbUser.sk, Organization_model_1.Organization.Roles.ORG_OWNER);
        if (userInfo.roles.includes(User_model_1.User.Roles.ORG_ADMIN) && !(userOrgs === null || userOrgs === void 0 ? void 0 : userOrgs.length)) {
            userOrgInfo = yield Organization_logic_1.OrganizationManager.create(userInfo, userOrgInfo);
        }
        if (((dbUser === null || dbUser === void 0 ? void 0 : dbUser.registeredAt) && ((_b = dbUser === null || dbUser === void 0 ? void 0 : dbUser.roles) === null || _b === void 0 ? void 0 : _b.length)) || (userOrgs === null || userOrgs === void 0 ? void 0 : userOrgs.length)) {
            return res.status(400).json({
                text: "User's account has already been set up.",
                dbUser,
                tip: "just the",
                real_tip: "Use the user/vlm/update endpoint.",
            });
        }
        userInfo.registeredAt = Date.now();
        userInfo = yield User_logic_1.UserManager.update(userInfo);
        userOrgs = yield Organization_logic_1.OrganizationManager.getUserOrgs(dbUser.sk, Organization_model_1.Organization.Roles.ORG_OWNER);
        return res.status(200).json({
            text: "Successfully updated user.",
            userInfo,
            userOrgs,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "User.controller/setup",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
exports.default = router;
