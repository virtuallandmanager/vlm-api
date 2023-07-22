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
const User_logic_1 = require("../../logic/User.logic");
const decentraland_crypto_middleware_1 = require("decentraland-crypto-middleware");
const Event_logic_1 = require("../../logic/Event.logic");
const utils_1 = require("../../middlewares/utils");
const router = express_1.default.Router();
router.post("/", (0, decentraland_crypto_middleware_1.express)({ expiration: utils_1.VALID_SIGNATURE_TOLERANCE_INTERVAL_MS }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.session.userId) {
            return res.status(400).json({
                text: "Bad Request.",
            });
        }
        const user = yield User_logic_1.UserManager.getById(req.session.userId), events = yield Event_logic_1.EventManager.getEventsForUser(user);
        return res.status(200).json({
            text: "Successfully authenticated.",
            events: events || [],
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Authentication.controller/cards",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
exports.default = router;
