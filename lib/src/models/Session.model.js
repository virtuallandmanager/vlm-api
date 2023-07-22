"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const uuid_1 = require("uuid");
const luxon_1 = require("luxon");
var Session;
(function (Session) {
    class Config {
        constructor(config) {
            this.sk = (0, uuid_1.v4)(); // Sort Key
            this.ts = Date.now();
            this.sk = config.sk || this.sk;
            this.userId = config.userId;
            this.connectedWallet = config.connectedWallet;
            this.clientIp = config.clientIp;
            this.sessionStart = config.sessionStart;
            this.sessionEnd = config.sessionEnd;
            this.ipData = config.ipData;
            this.signatureToken = config.signatureToken;
            this.sessionToken = config.sessionToken;
            this.expires = config.expires;
            this.sceneId = config.sceneId;
            this.world = config.world;
            this.worldLocation = config.worldLocation;
            this.ts = config.ts || this.ts;
        }
    }
    Config.pk = "vlm:session:config"; // Partition Key
    Session.Config = Config;
    class AggregateDate {
        constructor(config) {
            this.sk = luxon_1.DateTime.utc().toFormat("yyyy-MM-dd"); // Sort Key
            this.sk = config.sk || this.sk;
            this.totals = config.totals;
            this.averages = config.averages;
        }
    }
    AggregateDate.pk = "vlm:session:aggregate:date"; // Partition Key
    Session.AggregateDate = AggregateDate;
    class AggregateMonth {
        constructor(config) {
            this.sk = luxon_1.DateTime.utc().toFormat("yyyy-MM"); // Sort Key
            this.sk = config.sk || this.sk;
            this.totals = config.totals;
            this.averages = config.averages;
        }
    }
    AggregateMonth.pk = "vlm:session:aggregate:month"; // Partition Key
    Session.AggregateMonth = AggregateMonth;
    class AggregateYear {
        constructor(config) {
            this.sk = luxon_1.DateTime.utc().toFormat("yyyy"); // Sort Key
            this.sk = config.sk || this.sk;
            this.totals = config.totals;
            this.averages = config.averages;
        }
    }
    AggregateYear.pk = "vlm:session:aggregate:year"; // Partition Key
    Session.AggregateYear = AggregateYear;
})(Session = exports.Session || (exports.Session = {}));
