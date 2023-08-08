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
const Session_logic_1 = require("../../logic/Session.logic");
const router = express_1.default.Router();
router.get("/path/end", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionData, pathId, pathSegments } = req.body;
        const session = yield Session_logic_1.SessionManager.getAnalyticsSession(sessionData);
        if (!session) {
            return res.status(400).json({
                text: "Invalid request.",
            });
        }
        yield Session_logic_1.SessionManager.endAnalyticsSession(session);
        const path = yield Session_logic_1.SessionManager.getSessionPath(pathId);
        yield Session_logic_1.SessionManager.extendPath(pathId, pathSegments);
        return res.status(200).json({
            text: "Successfully ended session.",
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Session.controller/demo",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
exports.default = router;
