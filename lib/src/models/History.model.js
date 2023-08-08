"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
const uuid_1 = require("uuid");
var History;
(function (History) {
    class Config {
        constructor(config) {
            this.pk = Config.pk;
            this.sk = (0, uuid_1.v4)(); //shares SK with whatever it's storing a history for
            this.updates = [];
            this.ts = Date.now();
            this.sk = config.sk || this.sk;
            this.updates = config.updates || this.updates;
            this.ts = config.ts || this.ts;
        }
    }
    Config.pk = "vlm:history:config";
    History.Config = Config;
    class Root {
        constructor(config) {
            this.pk = Root.pk;
            this.sk = (0, uuid_1.v4)();
            this.ts = Date.now();
            this.sk = config.sk || this.sk;
            this.historyId = config.historyId;
            this.root = config.root;
            this.ts = config.ts || this.ts;
        }
    }
    Root.pk = "vlm:history:root";
    History.Root = Root;
    class Update {
        constructor(config) {
            this.pk = Update.pk;
            this.sk = (0, uuid_1.v4)();
            this.ts = Date.now();
            this.sk = (config === null || config === void 0 ? void 0 : config.sk) || this.sk;
            this.userId = config.userId;
            this.displayName = config.displayName;
            this.action = config.action;
            this.element = config.element;
            this.id = config.id;
            this.property = config.property;
            this.from = config.from;
            this.to = config.to;
            this.ts = config.ts;
        }
    }
    Update.pk = "vlm:history:update";
    History.Update = Update;
})(History = exports.History || (exports.History = {}));
