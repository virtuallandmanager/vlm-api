"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hyperfy = void 0;
const Scene_model_1 = require("../Scene.model");
var Hyperfy;
(function (Hyperfy) {
    class Scene extends Scene_model_1.Scene.Config {
        constructor(config) {
            super(config);
            this.world = "hyperfy";
        }
    }
    Hyperfy.Scene = Scene;
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
    Hyperfy.Preset = Preset;
})(Hyperfy = exports.Hyperfy || (exports.Hyperfy = {}));
