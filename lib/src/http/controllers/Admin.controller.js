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
const Organization_logic_1 = require("../../logic/Organization.logic");
const auth_1 = require("../../middlewares/security/auth");
const Admin_logic_1 = require("../../logic/Admin.logic");
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const router = express_1.default.Router();
router.get("/panel", auth_1.authMiddleware, auth_1.vlmAdminMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminPanelKeys = yield Admin_logic_1.AdminManager.getAdminPanelKeys();
        return res.status(200).json(Object.assign({ text: `Got admin panel keys. Use wisely!` }, adminPanelKeys));
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.controller/users",
        });
        return res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            text: error.text || "Something went wrong on the server. Please try again.",
            error,
        });
    }
}));
router.get("/users", auth_1.authMiddleware, auth_1.vlmAdminMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = req.query.page, pageSize = req.body.pageSize, sort = req.body.sort;
        const users = yield Admin_logic_1.AdminManager.getUsers(page, pageSize, sort);
        return res.status(200).json({
            text: `Found ${(users === null || users === void 0 ? void 0 : users.length) || 0} users.`,
            users,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.controller/users",
        });
        return res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            text: error.text || "Something went wrong on the server. Please try again.",
            error,
        });
    }
}));
router.get("/events", auth_1.authMiddleware, auth_1.vlmAdminMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = req.query.page, pageSize = req.body.pageSize, sort = req.body.sort;
        const events = yield Admin_logic_1.AdminManager.getEvents(page, pageSize, sort);
        events.sort((a, b) => {
            if (a.startTime < b.startTime) {
                return -1;
            }
            if (a.startTime > b.startTime) {
                return 1;
            }
            return 0;
        });
        return res.status(200).json({
            text: `Found ${(events === null || events === void 0 ? void 0 : events.length) || 0} events.`,
            events,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.controller/users",
        });
        return res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            text: error.text || "Something went wrong on the server. Please try again.",
            error,
        });
    }
}));
router.post("/update", auth_1.authMiddleware, auth_1.vlmAdminMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userOrgInfo = req.body.userOrgInfo;
        const organization = yield Organization_logic_1.OrganizationManager.update(userOrgInfo);
        return res.status(200).json({
            text: "Successfully updated organization.",
            organization,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Admin.controller/update",
        });
        return res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            text: error.text || "Something went wrong on the server. Please try again.",
            error,
        });
    }
}));
exports.default = router;
