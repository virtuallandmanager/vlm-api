"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VLMMedia = exports.VLMRecord = void 0;
const luxon_1 = require("luxon");
const uuid_1 = require("uuid");
class VLMRecord extends Object {
    constructor(obj) {
        super();
        this.sk = (0, uuid_1.v4)();
        this.ts = luxon_1.DateTime.now().toUnixInteger();
        Object.entries(obj).forEach(([key, value]) => {
            if (!(key in this)) {
                this[key] = value;
            }
        });
    }
}
exports.VLMRecord = VLMRecord;
var VLMMedia;
(function (VLMMedia) {
    let Type;
    (function (Type) {
        Type[Type["IMAGE"] = 0] = "IMAGE";
        Type[Type["VIDEO"] = 1] = "VIDEO";
    })(Type = VLMMedia.Type || (VLMMedia.Type = {}));
})(VLMMedia = exports.VLMMedia || (exports.VLMMedia = {}));
