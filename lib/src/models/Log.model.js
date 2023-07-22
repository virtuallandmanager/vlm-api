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
        Type[Type["FATAL"] = 3] = "FATAL";
    })(Type = Log.Type || (Log.Type = {}));
    class AdminLog {
        constructor(log) {
            this.sk = (0, uuid_1.v4)();
            this.ts = luxon_1.DateTime.now().toUnixInteger();
            this.pk = log.pk;
            this.sk = log.sk || this.sk;
            this.message = log.message;
            this.type = log.type;
            this.metadata = log.metadata;
            this.environment = log.environment;
            this.ts = log.ts || this.ts;
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
    class AdminLogFatal extends AdminLog {
        constructor(log) {
            super(log);
            this.pk = AdminLogFatal.pk;
        }
    }
    AdminLogFatal.pk = "vlm:admin:log:fatal";
    Log.AdminLogFatal = AdminLogFatal;
})(Log = exports.Log || (exports.Log = {}));
