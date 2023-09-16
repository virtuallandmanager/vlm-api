import { Client, Room } from "colyseus";
import axios from "axios";
import { SessionManager } from "../../logic/Session.logic";
import { Analytics } from "../../models/Analytics.model";
import { User } from "../../models/User.model";
import { UserManager } from "../../logic/User.logic";
import { analyticsAuthMiddleware, userAuthMiddleware } from "../../middlewares/security/auth";
import { bindEvents, handleHostJoined, handleSessionEnd } from "./events/VLMScene.events";
import { Session } from "../../models/Session.model";
import { AnalyticsManager } from "../../logic/Analytics.logic";
import { SceneStream, VLMSceneState } from "./schema/VLMSceneState";
import { ArraySchema } from "@colyseus/schema";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import https from "https";

export class VLMScene extends Room<VLMSceneState> {
  onCreate(options: any) {
    bindEvents(this);
    this.setState(new VLMSceneState());
    this.setSimulationInterval((deltaTime) => this.checkStateOfStreams(), 1000);
  }

  removeDuplicates(arr: ArraySchema<SceneStream>) {
    // Use a Set to store unique 'sk' values.
    const skSet = new Set();
    const result = new ArraySchema<SceneStream>();

    for (let obj of arr) {
      // If the 'sk' value is already in the Set, skip this object.
      if (skSet.has(obj.sk)) {
        continue;
      }

      // Add the 'sk' value to the Set and push the object to the result array.
      skSet.add(obj.sk);
      result.push(obj);
    }

    return result;
  }

  async checkStateOfStreams() {
    if (this.state.streams.length === 0) {
      return;
    } else if (this.state.streams.length <= 4 && this.state.skipped >= 2) {
      this.state.batchSize = this.state.streams.length;
      this.state.skipped = 0;
    } else if (this.state.streams.length <= 4 && this.state.skipped < 2) {
      this.state.skipped += 1;
      return;
    } else if (this.state.streams.length <= 100) {
      // Gradually increase batch size from 1 to 20 as the number of streams goes from 5 to 100
      this.state.batchSize = Math.ceil(((this.state.streams.length - 4) / (100 - 4)) * (20 - 1) + 1);
    } else {
      console.warn("There are more than 100 streams. Consider revising the logic.");
      return;
    }
    this.state.streams = this.removeDuplicates(this.state.streams);
    console.log(`--- Checking Streams ---`);
    console.log(`${this.state.streams.map((stream) => `${stream.url} - ${stream.status} - ${stream.sceneId}`).join("\n ")}`);

    if (this.state.streamIndex >= this.state.streams.length) {
      this.state.streamIndex = 0;
    }

    const streams = this.state.streams.slice(this.state.streamIndex, this.state.streamIndex + this.state.batchSize);

    for (const stream of streams) {
      const streamStatus = stream.status;
      const status = await this.isStreamLive(stream.url);

      // If the status has changed, update it and notify relevant clients
      if (status !== streamStatus) {
        stream.status = status;
        console.log(`Stream State Changed:`);
        console.log(`Scene: ${stream.sceneId} | Stream: ${stream.url} | Status: ${status}`);
        // Send a message to anyone in the room that has a matching sceneId
        for (const [sessionId, client] of Object.entries(this.clients)) {
          if (client.auth?.session.sceneId === stream.sceneId) {
            client.send("scene_video_status", { sk: stream.sk, status, url: stream.url });
          }
        }
      }
    }

    this.state.streamIndex += this.state.batchSize;
  }

  async onAuth(client: Client, sessionConfig: Session.Config) {
    const { sessionToken, sceneId } = sessionConfig;
    try {
      let auth: { session: Session.Config; user: Analytics.User.Account | User.Account } = { session: sessionConfig, user: {} };

      if (sessionConfig.pk == Analytics.Session.Config.pk) {
        await analyticsAuthMiddleware(client, { sessionToken, sceneId }, async (session) => {
          auth.session = session;
          const response = await this.connectAnalyticsUser(client, auth.session);
          auth.session = response.session;
          auth.user = response.user;
        });
      } else {
        await userAuthMiddleware(client, { sessionToken, sceneId }, async (session) => {
          auth.session = session;
          auth.session.sceneId = sessionConfig.sceneId;
          auth.user = await this.connectHostUser(client, auth.session);
        });
      }

      return auth;
    } catch (error) {
      console.log(error);
    }
  }

  async onJoin(client: Client, sessionConfig: Session.Config, auth: { session: Session.Config; user: User.Account | Analytics.User.Account, sceneId: string }) {

  }

  async connectAnalyticsUser(client: Client, sessionConfig: Analytics.Session.Config) {
    const session = await SessionManager.initAnalyticsSession(sessionConfig);
    const user = await AnalyticsManager.getUserById(session.userId);
    client.auth.user = user;
    console.log(`${user.displayName} joined in ${sessionConfig.world || "world"} - ${client.sessionId}.`);
    return { user, session };
  }

  async connectHostUser(client: Client, session: User.Session.Config) {
    const user = await UserManager.getById(session.userId);
    client.auth.user = user;
    await handleHostJoined(client, { session, user }, this);
    return user;
  }

  async getHlsContent(url: string): Promise<boolean> {
    try {
      if (!url) {
        return;
      }
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      // console.log("Checking HLS stream: ", url);
      const response = await axios.get(url, { httpsAgent: agent });
      // console.log(response);
      if (response.status === 200) {
        return true;
      } else {
        AdminLogManager.logInfo("Received non-200 success status", { url, streams: JSON.stringify(this.state.streams), totalClients: this.clients.length, clients: this.clients, response: JSON.stringify(response) });
        return false;
      }
    } catch (error: any) {
      if (error.response && error.response.status == 403) {
        this.state.streams = this.state.streams.filter((stream) => stream.url !== url);
        const clientAuths = this.clients.map((client) => client.auth);
        try {
          const log = await AdminLogManager.logWarning("Received 403 Forbidden error from HLS stream.", { url, streams: JSON.stringify(this.state.streams), totalClients: this.clients.length, clients: clientAuths, error: JSON.stringify(error) });
          return false;
        } catch (error) {
          return false;
        }
      } else if (error.response && error.response.status === 404) {
        return false;
      } else {
        return false;
      }
    }
  }

  async isStreamLive(url: string): Promise<boolean> {
    try {
      const content = await this.getHlsContent(url);
      if (content) {
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      return false;
    }
  }

  async onLeave(client: Client) {
    console.log(client);
    console.log(client.auth?.user?.displayName || "Unknown User", "left!");
    await handleSessionEnd(client, null, this);
    return;
  }
}
