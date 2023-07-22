import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";

export namespace Accounting {
  export class Transaction {
    static pk: string = "vlm:transaction";
    pk?: string = Transaction.pk;
    sk?: string = uuidv4();
    txType: TransactionType;
    paymentType: PaymentType;
    txHash?: string;
    txAmount: number;
    complete: boolean;
    ts?: number = Date.now();

    constructor(config?: Transaction) {
      this.sk = config.sk || this.sk;
      this.txType = config.txType;
      this.paymentType = config.paymentType;
      this.txHash = config.txHash;
      this.txAmount = config.txAmount;
      this.complete = config.complete;
      this.ts = config.ts || this.ts;
    }
  }

  export enum TransactionType {
    AIRDROP,
    PURCHASE,
    START_SUBSCRIPTION,
    RENEW_SUBSCRIPTION,
    CANCEL_SUBSCRIPTION,
    REFUND,
  }

  export enum PaymentType {
    CREDIT,
    CRYPTO,
    STRIPE,
    APPLE_PAY,
    GOOGLE_PAY,
  }
}
