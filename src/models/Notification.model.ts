import { v4 as uuidv4 } from "uuid";
import { Metaverse } from "./Metaverse.model";
import { IsDeliverable, IsReadable, IsTriggerable } from "./interfaces/Messaging.interface";

export namespace Notification {
  export abstract class Config implements IsReadable, IsDeliverable, IsTriggerable {
    static pk: string = "vlm:notification:config";
    pk?: string = Config.pk;
    seen?: boolean;
    read?: boolean;
    delivered?: boolean;
    receiverId?: string;
    senderId?: string;
    senderName?: string;
    originType?: OriginType;
    origin?: Metaverse.Location;
    message?: string;

    constructor(config: Config) {
      this.seen = config.seen;
      this.read = config.read;
      this.delivered = config.delivered || this.delivered;
      this.receiverId = config.receiverId;
      this.senderId = config.senderId;
      this.senderName = config.senderName;
      this.originType = config.originType;
      this.origin = config.origin;
      this.message = config.message;
    }
  }

  export enum DeliveryType {
    WEB,
    SMS,
    EMAIL,
    WORLD,
  }

  export enum OriginType {
    SERVER,
    USER,
    WORLD,
  }
}
