"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAdvertisementType = exports.Advertisement = void 0;
const uuid_1 = require("uuid");
class Advertisement {
    constructor(config) {
        this.pk = Advertisement.pk;
        this.sk = (0, uuid_1.v4)();
        this.sk = config.sk || this.sk;
        this.campaignId = config.campaignId;
        this.title = config.title;
        this.type = config.type;
        this.contentUrl = config.contentUrl;
    }
}
exports.Advertisement = Advertisement;
Advertisement.pk = "vlm:advertisement";
var EAdvertisementType;
(function (EAdvertisementType) {
    EAdvertisementType[EAdvertisementType["IMAGE"] = 0] = "IMAGE";
    EAdvertisementType[EAdvertisementType["VIDEO"] = 1] = "VIDEO";
})(EAdvertisementType = exports.EAdvertisementType || (exports.EAdvertisementType = {}));
