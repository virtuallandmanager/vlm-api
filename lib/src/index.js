"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameServer = void 0;
const core_1 = require("@colyseus/core");
const redis_presence_1 = require("@colyseus/redis-presence");
const redis_driver_1 = require("@colyseus/redis-driver");
const ws_transport_1 = require("@colyseus/ws-transport");
const VLMScene_1 = require("./ws/rooms/VLMScene");
const app_1 = __importDefault(require("./app"));
const port = Number(process.env.PORT || 3010);
console.log(`
░█░█░▀█▀░█▀▄░▀█▀░█░█░█▀█░█░░░░░█░░░█▀█░█▀█░█▀▄░░░█▄█░█▀█░█▀█░█▀█░█▀▀░█▀▀░█▀▄
░▀▄▀░░█░░█▀▄░░█░░█░█░█▀█░█░░░░░█░░░█▀█░█░█░█░█░░░█░█░█▀█░█░█░█▀█░█░█░█▀▀░█▀▄
░░▀░░▀▀▀░▀░▀░░▀░░▀▀▀░▀░▀░▀▀▀░░░▀▀▀░▀░▀░▀░▀░▀▀░░░░▀░▀░▀░▀░▀░▀░▀░▀░▀▀▀░▀▀▀░▀░▀
`);
console.log(`------------------------------------------------------------------------------`);
console.log(`|            Version 2.0.0 - Stunning 8K Resolution Meditation App            |`);
console.log(`------------------------------------------------------------------------------`);
console.log(`//////////////////////// STARTING API ON PORT ${port} ////////////////////////`);
console.log(`//////////////////////////// ${process.env.NODE_ENV.toUpperCase()} MODE ////////////////////////////`);
const server = app_1.default.listen(app_1.default.get("port"), () => {
    console.log(`///////////////////////////////////////////////////////////////////////`);
    console.log("///////////////////////////// - HTTPS API - //////////////////////////");
    console.log(`//////////////////// Running at http://localhost:${port} ///////////////`);
    console.log("////////////////////// Press CTRL-C to stop ////////////////////////");
});
exports.gameServer = new core_1.Server({
    transport: new ws_transport_1.WebSocketTransport({ server }),
    presence: new redis_presence_1.RedisPresence({ host: "3.139.107.2", port: 6379 }),
    driver: new redis_driver_1.RedisDriver({ host: "3.139.107.2", port: 6379 }),
});
exports.gameServer.define("vlm_scene", VLMScene_1.VLMScene);
console.log(`/////////////////////////////// - WSS API - /////////////////////////////`);
console.log(`///////////////////// Running at ws://localhost:${port} ///////////////////`);
