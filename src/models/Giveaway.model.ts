import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";

export namespace Giveaway {
  export class Config {
    static pk: string = "vlm:event:giveaway";
    pk?: string = Config?.pk;
    sk?: string = uuidv4();
    name?: string = "New Giveaway";
    description?: string = "";
    userId?: string;
    startBuffer?: number = 0;
    endBuffer?: number = 0;
    claimLimits?: ClaimLimits = { total: 0 };
    claimCount?: number = 0;
    eventId?: string;
    paused?: boolean;
    items?: Array<string | Item> = [];
    allocatedCredits?: number = 0;
    createdAt?: number = DateTime.now().toUnixInteger();
    ts?: EpochTimeStamp = Date.now();

    constructor(config: Partial<Config> = {}) {
      this.sk = config?.sk || this.sk;
      this.name = config?.name || this.name;
      this.description = config?.description;
      this.userId = config?.userId;
      this.startBuffer = config?.startBuffer || this.startBuffer;
      this.endBuffer = config?.endBuffer || this.claimCount;
      this.claimLimits = config?.claimLimits || this.claimLimits;
      this.claimCount = config?.claimCount || this.claimCount;
      this.eventId = config?.eventId;
      this.paused = config?.paused;
      this.allocatedCredits = config?.allocatedCredits || this.allocatedCredits;
      this.items = config?.items || this.items;
      this.createdAt = config?.createdAt;
      this.ts = config?.ts;
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
    queued?: boolean = false;
    analyticsRecord?: string;
    ts?: EpochTimeStamp = Date.now();

    constructor(config: Partial<Claim> = {}) {
      this.sk = config?.sk || this.sk;
      this.to = config?.to;
      this.clientIp = config?.clientIp;
      this.eventId = config?.eventId;
      this.giveawayId = config?.giveawayId;
      this.sceneId = config?.sceneId;
      this.claimTs = config?.claimTs;
      this.analyticsRecord = config?.analyticsRecord;
      this.ts = config?.ts;
    }
  }

  export class Item {
    static pk: string = "vlm:event:giveaway:item";
    pk?: string = Item.pk;
    sk?: string = uuidv4();
    name?: string;
    chain?: number | string = 137;
    contractAddress: string;
    itemId: number | string;
    claimLimits?: ClaimLimits = { total: 0, perUser: 1, perIp: 3 };
    claimCount?: number;
    rarity?: string;
    category?: string;
    imageSrc?: string;
    ts?: EpochTimeStamp = Date.now();

    constructor(config: Partial<Item> = {}) {
      this.sk = config?.sk || this.sk;
      this.name = config?.name;
      this.chain = config?.chain;
      this.contractAddress = config?.contractAddress;
      this.itemId = config?.itemId;
      this.claimLimits = config?.claimLimits || this.claimLimits;
      this.claimCount = config?.claimCount || 0;
      this.rarity = config?.rarity;
      this.category = config?.category;
      this.imageSrc = config?.imageSrc;
      this.ts = config?.ts;
    }
  }

  export class ClaimResponse {
    static pk: string = "vlm:event:giveaway:claim:response";
    pk?: string = ClaimResponse.pk;
    sk?: string = uuidv4();
    headline?: string;
    message?: string;
    messageOptions?: MessageOptions;
    type: ClaimResponseType;
    reason?: ClaimRejection;
    ts?: EpochTimeStamp = Date.now();

    constructor(config: Partial<ClaimResponse> = {}) {
      this.sk = config?.sk || this.sk;
      this.headline = config?.headline;
      this.message = config?.message;
      this.messageOptions = config?.messageOptions;
      this.ts = config?.ts;
    }
  }

  export enum ClaimRejection {
    PAUSED,
    BEFORE_EVENT_START,
    AFTER_EVENT_END,
    EXISTING_WALLET_CLAIM,
    SUPPLY_DEPLETED,
    INAUTHENTIC,
    SUSPICIOUS,
    NO_LINKED_EVENTS,
    OVER_IP_LIMIT,
    OVER_DAILY_LIMIT,
    OVER_WEEKLY_LIMIT,
    OVER_MONTHLY_LIMIT,
    OVER_YEARLY_LIMIT,
    OVER_LIMIT,
  }

  export enum ClaimResponseType {
    CLAIM_ACCEPTED,
    CLAIM_DENIED,
    CLAIM_IN_PROGRESS,
    CLAIM_SERVER_ERROR,
  }

  type MessageOptions = {
    color: string;
    fontSize: number;
  };

  export interface SetMinterRequest {
    contracts: string[];
    ids: number[];
    minter: string;
  }
}
