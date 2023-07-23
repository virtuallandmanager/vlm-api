import { Server } from "@colyseus/core";
import { RedisPresence } from "@colyseus/redis-presence";
import { RedisDriver } from "@colyseus/redis-driver";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { VLMScene } from "./ws/rooms/VLMScene";
import app from "./app";
import * as dotenv from "dotenv";
dotenv.config();

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

const server = app.listen(app.get("port"), () => {
  console.log(`///////////////////////////////////////////////////////////////////////`);
  console.log("///////////////////////////// - HTTPS API - //////////////////////////");
  console.log(`//////////////////// Running at http://localhost:${port} ///////////////`);
  console.log("////////////////////// Press CTRL-C to stop ////////////////////////");
});

let gameServer: Server;

if (process.env.NODE_ENV !== "production") {
  gameServer = new Server({
    transport: new WebSocketTransport({ server }),
  });
} else {
  const presence = JSON.parse(process.env.PRESENCE_SERVER);
  presence.port = Number(presence.port);
  gameServer = new Server({
    transport: new WebSocketTransport({ server }),
    presence: new RedisPresence(presence),
    driver: new RedisDriver(presence),
  });
}

gameServer.define("vlm_scene", VLMScene);
console.log(`/////////////////////////////// - WSS API - /////////////////////////////`);
console.log(`///////////////////// Running at ws://localhost:${port} ///////////////////`);
