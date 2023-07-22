"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metaverse = void 0;
const uuid_1 = require("uuid");
var Metaverse;
(function (Metaverse) {
    class Config {
        constructor(config) {
            this.pk = Config.pk;
            this.sk = (0, uuid_1.v4)();
            this.name = "The Metaverse";
            this.worlds = [];
            this.worlds = [...this.worlds, ...config.worlds];
        }
    }
    Config.pk = "metaverse:config";
    Metaverse.Config = Config;
    class World {
        constructor() {
            this.pk = World.pk;
            this.sk = (0, uuid_1.v4)();
            this.name = "New World";
        }
    }
    World.pk = "metaverse:world";
    Metaverse.World = World;
})(Metaverse = exports.Metaverse || (exports.Metaverse = {}));
