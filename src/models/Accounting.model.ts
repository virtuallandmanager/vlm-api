import { v4 as uuidv4 } from 'uuid'
import { BalanceType } from './Balance.model'
import { DateTime } from 'luxon'

export namespace Accounting {
  export class Transaction {
    static pk: string = 'vlm:transaction'
    pk?: string = Transaction.pk
    sk?: string = uuidv4()
    txType: TransactionType
    paymentType?: PaymentType
    blockchainTxIds?: string[] // Transaction hash of crypto transactions
    txAmount?: number // The amount of the transaction
    paymentDetail?: PaymentDetail // Additional payment details depending on the payment type
    promoId?: string // The ID of the promotion, if applicable
    giveawayId?: string // The ID of the giveaway, if applicable
    claimId?: string // The ID of the claim, if applicable
    userId?: string // The ID of the user, if applicable
    status?: TransactionStatus = TransactionStatus.PENDING// The status of the transaction
    ts?: number = DateTime.now().toMillis()

    constructor(config?: Transaction) {
      this.sk = config?.sk || this.sk
      this.txType = config?.txType
      this.paymentType = config?.paymentType
      this.blockchainTxIds = config?.blockchainTxIds
      this.txAmount = config?.txAmount
      this.paymentDetail = config?.paymentDetail
      this.promoId = config?.promoId
      this.claimId = config?.claimId
      this.userId = config?.userId
      this.status = config?.status
      this.ts = config?.ts || this.ts
    }
  }

  export class CreditAllocation {
    static pk: string = 'vlm:allocation'
    pk?: string = CreditAllocation.pk
    sk?: string = uuidv4() // Unique identifier for each allocation
    userId: string // ID of the user who allocated the credits
    giveawayId?: string // ID of the giveaway to which credits are allocated
    allocatedCredits?: number // Number of credits allocated
    balanceType?: BalanceType // Type of credits allocated
    ts?: EpochTimeStamp = DateTime.now().toMillis()

    constructor(config: Partial<CreditAllocation>) {
      Object.assign(this, config)
      this.sk = config?.sk || this.sk
      this.ts = config?.ts || this.ts
    }
  }

  export class Minter {
    static pk: string = 'vlm:minter'
    pk?: string = Minter.pk
    sk?: string = uuidv4()
    address: string
    active?: boolean = true
    createdAt?: number = DateTime.now().toMillis()
    ts?: EpochTimeStamp = DateTime.now().toMillis()

    constructor(config: Partial<Minter>) {
      Object.assign(this, config)
      this.sk = config?.sk || this.sk
      this.ts = config?.ts || this.ts
    }
  }

  export enum TransactionType {
    CREDIT_PURCHASE = 'credit_purchase',
    ITEM_GIVEAWAY = 'item_giveaway',
    ALLOCATED_CREDITS = 'allocated_credits',
    CLAIMED_PROMOTION = 'claimed_promotion',
    START_SUBSCRIPTION = 'start_subscription',
    RENEW_SUBSCRIPTION = 'renew_subscription',
    CANCEL_SUBSCRIPTION = 'cancel_subscription',
    REFUND = 'purchase_refund',
    SET_MINTER_RIGHTS = 'set_minter_rights',
  }

  export enum PaymentType {
    CREDITS = 'credits',
    CRYPTO = 'crypto',
    STRIPE = 'stripe',
    APPLE_PAY = 'apple_pay',
    GOOGLE_PAY = 'google_pay',
  }

  export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
  }

  export class PaymentDetail {
    cryptoCurrency?: string // The type of cryptocurrency used, if applicable
    cryptoAddress?: string // The address to which the cryptocurrency was sent, if applicable
    stripePaymentIntentId?: string // Stripe PaymentIntent ID, if applicable
    creditCardLast4?: string // Last 4 digits of the credit card, for reference
    // Add any other relevant fields depending on your requirements

    constructor(config?: PaymentDetail) {
      this.cryptoCurrency = config?.cryptoCurrency
      this.cryptoAddress = config?.cryptoAddress
      this.stripePaymentIntentId = config?.stripePaymentIntentId
      this.creditCardLast4 = config?.creditCardLast4
    }
  }
}
