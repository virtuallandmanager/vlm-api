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
exports.AdminLogManager = void 0;
const ErrorLogging_data_1 = require("../dal/ErrorLogging.data");
var Type;
(function (Type) {
    Type[Type["INFO"] = 0] = "INFO";
    Type[Type["WARNING"] = 1] = "WARNING";
    Type[Type["ERROR"] = 2] = "ERROR";
    Type[Type["FATAL"] = 3] = "FATAL";
})(Type || (Type = {}));
class AdminLogManager {
}
exports.AdminLogManager = AdminLogManager;
_a = AdminLogManager;
AdminLogManager.retries = {};
AdminLogManager.logInfo = (log, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, Type.INFO);
    }
    catch (error) {
        _a.logError(error, { from: "AdminLogManager.logInfo", metadata });
    }
});
AdminLogManager.logWarning = (log, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, Type.WARNING);
    }
    catch (error) {
        _a.logError(error, { from: "AdminLogManager.logWarning", metadata });
    }
});
AdminLogManager.logError = (log, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, Type.ERROR);
    }
    catch (error) {
        _a.logError(error, { from: "AdminLogManager.logError", metadata });
    }
});
AdminLogManager.logFatal = (log, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ErrorLogging_data_1.AdminLogDbManager.addLogToDb(log, metadata, Type.FATAL);
    }
    catch (error) {
        _a.logError(error, { from: "AdminLogManager.logFatal", metadata });
    }
});
