import { v4 as uuidv4 } from "uuid";
import { BalanceType } from "./Balance.model";
import { DateTime } from "luxon";

export namespace Promotion {
  export class Config {
    static pk: string = "vlm:promotion";
    pk: string = Config.pk;
    sk: string = uuidv4();
    name?: string;
    description?: string;
    type?: BalanceType; // Types of credits provided by the promotion
    claimLimits?: {
      total?: number;
      hourly?: number;
      daily?: number;
      weekly?: number;
      monthly?: number;
      yearly?: number;
      perUser?: number;
      perIp?: number;
    };
    promoStart?: EpochTimeStamp;
    promoEnd?: EpochTimeStamp;
    enabled?: boolean;
    ts: number = DateTime.now().toMillis();

    constructor(config: Config) {
      this.sk = config?.sk || this.sk;
      this.name = config?.name;
      this.description = config?.description;
      this.claimLimits = config?.claimLimits;
      this.type = config?.type;
      this.promoStart = config?.promoStart;
      this.promoEnd = config?.promoEnd;
      this.enabled = config?.enabled;
      this.ts = config?.ts || this.ts;
    }
  }

  export class Claim {
    static pk: string = "vlm:promotion:claim";
    pk?: string = Claim.pk;
    sk?: string = uuidv4();
    userId?: string;
    orgId?: string;
    promoId?: string;
    transactionId?: string;
    amount?: number = 0;
    ts?: number = DateTime.now().toMillis();

    constructor(config: Claim) {
      this.sk = config?.sk || this.sk;
      this.userId = config?.userId;
      this.orgId = config?.orgId;
      this.promoId = config?.promoId;
      this.transactionId = config?.transactionId;
      this.amount = config?.amount || this.amount;
      this.ts = config?.ts || this.ts;
    }
  }

  export class ClaimAggregate {
    static pk: string = "vlm:promotion:claim:aggregate";
    pk?: string = ClaimAggregate.pk;
    sk?: string = uuidv4();
    userId?: string;
    orgId?: string;
    promoId?: string;
    transactionId?: string;
    balance: number = 0;
    claims?: Array<{ claimId: string, amount: number, ts: number }> = [];
    ts?: number = DateTime.now().toMillis();

    constructor(config: ClaimAggregate) {
      this.sk = config?.sk || this.sk;
      this.userId = config?.userId;
      this.orgId = config?.orgId;
      this.promoId = config?.promoId;
      this.transactionId = config?.transactionId;
      this.balance = config?.balance || this.balance;
      this.claims = config?.claims || this.claims;
      this.ts = config?.ts || this.ts;
    }
  }
}
