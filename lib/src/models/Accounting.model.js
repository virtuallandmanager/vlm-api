"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accounting = void 0;
const uuid_1 = require("uuid");
var Accounting;
(function (Accounting) {
    class Transaction {
        constructor(config) {
            this.pk = Transaction.pk;
            this.sk = (0, uuid_1.v4)();
            this.ts = Date.now();
            this.sk = config.sk || this.sk;
            this.txType = config.txType;
            this.paymentType = config.paymentType;
            this.txHash = config.txHash;
            this.txAmount = config.txAmount;
            this.complete = config.complete;
            this.ts = config.ts || this.ts;
        }
    }
    Transaction.pk = "vlm:transaction";
    Accounting.Transaction = Transaction;
    let TransactionType;
    (function (TransactionType) {
        TransactionType[TransactionType["AIRDROP"] = 0] = "AIRDROP";
        TransactionType[TransactionType["PURCHASE"] = 1] = "PURCHASE";
        TransactionType[TransactionType["START_SUBSCRIPTION"] = 2] = "START_SUBSCRIPTION";
        TransactionType[TransactionType["RENEW_SUBSCRIPTION"] = 3] = "RENEW_SUBSCRIPTION";
        TransactionType[TransactionType["CANCEL_SUBSCRIPTION"] = 4] = "CANCEL_SUBSCRIPTION";
        TransactionType[TransactionType["REFUND"] = 5] = "REFUND";
    })(TransactionType = Accounting.TransactionType || (Accounting.TransactionType = {}));
    let PaymentType;
    (function (PaymentType) {
        PaymentType[PaymentType["CREDIT"] = 0] = "CREDIT";
        PaymentType[PaymentType["CRYPTO"] = 1] = "CRYPTO";
        PaymentType[PaymentType["STRIPE"] = 2] = "STRIPE";
        PaymentType[PaymentType["APPLE_PAY"] = 3] = "APPLE_PAY";
        PaymentType[PaymentType["GOOGLE_PAY"] = 4] = "GOOGLE_PAY";
    })(PaymentType = Accounting.PaymentType || (Accounting.PaymentType = {}));
})(Accounting = exports.Accounting || (exports.Accounting = {}));
