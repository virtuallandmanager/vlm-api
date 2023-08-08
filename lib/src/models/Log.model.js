"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const luxon_1 = require("luxon");
const uuid_1 = require("uuid");
var Log;
(function (Log) {
    let Type;
    (function (Type) {
        Type[Type["INFO"] = 0] = "INFO";
        Type[Type["WARNING"] = 1] = "WARNING";
        Type[Type["ERROR"] = 2] = "ERROR";
        Type[Type["WAT"] = 3] = "WAT";
        Type[Type["FATAL"] = 4] = "FATAL";
    })(Type = Log.Type || (Log.Type = {}));
    class AdminLog {
        constructor(log) {
            this.sk = (0, uuid_1.v4)();
            this.ts = luxon_1.DateTime.now().toUnixInteger();
            this.pk = log.pk;
            this.sk = log.sk || this.sk;
            this.message = log === null || log === void 0 ? void 0 : log.message;
            this.type = log === null || log === void 0 ? void 0 : log.type;
            this.metadata = log === null || log === void 0 ? void 0 : log.metadata;
            this.environment = log === null || log === void 0 ? void 0 : log.environment;
            this.userInfo = log === null || log === void 0 ? void 0 : log.userInfo;
            this.ts = (log === null || log === void 0 ? void 0 : log.ts) || this.ts;
        }
    }
    AdminLog.pk = "vlm:admin:log";
    Log.AdminLog = AdminLog;
    class AdminLogInfo extends AdminLog {
        constructor(log) {
            super(log);
            this.pk = AdminLogInfo.pk;
        }
    }
    AdminLogInfo.pk = "vlm:admin:log:info";
    Log.AdminLogInfo = AdminLogInfo;
    class AdminLogWarning extends AdminLog {
        constructor(log) {
            super(log);
            this.pk = AdminLogWarning.pk;
        }
    }
    AdminLogWarning.pk = "vlm:admin:log:warning";
    Log.AdminLogWarning = AdminLogWarning;
    class AdminLogError extends AdminLog {
        constructor(log) {
            super(log);
            this.pk = AdminLogError.pk;
        }
    }
    AdminLogError.pk = "vlm:admin:log:error";
    Log.AdminLogError = AdminLogError;
    class AdminLogWAT extends AdminLog {
        constructor(log) {
            super(log);
            this.pk = AdminLogError.pk;
        }
    }
    AdminLogWAT.pk = "vlm:admin:log:wat";
    Log.AdminLogWAT = AdminLogWAT;
    class AdminLogFatal extends AdminLog {
        constructor(log) {
            super(log);
            this.pk = AdminLogFatal.pk;
        }
    }
    AdminLogFatal.pk = "vlm:admin:log:fatal";
    Log.AdminLogFatal = AdminLogFatal;
})(Log = exports.Log || (exports.Log = {}));
