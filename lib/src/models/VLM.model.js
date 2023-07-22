"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VLMRecord = void 0;
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
