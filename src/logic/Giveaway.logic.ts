import { DateTime } from 'luxon'
import { GiveawayDbManager } from '../dal/Giveaway.data'
import { Accounting } from '../models/Accounting.model'
import { Analytics } from '../models/Analytics.model'
import { Giveaway } from '../models/Giveaway.model'
import { User } from '../models/User.model'
import { Event } from '../models/Event.model'
import { EventDbManager } from '../dal/Event.data'
import { EventManager } from './Event.logic'

export abstract class GiveawayManager {
  static create: CallableFunction = async (giveawayConfig: Giveaway.Config) => {
    const giveaway = new Giveaway.Config(giveawayConfig)
    giveaway.createdAt = DateTime.now().toMillis()
    return await GiveawayDbManager.put(giveaway)
  }

  static addItem: CallableFunction = async (giveaway: Giveaway.Config, giveawayItem: Giveaway.Item) => {
    const updatedGiveaway = await GiveawayDbManager.addItem({ giveaway, giveawayItem })
    const fullGiveawayItems = await GiveawayManager.getItemsForGiveaway(updatedGiveaway.items)
    return {
      ...updatedGiveaway,
      items: fullGiveawayItems,
    }
  }

  static addClaim: CallableFunction = async (
    analyticsAction: Analytics.Session.Action,
    claim: Giveaway.Claim,
    transaction?: Accounting.Transaction
  ) => {
    return await GiveawayDbManager.addClaim(analyticsAction, claim, transaction)
  }

  static update: CallableFunction = async (giveaway: Giveaway.Config) => {
    return await GiveawayDbManager.put(giveaway)
  }

  static get: CallableFunction = async (giveawayConfig?: Giveaway.Config) => {
    const giveaway = new Giveaway.Config(giveawayConfig)
    return await GiveawayDbManager.get(giveaway)
  }

  static getById: CallableFunction = async (sk: string) => {
    return await GiveawayDbManager.getById(sk)
  }

  static getByIds: CallableFunction = async (sk: string[]) => {
    return await GiveawayDbManager.getByIds(sk)
  }

  static getAllLegacy: CallableFunction = async (chunkCb: CallableFunction) => {
    return await GiveawayDbManager.getAllLegacy(chunkCb)
  }

  static getItemsForGiveaway: CallableFunction = async (items?: string[]) => {
    const giveawayItems: string[] = []
    // check if the giveaway has items that aren't strings
    items?.forEach((item: string | Giveaway.Item) => {
      if (typeof item === 'string') {
        giveawayItems.push(item)
      } else {
        giveawayItems.push(item.sk)
      }
    })
    return await GiveawayDbManager.getItemsByIds(giveawayItems)
  }

  static getGiveawaysForUser: CallableFunction = async (user: User.Account[]) => {
    const giveaways = await GiveawayDbManager.getAllForUser(user)
    if (giveaways.length === 0) {
      return giveaways
    }
    const giveawaysWithItems = await Promise.all(
      giveaways.map(async (giveaway: Giveaway.Config) => {
        const fullGiveawayItems = await GiveawayManager.getItemsForGiveaway(giveaway.items)
        return {
          ...giveaway,
          items: fullGiveawayItems || [],
        }
      })
    )
    return giveawaysWithItems
  }

  static getItemsForGiveaways: CallableFunction = async (giveaways: Giveaway.Config[]) => {
    const giveawaysWithItems = await Promise.all(
      giveaways.map(async (giveaway: Giveaway.Config) => {
        const fullGiveawayItems = await GiveawayManager.getItemsForGiveaway(giveaway.items)
        return fullGiveawayItems || []
      })
    )
    return giveawaysWithItems.flat()
  }

  static getGiveawaysForSceneEvents: CallableFunction = async (sceneId: string) => {
    const events = await EventManager.getOngoingEventsBySceneId(sceneId)
    if (events.length === 0) {
      return []
    }
    const eventIds = events.map((event: Event.Config) => event.sk)
    const giveaways = await EventDbManager.getLinkedGiveawaysByIds(eventIds)
    if (giveaways.length === 0) {
      return []
    }
    return giveaways
  }

  static allocateCreditsToGiveaway: CallableFunction = async ({
    balance,
    giveaway,
    amount,
  }: {
    balance: User.Balance
    giveaway: Giveaway.Config
    amount: number
  }) => {
    const allocation = new Accounting.CreditAllocation({
      userId: balance.userId,
      allocatedCredits: amount,
      giveawayId: giveaway.sk,
      balanceType: balance.type,
    })
    return await GiveawayDbManager.allocateCreditsToGiveaway({ balance, allocation, giveaway })
  }

  static checkForExistingClaim: CallableFunction = async ({
    user,
    sceneId,
    giveawayId,
  }: {
    session: Analytics.Session.Config
    user: User.Account
    sceneId: string
    giveawayId: string
    itemId: string
  }) => {
    const claims = await GiveawayDbManager.getUserClaimsForGiveaway({ user, sceneId, giveawayId })
    if (!claims || claims.length === 0) {
      return false
    }
    // check for claims from the current giveaway
    const currentGiveawayClaims = claims.filter((claim: Giveaway.Claim) => claim.giveawayId === giveawayId)
    if (!currentGiveawayClaims || currentGiveawayClaims.length === 0) {
      return false
    }
    const complete = currentGiveawayClaims.every((claim: Giveaway.Claim) => claim.status === Giveaway.ClaimStatus.COMPLETE)

    return complete ? Giveaway.ClaimStatus.COMPLETE : Giveaway.ClaimStatus.PENDING
  }

  // UNDERSTANDING THE GIVEAWAY CLAIM PROCESS
  // 1. Check for existing claim
  // 2. Find events for sceneId
  // 3. Sort events by start time
  // 4. Get giveaways for events
  // 5. Check if giveaway is in linked giveaways
  // 6. Check if giveaway is paused
  // 7. Check if event has not yet started
  // 8. Check if event is over
  // 9. Create analytics action - An Analytics Action is a record of a user's claim displayed in the analytics dashboard
  // 10. Create transaction - A VLM Transaction keeps track of all the blockchain transactions that are created for a claim
  // 11. Create claim

  static claimGiveawayItem: CallableFunction = async ({
    session,
    user,
    sceneId,
    giveawayId,
  }: {
    session: Analytics.Session.Config
    user: User.Account
    sceneId: string
    giveawayId: string
  }) => {
    //check for existing claim
    const existingClaim = await GiveawayManager.checkForExistingClaim({ session, user, sceneId, giveawayId })

    if (existingClaim && existingClaim === Giveaway.ClaimStatus.COMPLETE) {
      return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.CLAIM_COMPLETE }
    } else if (existingClaim && existingClaim === Giveaway.ClaimStatus.PENDING) {
      return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.EXISTING_WALLET_CLAIM }
    }

    // find events for sceneId
    const events = await EventDbManager.getLinkedEventsBySceneId(sceneId)
    if (events.length === 0) {
      return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.NO_LINKED_EVENTS }
    }

    const eventIds = events.map((event: Event.Config) => event.sk)

    // sort events by start time
    eventIds.sort((a: string, b: string) => {
      const eventA = events.find((event: Event.Config) => event.sk === a)
      const eventB = events.find((event: Event.Config) => event.sk === b)
      return eventA.eventStart - eventB.eventStart
    })

    // get giveaways for events
    const linkedGiveaways = await EventDbManager.getLinkedGiveawaysByIds(eventIds)

    // check if giveaway is in linked giveaways
    const linkedGiveawaysFlat = linkedGiveaways.flat()
    const linkedGiveawaysFiltered = linkedGiveawaysFlat.filter((giveaway: Event.GiveawayLink) => giveaway.giveawayId === giveawayId)

    if (linkedGiveawaysFiltered.length === 0) {
      return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.NO_LINKED_EVENTS }
    }

    // check if giveaway is paused
    const giveaway = linkedGiveawaysFiltered[0]
    if (giveaway.paused) {
      return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.PAUSED }
    }

    const now = DateTime.now().toMillis()
    const event = events.find((event: Event.Config) => event.sk === giveaway.eventId)
    // check if event has not yet started
    if (event.eventStart > now) {
      return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.BEFORE_EVENT_START }
    }
    // check if event is over
    if (event.eventEnd < now) {
      return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.AFTER_EVENT_END }
    }

    const analyticsAction = new Analytics.Session.Action({
      name: 'Giveaway Claimed',
      sessionId: session.sk,
      sceneId,
      origin: session.location,
      metadata: { eventId: eventIds[0], eventName: event.name, giveawayId, giveawayName: giveaway.name },
    })

    const transaction = new Accounting.Transaction({
      userId: session.connectedWallet,
      txType: Accounting.TransactionType.ITEM_GIVEAWAY,
      status: Accounting.TransactionStatus.PENDING,
    })

    const claim = new Giveaway.Claim({
      to: session.connectedWallet,
      clientIp: session.clientIp,
      sceneId,
      status: Giveaway.ClaimStatus.PENDING,
      analyticsRecordId: analyticsAction.sk,
      transactionId: transaction.sk,
      eventId: eventIds[0],
      userId: user.sk,
      giveawayId: giveawayId,
    })

    transaction.claimId = claim.sk

    await this.addClaim(analyticsAction, claim, transaction)

    return { responseType: Giveaway.ClaimResponseType.CLAIM_ACCEPTED }
  }
}
