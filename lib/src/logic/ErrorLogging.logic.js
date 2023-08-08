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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminLogManager = void 0;
const axios_1 = __importDefault(require("axios"));
const ErrorLogging_data_1 = require("../dal/ErrorLogging.data");
const config_1 = __importDefault(require("../../config/config"));
const Log_model_1 = require("../models/Log.model");
class AdminLogManager {
}
exports.AdminLogManager = AdminLogManager;
_a = AdminLogManager;
AdminLogManager.retries = {};
AdminLogManager.logInfo = (log, metadata, userInfo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log_model_1.Log.Type.INFO);
    }
    catch (error) {
        _a.logError(error, { from: "AdminLogManager.logInfo", metadata });
    }
});
AdminLogManager.logWarning = (log, metadata, userInfo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log_model_1.Log.Type.WARNING);
    }
    catch (error) {
        _a.logError(error, { from: "AdminLogManager.logWarning", metadata });
    }
});
AdminLogManager.logError = (log, metadata, userInfo, noCatch) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log_model_1.Log.Type.ERROR);
    }
    catch (error) {
        if (noCatch) {
            return;
        }
        _a.logError(error, { from: "AdminLogManager.logError", metadata, failedOnce: true }, userInfo, true);
    }
});
AdminLogManager.logFatal = (log, metadata, userInfo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log_model_1.Log.Type.FATAL);
    }
    catch (error) {
        _a.logError(error, { from: "AdminLogManager.logFatal", metadata });
    }
});
AdminLogManager.logWAT = (log, metadata, userInfo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log_model_1.Log.Type.WAT);
    }
    catch (error) {
        _a.logError(error, { from: "AdminLogManager.logWAT", metadata });
    }
});
AdminLogManager.logExternalError = (log, metadata, userInfo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log_model_1.Log.Type.ERROR);
        _a.logErrorToDiscord(`
      :rotating_light: -- ${userInfo ? "USER-REPORTED " : ""}ERROR LOGGED FROM ${config_1.default.environment.toUpperCase()} -- :rotating_light:\n
      <@&1041552453918801973>\n
      TIME:\n
      **${new Date().toLocaleString()}**\n\n
      ERROR:\n
      \`\`\`json\n${JSON.stringify(log, null, 2)}\n\`\`\`\n
      METADATA:\n
      \`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\`\n
      ${userInfo
            ? `AFFECTED USER:\n
      \`\`\`json\n${JSON.stringify(userInfo, null, 2)}\n\`\`\`\n`
            : ""}
      :rotating_light: -- END ERROR -- :rotating_light:\n
      `);
    }
    catch (error) {
        _a.logError(error, { from: "AdminLogManager.logExternalError", metadata });
    }
});
AdminLogManager.logErrorToDiscord = (content, wat = false) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const webhook = wat ? process.env.DISCORD_WAT_WEBHOOK : process.env.DISCORD_ERROR_WEBHOOK;
        yield axios_1.default.post(webhook, {
            content,
        });
    }
    catch (error) {
        throw `Failed to send Discord message: ${error}`;
    }
});
