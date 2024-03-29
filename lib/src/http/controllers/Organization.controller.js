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
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const router = express_1.default.Router();
router.post("/create", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userInfo = req.body.userInfo, userOrgInfo = req.body.userOrgInfo;
        const organization = yield Organization_logic_1.OrganizationManager.create(userInfo, userOrgInfo);
        return res.status(200).json({
            text: "Successfully created user.",
            organization,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.controller/create",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.post("/update", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            from: "Organization.controller/update",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
exports.default = router;
