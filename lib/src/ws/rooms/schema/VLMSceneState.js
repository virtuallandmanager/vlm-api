"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VLMSceneState = exports.SceneStream = void 0;
const schema_1 = require("@colyseus/schema");
class SceneStream extends schema_1.Schema {
}
__decorate([
    (0, schema_1.type)("string")
], SceneStream.prototype, "sk", void 0);
__decorate([
    (0, schema_1.type)("string")
], SceneStream.prototype, "url", void 0);
__decorate([
    (0, schema_1.type)("string")
], SceneStream.prototype, "sceneId", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], SceneStream.prototype, "status", void 0);
exports.SceneStream = SceneStream;
class VLMSceneState extends schema_1.Schema {
    constructor() {
        super();
        this.streams = new schema_1.ArraySchema();
        this.streamIndex = 0;
        this.skipped = 0;
        this.batchSize = 1;
    }
}
__decorate([
    (0, schema_1.type)([SceneStream])
], VLMSceneState.prototype, "streams", void 0);
__decorate([
    (0, schema_1.type)("number")
], VLMSceneState.prototype, "streamIndex", void 0);
__decorate([
    (0, schema_1.type)("number")
], VLMSceneState.prototype, "skipped", void 0);
__decorate([
    (0, schema_1.type)("number")
], VLMSceneState.prototype, "batchSize", void 0);
exports.VLMSceneState = VLMSceneState;
