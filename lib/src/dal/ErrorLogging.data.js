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
exports.AdminLogDbManager = void 0;
const uuid_1 = require("uuid");
const common_data_1 = require("./common.data");
const Log_model_1 = require("../models/Log.model");
const luxon_1 = require("luxon");
var ELogType;
(function (ELogType) {
    ELogType[ELogType["INFO"] = 0] = "INFO";
    ELogType[ELogType["WARNING"] = 1] = "WARNING";
    ELogType[ELogType["ERROR"] = 2] = "ERROR";
    ELogType[ELogType["FATAL"] = 3] = "FATAL";
})(ELogType || (ELogType = {}));
class AdminLogDbManager {
}
exports.AdminLogDbManager = AdminLogDbManager;
_a = AdminLogDbManager;
AdminLogDbManager.retries = {};
AdminLogDbManager.addLogToDb = (message, metadata, type, retryId) => __awaiter(void 0, void 0, void 0, function* () {
    const ts = luxon_1.DateTime.now().toUnixInteger(), sk = retryId || (0, uuid_1.v4)(), environment = process.env.NODE_ENV;
    let newLog;
    switch (type) {
        case Log_model_1.Log.Type.INFO:
            newLog = new Log_model_1.Log.AdminLogInfo({ sk, type, message, metadata, environment, ts });
            break;
        case Log_model_1.Log.Type.WARNING:
            newLog = new Log_model_1.Log.AdminLogWarning({ sk, type, message, metadata, environment, ts });
            break;
        case Log_model_1.Log.Type.ERROR:
            newLog = new Log_model_1.Log.AdminLogError({ sk, type, message, metadata, environment, ts });
            break;
        case Log_model_1.Log.Type.FATAL:
            newLog = new Log_model_1.Log.AdminLogFatal({ sk, type, message, metadata, environment, ts });
            break;
    }
    const params = {
        TableName: common_data_1.vlmLogTable,
        Item: newLog,
    };
    try {
        console.log(`${ELogType[type]} logged${metadata.from ? ` from ${metadata.from}` : ""}:`, metadata, message);
        yield common_data_1.docClient.put(params).promise();
        if (_a.retries[sk]) {
            delete _a.retries[sk];
        }
        return sk;
    }
    catch (error) {
        if (_a.retries[sk] && _a.retries[sk] > 5) {
            delete _a.retries[sk];
            return sk;
        }
        _a.retries.id++;
        yield _a.addLogToDb(message, metadata, type, sk);
        console.log(error);
        throw { error: JSON.stringify(error), metadata };
    }
});
