"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionEvent = void 0;
const uuid_1 = require("uuid");
class SessionEvent {
    constructor() {
        this.pk = "dcl:user:session:event"; // Partition Key
        this.sk = (0, uuid_1.v4)(); // Partition Key
    }
}
exports.SessionEvent = SessionEvent;
