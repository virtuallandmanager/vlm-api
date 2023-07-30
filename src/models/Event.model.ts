import { v4 as uuidv4 } from "uuid";
import { Scene as BaseScene } from "./Scene.model";
import { Organization } from "./Organization.model";
import { DateTime } from "luxon";

export namespace Event {
  export class Config {
    static pk: string = "vlm:event:config"; // Partition Key
    pk?: string = Config.pk; // Partition Key
    sk?: string = uuidv4(); // Sort Key
    userId?: string;
    name: string;
    createdAt?: number = DateTime.now().toUnixInteger();
    startTime: number;
    endTime?: number;
    imageSrc?: string;
    claimLimits?: Giveaway.ClaimLimits; // caps total number of giveaway claims allowed
    constructor(config: Event.Config) {
      this.sk = config.sk || this.sk;
      this.userId = config.userId;
      this.name = config.name;
      this.createdAt = config.createdAt || this.createdAt;
      this.startTime = config.startTime;
      this.endTime = config.endTime;
      this.imageSrc = config.imageSrc;
      this.claimLimits = config.claimLimits;
    }
  }

  export class SceneLink {
    static pk: string = "vlm:event:scene:link";
    pk: string = SceneLink.pk;
    sk: string = uuidv4();
    eventId: string;
    sceneId: string;

    constructor(event: Config, scene: BaseScene.Config) {
      this.eventId = event.sk;
      this.sceneId = scene.sk;
    }
  }

  export class OrgLink {
    static pk: string = "vlm:event:org:link";
    pk: string = OrgLink.pk;
    sk: string = uuidv4();
    eventId: string;
    orgId: string;

    constructor(event: Config, scene: Organization.Account) {
      this.eventId = event.sk;
      this.orgId = scene.sk;
    }
  }

  export class GiveawayLink {
    static pk: string = "vlm:event:giveaway:link";
    pk: string = GiveawayLink.pk;
    sk: string = uuidv4();
    eventId: string;
    giveawayId: string;

    constructor(eventId: string, giveawayId: string) {
      this.eventId = eventId;
      this.giveawayId = giveawayId;
    }
  }

  export namespace Giveaway {
    export class Config {
      static pk: string = "vlm:event:giveaway:config";
      pk: string = Config.pk;
      sk: string = uuidv4();
      name: string;
      startBuffer: number = 0;
      endBuffer: number = 0;
      claimLimits: ClaimLimits = { total: 0 };
      claimCount: number = 0;
      eventId: string;
      items: Array<string> | Array<Giveaway.Config>;
      ts?: number = Date.now();

      constructor(config: Config) {
        this.sk = config.sk || this.sk;
        this.name = config.name || this.name;
        this.startBuffer = config.startBuffer || this.startBuffer;
        this.endBuffer = config.endBuffer || this.claimCount;
        this.claimLimits = config.claimLimits || this.claimLimits;
        this.claimCount = config.claimCount || this.claimCount;
        this.eventId = config.eventId;
        this.items = config.items;
        this.ts = config.ts;
      }
    }

    export type ClaimLimits = {
      total?: number;
      hourly?: number;
      daily?: number;
      weekly?: number;
      monthly?: number;
      yearly?: number;
      perUser?: number;
      perIp?: number;
    };

    export class Claim {
      static pk: string = "vlm:event:giveaway:claim";
      pk?: string = Claim.pk;
      sk?: string = uuidv4();
      to: string;
      clientIp?: string;
      sceneId?: string;
      eventId: string;
      giveawayId: string;
      transactionId?: string;
      claimTs?: number;
      ts?: number = Date.now();

      constructor(config: Claim) {
        this.sk = config.sk || this.sk;
        this.to = config.to;
        this.clientIp = config.clientIp;
        this.sceneId = config.sceneId;
        this.eventId = config.eventId;
        this.giveawayId = config.giveawayId;
        this.sceneId = config.sceneId;
        this.claimTs = config.claimTs;
        this.ts = config.ts;
      }
    }

    export class Item {
      static pk: string = "vlm:event:giveaway:item";
      pk: string = Item.pk;
      sk?: string = uuidv4();
      name?: string;
      chain: number | string;
      contractAddress: string;
      itemId?: number | string;
      claimLimits: ClaimLimits = { total: 0, perUser: 1, perIp: 3 };
      claimCount: number;
      imageUrl?: string;
      ts?: number = Date.now();

      constructor(config: Item) {
        this.sk = config.sk || this.sk;
        this.name = config.name;
        this.chain = config.chain;
        this.contractAddress = config.contractAddress;
        this.itemId = config.itemId;
        this.claimLimits = config.claimLimits;
        this.claimCount = config.claimCount;
        this.imageUrl = config.imageUrl;
        this.ts = config.ts;
      }
    }
  }
}
