"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@colyseus/core");
const redis_presence_1 = require("@colyseus/redis-presence");
const redis_driver_1 = require("@colyseus/redis-driver");
const ws_transport_1 = require("@colyseus/ws-transport");
const VLMScene_1 = require("./ws/rooms/VLMScene");
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: __dirname + "/.env" });
const app_1 = __importDefault(require("./app"));
const port = Number(process.env.PORT || 3010);
console.log(`
░█░█░▀█▀░█▀▄░▀█▀░█░█░█▀█░█░░░░░█░░░█▀█░█▀█░█▀▄░░░█▄█░█▀█░█▀█░█▀█░█▀▀░█▀▀░█▀▄
░▀▄▀░░█░░█▀▄░░█░░█░█░█▀█░█░░░░░█░░░█▀█░█░█░█░█░░░█░█░█▀█░█░█░█▀█░█░█░█▀▀░█▀▄
░░▀░░▀▀▀░▀░▀░░▀░░▀▀▀░▀░▀░▀▀▀░░░▀▀▀░▀░▀░▀░▀░▀▀░░░░▀░▀░▀░▀░▀░▀░▀░▀░▀▀▀░▀▀▀░▀░▀
`);
console.log(`------------------------------------------------------------------------------`);
console.log(`|            Version 0.1.0 - Stunning 8K Resolution Meditation App            |`);
console.log(`------------------------------------------------------------------------------`);
console.log(`//////////////////////// STARTING API ON PORT ${port} ////////////////////////`);
console.log(`//////////////////////////// ${process.env.NODE_ENV.toUpperCase()} MODE ////////////////////////////`);
const server = app_1.default.listen(app_1.default.get("port"), () => {
    console.log(`///////////////////////////////////////////////////////////////////////`);
    console.log("///////////////////////////// - HTTPS API - //////////////////////////");
    console.log(`//////////////////////// Running on port ${port} ///////////////////////`);
    console.log(`///////////////////////////////////////////////////////////////////////`);
    if (process.env.NODE_ENV !== "development") {
        console.log(`/////////////////////////////// - PRESENCE SERVER - /////////////////////////////`);
        console.log(`///////////////////// Connected to ${process.env.PRESENCE_SERVER_HOST}:${process.env.PRESENCE_SERVER_PORT} ///////////////////`);
        console.log(`///////////////////////////////////////////////////////////////////////`);
    }
    console.log("////////////////////// Press CTRL-C to stop ////////////////////////");
});
let gameServer;
if (process.env.NODE_ENV !== "production") {
    gameServer = new core_1.Server({
        transport: new ws_transport_1.WebSocketTransport({ server }),
    });
}
else {
    const presenceServer = { host: process.env.PRESENCE_SERVER_HOST, port: Number(process.env.PRESENCE_SERVER_PORT) };
    gameServer = new core_1.Server({
        transport: new ws_transport_1.WebSocketTransport({ server }),
        presence: new redis_presence_1.RedisPresence(presenceServer),
        driver: new redis_driver_1.RedisDriver(presenceServer),
    });
}
gameServer.define("vlm_scene", VLMScene_1.VLMScene);
