import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { DCLScene } from "./rooms/DCLScene";
import app from "./app";

const port = Number(process.env.PORT || 3010);
console.log(`
░█░█░▀█▀░█▀▄░▀█▀░█░█░█▀█░█░░░░░█░░░█▀█░█▀█░█▀▄░░░█▄█░█▀█░█▀█░█▀█░█▀▀░█▀▀░█▀▄
░▀▄▀░░█░░█▀▄░░█░░█░█░█▀█░█░░░░░█░░░█▀█░█░█░█░█░░░█░█░█▀█░█░█░█▀█░█░█░█▀▀░█▀▄
░░▀░░▀▀▀░▀░▀░░▀░░▀▀▀░▀░▀░▀▀▀░░░▀▀▀░▀░▀░▀░▀░▀▀░░░░▀░▀░▀░▀░▀░▀░▀░▀░▀▀▀░▀▀▀░▀░▀
`);
console.log(
  `------------------------------------------------------------------------------`
);
console.log(
  `|            Version 2.0.0 - Stunning 8K Resolution Meditation App            |`
);
console.log(
  `------------------------------------------------------------------------------`
);
console.log(
  `//////////////////////// STARTING API ON PORT ${port} ////////////////////////`
);
console.log(
  `//////////////////////////// ${process.env.NODE_ENV.toUpperCase()} MODE ////////////////////////////`
);

const server = app.listen(app.get("port"), () => {
  console.log(
    `///////////////////////////////////////////////////////////////////////`
  );
  console.log(
    "///////////////////////////// - HTTPS API - //////////////////////////"
  );
  console.log(
    `//////////////////// Running at http://localhost:${port} ///////////////`
  );
  console.log(
    "////////////////////// Press CTRL-C to stop ////////////////////////"
  );
});
const gameServer = new Server({
  transport: new WebSocketTransport({ server }),
});

gameServer.define("dcl_scene", DCLScene);

console.log(
  `/////////////////////////////// - WSS API - /////////////////////////////`
);
console.log(
  `///////////////////// Running at ws://localhost:${port} ///////////////////`
);
