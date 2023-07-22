"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTFrameInstance = exports.NFTFrame = void 0;
const uuid_1 = require("uuid");
class NFTFrame {
    constructor(config) {
        this.pk = "dcl:scene:nftframe"; // Partition Key
        this.sk = (0, uuid_1.v4)(); // Sort Key
        Object.keys(config).forEach((key) => {
            this[key] = config[key];
        });
    }
}
exports.NFTFrame = NFTFrame;
class NFTFrameInstance {
    constructor() {
        this.pk = NFTFrameInstance.pk; // Partition Key
        this.sk = (0, uuid_1.v4)(); // Sort Key  customId?: string;
    }
}
exports.NFTFrameInstance = NFTFrameInstance;
NFTFrameInstance.pk = "dcl:scene:nftframe:instance"; // Partition Key
