import { Room, Client } from "colyseus";
import { IncomingMessage } from "http";
import { SessionManager } from "../logic/Session.logic";
import { DCLSceneState } from "./schema/DCLSceneState";
import { Analytics } from "../models/Analytics.model";
import { SceneManager } from "../logic/Scene.logic";

export class DCLScene extends Room<DCLSceneState> {
  onCreate(options: any) {
    this.setState(new DCLSceneState());
    console.log(options, "created room!");
    this.onMessage("*", (client, message) => {
      console.log(client, message);
    });

    this.onMessage("final_path", (client, message) => {
      console.log(client, message);
    });

    this.onMessage("create_path", async (client, message) => {
      const session = await SessionManager.validateSessionToken(message.sessionToken);
      const sessionPath = await SessionManager.createSessionPath(session, {
        path: [message.pathPoint],
      });
      console.log("created path!");
      client.send("path_created_message", { sessionPath });
    });

    this.onMessage("update_path", async (client, message) => {
      const { pathPoints, pathId } = message;
      const sessionPath = await SessionManager.extendSessionPath(pathId, pathPoints);
      console.log("updated path!");
      client.send("path_updated_message", { sessionPath, pointsAdded: pathPoints.length });
    });

    this.onMessage("end_session", async (client, message) => {
      const { sessionData } = message;

      await SessionManager.endAnalyticsSession(sessionData);

      client.send("session_ended_message");
    });

    this.onMessage("update_scene", (client, message) => {
      // sends "scene update" event to every client, except the one who triggered it.
      this.broadcast("update_scene", message, { except: client });
    });

    this.onMessage("player_joined", (client, message) => {
      this.broadcast("player_joined", message, { except: client });
    });
  }

  // Authorize client based on provided options before WebSocket handshake is complete
  async onAuth(client: Client, options: any, request: IncomingMessage) {
    console.log(options, "authenticated to room!");

    const { sessionToken } = options,
      clientIp = request.socket.remoteAddress;

    const dbSession = await SessionManager.validateSessionToken(sessionToken);

    if (!dbSession) {
      return false;
    }

    return { ...dbSession, clientIp };
  }

  async onJoin(client: Client, options: any, session: any) {
    console.log(`${options.displayName} joined! - Session ID: ${options.sk}`);
    if (session.pk == Analytics.Session.Config.pk) {
      const dbSession = await SessionManager.startAnalyticsSession({
        ...options,
        sk: client.sessionId,
      });
      client.send("session_started_message", dbSession);
      console.log("session started!");
    }
    SceneManager.initDCLScene();
    client.send("init_scene", options.scene);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    SessionManager.endAnalyticsSession(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
