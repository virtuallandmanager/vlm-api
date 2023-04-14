import { v4 as uuidv4 } from "uuid";

export namespace Giveaway {
  export class Config {
    pk: string = "vlm:giveaway"; // Partition Key
    sk: string = uuidv4();
    startBuffer: number = 0;
    endBuffer: number = 0;
    claimLimits: ClaimLimits = { total: 0 };
    claimCount: number = 0;
    eventId: string;
    items: Array<string>; // LSI

    constructor(config: Config) {
      this.sk = config.sk || this.sk;
      this.startBuffer = config.startBuffer || this.startBuffer;
      this.endBuffer = config.endBuffer || this.claimCount;
      this.claimLimits = config.claimLimits || this.claimLimits;
      this.claimCount = config.claimCount || this.claimCount;
      this.eventId = config.eventId;
      this.items = config.items;
    }
  }

  export type ClaimLimits = {
    total?: number;
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
    yearly?: number;
  };

  export class Claim {
    static pk: string = "vlm:giveaway:claim";
    pk: string = Claim.pk;
    sk: string = uuidv4();
    to: string;
    eventId: number;
    giveawayId: number;
    startBuffer: number;
    endBuffer: number;
    transactionId?: string;
    [key: string]: any;

    constructor(config: ClaimConfig) {
      Object.keys(config).forEach((key: string) => {
        this[key] = config[key];
      });
    }
  }

  export type ClaimConfig = {
    pk?: string;
    sk?: string;
    to?: string;
    eventId?: number;
    giveawayId?: number;
    startBuffer?: number;
    endBuffer?: number;
    transactionId?: string;
    [key: string]: any;
  };

  export class Item {
    static pk: string = "vlm:event:giveaway:item";
    pk: string = Item.pk;
    sk: string = uuidv4();
    chain: number | string;
    contractAddress: string;
    itemId: number | string;
    claimLimit: number;
    claimCount: number;
    event: string;
    [key: string]: any;
    constructor(config: ItemConfig) {
      Object.keys(config).forEach((key: string) => {
        this[key] = config[key];
      });
    }
  }

  export type ItemConfig = {
    chain: number | string;
    contractAddress: string;
    itemId: number | string;
    claimLimit: number;
    claimCount: number;
    eventId: string;
    [key: string]: any;
  };
}
