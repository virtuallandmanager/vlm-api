import { v4 as uuidv4 } from "uuid";
import { Scene as BaseScene } from "./Scene.model";
import { Organization } from "./Organization.model";
import { DateTime } from "luxon";
import { Metaverse } from "./Metaverse.model";
import { Giveaway } from "./Giveaway.model";

export namespace Event {
  export class Config {
    static pk: string = "vlm:event"; // Partition Key
    pk?: string = Config?.pk; // Partition Key
    sk?: string = uuidv4(); // Sort Key
    userId?: string;
    name?: string = "New Event";
    description?: string;
    createdAt?: number = DateTime.now().toUnixInteger();
    timeZone?: string = "UTC";
    eventStart: number;
    eventEnd?: number;
    imageSrc?: string;
    location?: string;
    locationUrl?: string;
    worlds?: Array<Metaverse.World>;
    claimLimits?: Giveaway.ClaimLimits = {}; // caps total number of giveaway claims allowed for this event
    ts?: EpochTimeStamp = DateTime.now().toUnixInteger();

    constructor(config: Event.Config) {
      this.sk = config?.sk || this.sk;
      this.userId = config?.userId;
      this.name = config?.name;
      this.description = config?.description;
      this.createdAt = config?.createdAt || this.createdAt;
      this.timeZone = config?.timeZone;
      this.eventStart = config?.eventStart;
      this.eventEnd = config?.eventEnd;
      this.imageSrc = config?.imageSrc;
      this.location = config?.location;
      this.locationUrl = config?.locationUrl;
      this.worlds = config?.worlds;
      this.claimLimits = config?.claimLimits || this.claimLimits;
      this.ts = config?.ts || this.ts;
    }
  }

  export class SceneLink {
    static pk: string = "vlm:event:scene:link";
    pk: string = SceneLink.pk;
    sk: string = uuidv4();
    eventId: string;
    sceneId: string;

    constructor({ eventId, sceneId, event, scene }: { eventId?: string, sceneId?: string, event?: Config, scene?: BaseScene.Config }) {
      this.eventId = eventId || event?.sk;
      this.sceneId = sceneId || scene?.sk;
    }
  }

  export class OrgLink {
    static pk: string = "vlm:event:org:link";
    pk: string = OrgLink.pk;
    sk: string = uuidv4();
    eventId: string;
    orgId: string;

    constructor({ eventId, orgId, event, org }: { eventId?: string, orgId?: string, event?: Config, org?: Organization.Account }) {
      this.eventId = eventId || event?.sk;
      this.orgId = orgId || org?.sk;
    }
  }

  export class GiveawayLink {
    static pk: string = "vlm:event:giveaway:link";
    pk: string = GiveawayLink.pk;
    sk: string = uuidv4();
    eventId: string;
    giveawayId: string;

    constructor({ eventId, giveawayId, event, giveaway }: { eventId?: string, giveawayId?: string, event?: Config, giveaway?: Giveaway.Config }) {
      this.eventId = eventId || event?.sk;
      this.giveawayId = giveawayId || giveaway?.sk;
    }
  }
}
