import { v4 as uuidv4 } from "uuid";

export class Transaction {
  static pk: string = "vlm:transaction";
  pk: string = Transaction.pk;
  sk: string = uuidv4();
  type: TransactionType;
  txHash?: string;
  complete: boolean;

  constructor(config?: Transaction) {
    this.sk = config.sk || this.sk;
    this.type = config.type;
    this.txHash = config.txHash;
    this.complete = config.complete;
  }
}

enum TransactionType {
  AIRDROP,
  PURCHASE,
  START_SUBSCRIPTION,
  RENEW_SUBSCRIPTION,
  CANCEL_SUBSCRIPTION,
  REFUND,
}
