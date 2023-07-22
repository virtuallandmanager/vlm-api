"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decentraland = void 0;
const Scene_model_1 = require("../Scene.model");
var Decentraland;
(function (Decentraland) {
    let Scene;
    (function (Scene) {
        class Config extends Scene_model_1.Scene.Config {
            constructor(config) {
                super(config);
                this.parcels = config.parcels;
                this.baseParcel = config.baseParcel;
            }
        }
        Scene.Config = Config;
        class Preset extends Scene_model_1.Scene.Preset {
            constructor(config, clone = false) {
                super(config, clone);
                this.name = "New Preset";
                this.locale = "en-US";
                this.name = config.name || this.name;
                this.locale = config.locale || this.locale;
                this.videoIds = config.videoIds;
                this.imageIds = config.imageIds;
                this.nftIds = config.nftIds;
                this.entityIds = config.entityIds;
                this.widgetIds = config.widgetIds;
            }
        }
        Scene.Preset = Preset;
    })(Scene = Decentraland.Scene || (Decentraland.Scene = {}));
})(Decentraland = exports.Decentraland || (exports.Decentraland = {}));
