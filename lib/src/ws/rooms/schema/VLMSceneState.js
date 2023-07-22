"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VLMSceneState = void 0;
const schema_1 = require("@colyseus/schema");
class VLMScenePreset extends schema_1.MapSchema {
    constructor() {
        super(...arguments);
        this.nfts = [];
    }
}
class VLMSceneState extends schema_1.Schema {
    constructor(config) {
        super();
        this.scenePreset = config || new VLMScenePreset();
    }
}
exports.VLMSceneState = VLMSceneState;
