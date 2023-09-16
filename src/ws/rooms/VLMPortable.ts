import { Client, Room } from "colyseus";
import axios from "axios";
import { SessionManager } from "../../logic/Session.logic";
import { Analytics } from "../../models/Analytics.model";
import { User } from "../../models/User.model";
import { UserManager } from "../../logic/User.logic";
import { analyticsAuthMiddleware, userAuthMiddleware } from "../../middlewares/security/auth";
import { handleHostJoined, handleSessionEnd } from "./events/VLMScene.events";
import { Session } from "../../models/Session.model";
import { AnalyticsManager } from "../../logic/Analytics.logic";
import { VLMPortableState } from "./schema/VLMPortableState";

export class VLMPortable extends Room<VLMPortableState> {
  onCreate(options: any) {
    this.setState(new VLMPortableState());

    this.onMessage("*", (client, message) => {
      this.broadcast("message", `${client.sessionId} sent ${message}`);
    })
  }

  async onAuth(client: Client, sessionConfig: Session.Config) {

  }

  async onJoin(client: Client, sessionConfig: Session.Config, auth: { session: Session.Config; user: User.Account | Analytics.User.Account }) {
 
  }

  async connectAnalyticsUser(client: Client, sessionConfig: User.Session.Config) {
    const session = await SessionManager.startAnalyticsSession(sessionConfig);
    const user = await AnalyticsManager.getUserById(session.userId);
    console.log(`${user.displayName} joined in ${sessionConfig.world || "world"} - ${client.sessionId}.`);
    return { user, session };
  }

  async connectHostUser(client: Client, session: User.Session.Config) {
    const user = await UserManager.getById(session.userId);
    client.auth.user = user;
    handleHostJoined(client, { session, user }, this);
    return user;
  }

  async onLeave(client: Client) {
    await handleSessionEnd(client);
    console.log(client.auth?.user?.displayName || "Unknown User", "left!");
    return;
  }

  onDispose() {

  }

}
