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
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const router = express_1.default.Router();
router.post("/error", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, metadata, userInfo } = req.body;
        yield ErrorLogging_logic_1.AdminLogManager.logExternalError(error, metadata, userInfo);
        return res.status(200).json({
            text: "Logged error successfully.",
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Log.controller/error",
        });
        return res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            text: error.text || "Something went wrong on the server. Please try again.",
            error,
        });
    }
}));
router.post("/warning", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { log, metadata, userInfo } = req.body;
        yield ErrorLogging_logic_1.AdminLogManager.logExternalError(log, metadata, userInfo);
        return res.status(200).json({
            text: "Logged error successfully.",
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Log.controller/error",
        });
        return res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            text: error.text || "Something went wrong on the server. Please try again.",
            error,
        });
    }
}));
router.post("/info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { log, metadata, userInfo } = req.body;
        yield ErrorLogging_logic_1.AdminLogManager.logExternalError(log, metadata, userInfo);
        return res.status(200).json({
            text: "Logged error successfully.",
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Log.controller/error",
        });
        return res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            text: error.text || "Something went wrong on the server. Please try again.",
            error,
        });
    }
}));
router.post("/wat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { log, metadata, userInfo } = req.body;
        yield ErrorLogging_logic_1.AdminLogManager.logWAT(log, metadata, userInfo);
        return res.status(200).json({
            text: "Logged error successfully.",
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Log.controller/error",
        });
        return res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            text: error.text || "Something went wrong on the server. Please try again.",
            error,
        });
    }
}));
exports.default = router;
