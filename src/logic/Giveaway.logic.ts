import { DateTime } from 'luxon'
import { GiveawayDbManager } from '../dal/Giveaway.data'
import { Accounting } from '../models/Accounting.model'
import { Analytics } from '../models/Analytics.model'
import { Giveaway } from '../models/Giveaway.model'
import { User } from '../models/User.model'
import { Event } from '../models/Event.model'
import { EventDbManager } from '../dal/Event.data'
import { EventManager } from './Event.logic'
import { AdminLogManager } from './ErrorLogging.logic'

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

  static addItems: CallableFunction = async (giveaway: Giveaway.Config, giveawayItems: Giveaway.Item[]) => {
    try {
      const updatedGiveaway = await GiveawayDbManager.addItems({ giveaway, giveawayItems })
      const fullGiveawayItems = await GiveawayManager.getItemsForGiveaway(updatedGiveaway.items)
      return {
        ...updatedGiveaway,
        items: fullGiveawayItems,
      }
    } catch (error) {
      AdminLogManager.logError('ADD ITEMS ERROR', { error })
      return
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

  static getById: CallableFunction = async (sk: string): Promise<Giveaway.Config> => {
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

  static linkEvents: CallableFunction = async (giveawayId: string, eventIds: string[]) => {
    const existingLinks = await GiveawayDbManager.getLinkedEventsById(giveawayId)
    const linkedEventIds = existingLinks.map((link: Event.GiveawayLink) => link.eventId)

    const linksToAdd = eventIds
      .map((eventId: string) => {
        if (linkedEventIds.includes(eventId)) {
          return
        }
        return new Event.GiveawayLink({ giveawayId, eventId })
      })
      .filter((x) => x)
    const linksToRemove = existingLinks.filter((link: Event.GiveawayLink) => !eventIds.includes(link.eventId))
    if (linksToAdd.length === 0 && linksToRemove.length === 0 && existingLinks.length > 0) {
      return existingLinks
    }
    return await GiveawayDbManager.updateEventLinks(giveawayId, linksToAdd, linksToRemove)
  }

  static linkEvent: CallableFunction = async (eventId: string, giveawayId: string) => {
    // check if the giveaway is already linked to this event
    const existingLinks = await EventDbManager.getLinkedGiveawaysById(eventId)
    const existingLink = existingLinks.find((link: Event.GiveawayLink) => link.giveawayId === giveawayId)
    if (existingLink) {
      return existingLink
    }
    const link = new Event.GiveawayLink({ eventId, giveawayId })
    return await EventDbManager.linkGiveaway(link)
  }

  static unlinkGiveaway: CallableFunction = async (eventId: string, giveawayId: string) => {
    const existingLinks = await EventDbManager.getLinkedGiveawaysById(eventId)
    const filteredLink = existingLinks.find((link: Event.GiveawayLink) => link.giveawayId === giveawayId)
    await EventDbManager.unlinkGiveaway(filteredLink.sk)
    return filteredLink.sk
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
    return giveawaysWithItems.flat() || []
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
    giveawayId,
    amount,
  }: {
    balance: User.Balance
    giveaway?: Giveaway.Config
    giveawayId?: string
    amount: number
  }) => {
    const allocation = new Accounting.CreditAllocation({
      userId: balance.userId,
      allocatedCredits: amount,
      giveawayId: giveaway?.sk || giveawayId,
      balanceType: balance.type,
    })
    return await GiveawayDbManager.allocateCreditsToGiveaway({ balance, allocation })
  }

  static deallocateCreditsFromGiveaway: CallableFunction = async ({
    balance,
    giveaway,
    giveawayId,
    amount,
  }: {
    balance: User.Balance
    giveaway?: Giveaway.Config
    giveawayId?: string
    amount: number
  }) => {
    const allocation = new Accounting.CreditAllocation({
      userId: balance.userId,
      giveawayId: giveaway?.sk || giveawayId,
      allocatedCredits: -amount,
      balanceType: balance.type,
    })
    // deallocating credits from the giveaway is basically just allocating negative credits.
    return await GiveawayDbManager.allocateCreditsToGiveaway({ balance, allocation })
  }

  static checkForExistingClaim: CallableFunction = async ({
    session,
    user,
    sceneId,
    giveaway,
    itemId,
  }: {
    session: Analytics.Session.Config
    user: User.Account
    sceneId: string
    giveaway: Giveaway.Config
    itemId: string
  }) => {
    const giveawayId = giveaway.sk
    const userClaims = await GiveawayDbManager.getUserClaimsForGiveaway({ user, sceneId, giveawayId })
    const walletClaims = await GiveawayDbManager.getWalletClaimsForGiveaway({ user, sceneId, giveawayId })
    const ipClaims = await GiveawayDbManager.getIpClaimsForGiveaway({ user, sceneId, giveawayId })
    if (ipClaims.length >= giveaway.claimLimits?.perIp) {
      return Giveaway.ClaimRejection.OVER_IP_LIMIT
    }

    const claims = [...userClaims, ...walletClaims]
    if (!claims || claims.length === 0) {
      return false
    }
    // check for claims from the current giveaway
    const currentGiveawayClaims = claims.filter((claim: Giveaway.Claim) => claim.giveawayId === giveawayId)
    if (!currentGiveawayClaims || currentGiveawayClaims.length === 0) {
      return false
    }
    const complete = currentGiveawayClaims.every((claim: Giveaway.Claim) => claim.status === Giveaway.ClaimStatus.COMPLETE)

    return complete ? Giveaway.ClaimRejection.CLAIM_COMPLETE : Giveaway.ClaimRejection.EXISTING_WALLET_CLAIM
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
    try {
      ///// GIVEAWAY VERIFICATION /////
      //get giveaway data
      const giveaway = await GiveawayManager.getById(giveawayId),
        giveawayItems = await GiveawayManager.getItemsForGiveaway(giveaway.items),
        // TODO: FIX THIS ////////////////
        // temporary workaroud to the fact that we have no way to set a claim limit for the whole giveaway
        // just using the limits from the first item we find for now.
        // this should be removed once we have a way to set the claim limits for the whole giveaway
        // and claim items individually for a giveaway

        claimLimits = giveawayItems.find((item: Giveaway.Item) => item.sk === giveawayId)?.claimLimits
      giveaway.claimLimits = claimLimits || { total: 0, perUser: 1, perIp: 3 }

      ///////////////////////////

      if (!giveaway) {
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.SUSPICIOUS }
      }
      ///// END GIVEAWAY VERIFICATION /////

      ///// GENERAL DENIALS /////
      // check if giveaway is paused or over the total limit
      if (giveaway.paused) {
        AdminLogManager.logGiveawayInfo('DENIED - GIVEAWAY PAUSED', {
          userName: user.displayName,
          userId: user.sk,
          sceneId,
          to: session.connectedWallet.toLowerCase(),
          giveawayId,
          giveaway,
        })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.PAUSED }
      }

      if (giveaway?.claimLimits?.total && giveaway.claimCount > giveaway.claimLimits.total) {
        AdminLogManager.logGiveawayInfo('DENIED - OVER CLAIM LIMITS', { sceneId, giveawayId })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.OVER_LIMIT }
      }
      ///// END GENERAL DENIALS /////

      ////// USER & IP LIMITATIONS ///////
      // get existing claims
      const userClaims = await GiveawayDbManager.getUserClaimsForGiveaway({ user, sceneId, giveawayId })
      const ipClaims = await GiveawayDbManager.getIpClaimsForGiveaway({ user, sceneId, giveawayId })

      if (giveaway?.claimLimits?.perUser && userClaims.length >= giveaway.claimLimits.perUser) {
        AdminLogManager.logGiveawayInfo(`DENIED - OVER USER'S CLAIM LIMIT`, { sceneId, giveawayId, giveaway, userClaims })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.CLAIM_COMPLETE }
      } else if (ipClaims.length >= giveaway.claimLimits?.perIp) {
        AdminLogManager.logGiveawayInfo('DENIED - OVER IP LIMIT', {
          userName: user.displayName,
          userId: user.sk,
          sceneId,
          to: session.connectedWallet.toLowerCase(),
          giveawayId,
        })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.OVER_IP_LIMIT }
      }
      /////// END USER & IP VERIFICATION ///////

      ////// PERDIODIC CLAIM LIMITATIONS ///////
      // check if claim is allowed per the claim limits
      let limitType, claimsForPastDay, claimsForPastWeek, claimsForPastMonth, claimsForPastYear

      if (giveaway?.claimLimits?.daily) {
        claimsForPastDay = await GiveawayManager.getClaimsForPastDay(sceneId, giveawayId)
        limitType = claimsForPastDay >= giveaway.claimLimits.daily ? 'DAILY' : null
      }

      if (!limitType && giveaway?.claimLimits?.weekly) {
        claimsForPastWeek = await GiveawayManager.getClaimsForPastWeek(sceneId, giveawayId)
        limitType = claimsForPastWeek >= giveaway.claimLimits.weekly ? 'WEEKLY' : null
      }

      if (!limitType && giveaway?.claimLimits?.monthly) {
        claimsForPastMonth = await GiveawayManager.getClaimsForPastMonth(sceneId, giveawayId)
        limitType = claimsForPastMonth >= giveaway.claimLimits.monthly ? 'MONTHLY' : null
      }

      if (!limitType && giveaway?.claimLimits?.yearly) {
        claimsForPastYear = await GiveawayManager.getClaimsForPastYear(sceneId, giveawayId)
        limitType = claimsForPastYear >= giveaway.claimLimits.yearly ? 'YEARLY' : null
      }

      if (limitType === 'DAILY') {
        AdminLogManager.logGiveawayInfo('DENIED - GIVEAWAY IS OVER DAILY CLAIM LIMITS', { sceneId, giveawayId })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.OVER_DAILY_LIMIT }
      } else if (limitType === 'WEEKLY') {
        AdminLogManager.logGiveawayInfo('DENIED - GIVEAWAY IS OVER WEEKLY CLAIM LIMITS', { sceneId, giveawayId })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.OVER_WEEKLY_LIMIT }
      } else if (limitType === 'MONTHLY') {
        AdminLogManager.logGiveawayInfo('DENIED - GIVEAWAY IS OVER MONTHLY CLAIM LIMITS', { sceneId, giveawayId })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.OVER_MONTHLY_LIMIT }
      } else if (limitType === 'YEARLY') {
        AdminLogManager.logGiveawayInfo('DENIED - GIVEAWAY IS OVER YEARLY CLAIM LIMITS', { sceneId, giveawayId })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.OVER_YEARLY_LIMIT }
      }
      /////// END CLAIM LIMITING ///////

      /////// EVENT VERFICIATION ///////
      // find events for sceneId
      const events = await EventDbManager.getLinkedEventsBySceneId(sceneId)

      if (events.length === 0) {
        AdminLogManager.logGiveawayInfo('DENIED - NO LINKED EVENTS', {
          userName: user.displayName,
          userId: user.sk,
          sceneId,
          to: session.connectedWallet.toLowerCase(),
          giveawayId,
        })
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
      const linkedGiveawaysFiltered = linkedGiveawaysFlat.filter((link: Event.GiveawayLink) => link.giveawayId === giveawayId)

      if (linkedGiveawaysFiltered.length === 0) {
        AdminLogManager.logGiveawayInfo('DENIED - NO LINKED GIVEAWAYS', {
          userName: user.displayName,
          userId: user.sk,
          sceneId,
          to: session.connectedWallet.toLowerCase(),
          giveawayId,
        })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.NO_LINKED_EVENTS }
      }

      const now = DateTime.now().toMillis()
      const ongoingEvents = events.filter((e: Event.Config) => e?.eventStart < now && e?.eventEnd > now)
      const event = ongoingEvents.length === 1 ? ongoingEvents[0] : null // see if there's only one ongoing event

      if (!event) {
        const response = this.noOngoingEventDenialError({ events, user, giveaway, sceneId, session, giveawayId })
        return response
      }
      /////// END EVENT VERFICIATION ///////

      /////// CLAIM ACCEPTANCE ///////
      const analyticsAction = new Analytics.Session.Action({
        name: 'Giveaway Claimed',
        sessionId: session.sk,
        sceneId,
        origin: session.location,
        metadata: { eventId: eventIds[0], eventName: event?.name, giveawayId, giveawayName: giveaway?.name },
      })

      const transaction = new Accounting.Transaction({
        userId: user.sk,
        txType: Accounting.TransactionType.ITEM_GIVEAWAY,
        status: Accounting.TransactionStatus.PENDING,
      })

      const claim = new Giveaway.Claim({
        to: session.connectedWallet.toLowerCase(),
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

      AdminLogManager.logGiveawayInfo(`CLAIM ACCEPTED! - ${user.displayName}`, {
        eventName: event.displayName,
        eventId: event.sk,
        userName: user.displayName,
        userId: user.sk,
        sceneId,
        to: session.connectedWallet.toLowerCase(),
        giveawayName: giveaway.name,
        transactionId: transaction.sk,
        analyticsRecordId: analyticsAction.sk,
        time: DateTime.now().toISO(),
      })

      return { responseType: Giveaway.ClaimResponseType.CLAIM_ACCEPTED }
      /////// END CLAIM ACCEPTANCE //////
    } catch (error) {
      AdminLogManager.logError('CLAIM ERROR', { error })
      return { responseType: Giveaway.ClaimResponseType.CLAIM_SERVER_ERROR, reason: error }
    }
  }

  static getClaimsForPastDay: CallableFunction = async (sceneId: string, giveawayId: string) => {
    return await GiveawayDbManager.getClaimCountForScene(sceneId, giveawayId, DateTime.now().minus({ days: 1 }).toMillis(), DateTime.now().toMillis())
  }

  static getClaimsForPastWeek: CallableFunction = async (sceneId: string, giveawayId: string) => {
    return await GiveawayDbManager.getClaimCountForScene(
      sceneId,
      giveawayId,
      DateTime.now().minus({ weeks: 1 }).toMillis(),
      DateTime.now().toMillis()
    )
  }

  static getClaimsForPastMonth: CallableFunction = async (sceneId: string, giveawayId: string) => {
    return await GiveawayDbManager.getClaimCountForScene(
      sceneId,
      giveawayId,
      DateTime.now().minus({ months: 1 }).toMillis(),
      DateTime.now().toMillis()
    )
  }

  static getClaimsForPastYear: CallableFunction = async (sceneId: string, giveawayId: string) => {
    return await GiveawayDbManager.getClaimCountForScene(
      sceneId,
      giveawayId,
      DateTime.now().minus({ years: 1 }).toMillis(),
      DateTime.now().toMillis()
    )
  }

  static getActiveMintingWallets: CallableFunction = async () => {
    return await GiveawayDbManager.getActiveMintingWallets()
  }

  static getRandomMintingWallet: CallableFunction = async () => {
    const activeWallets = await this.getActiveMintingWallets()

    return activeWallets[Math.floor(Math.random() * activeWallets.length)]
  }

  static getMintingWalletById: CallableFunction = async (walletId: string) => {
    const activeWallets = await this.getActiveMintingWallets(walletId)

    return activeWallets[Math.floor(Math.random() * activeWallets.length)]
  }

  static setGiveawayMinter: CallableFunction = async (giveaway: Giveaway.Config, minterObj: Giveaway.MintingWallet) => {
    return await GiveawayDbManager.setGiveawayMinter(giveaway, minterObj)
  }

  static noOngoingEventDenialError: CallableFunction = ({
    events,
    sceneId,
    user,
    session,
    giveaway,
    giveawayId,
  }: {
    events: Event.Config[]
    sceneId: string
    user: User.Account
    session: Analytics.Session.Config
    giveaway: Giveaway.Config
    giveawayId: string
  }) => {
    try {
      const now = DateTime.now().toMillis()
      const pastEvents = events.filter((e: Event.Config) => e?.eventEnd > now)
      const futureEvents = events.filter((e: Event.Config) => e?.eventStart > now)
      const onlyPastEvents = pastEvents.length > 0 && futureEvents.length == 0
      const onlyFutureEvents = futureEvents.length > 0 && pastEvents.length == 0
      const noValidEvents = futureEvents.length > 0 && pastEvents.length > 0

      // check if event has not yet started
      if (onlyFutureEvents) {
        AdminLogManager.logGiveawayInfo('DENIED - BEFORE EVENT START', {
          userName: user.displayName,
          userId: user.sk,
          sceneId,
          to: session.connectedWallet.toLowerCase(),
          giveawayId,
          event,
          giveaway,
          eventStart: DateTime.fromMillis(futureEvents[0].eventStart).toISO(),
          time: DateTime.now().toISO(),
        })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.BEFORE_EVENT_START }
      }
      // check if event is over
      if (onlyPastEvents) {
        AdminLogManager.logGiveawayInfo('DENIED - AFTER EVENT END', {
          userName: user.displayName,
          userId: user.sk,
          sceneId,
          to: session.connectedWallet.toLowerCase(),
          giveawayId,
          giveaway,
          eventEnd: DateTime.fromMillis(pastEvents[0].eventEnd).toISO(),
          time: DateTime.now().toISO(),
        })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.AFTER_EVENT_END }
      }

      if (noValidEvents) {
        AdminLogManager.logGiveawayInfo('DENIED - BETWEEN VALID EVENTS', {
          userName: user.displayName,
          userId: user.sk,
          sceneId,
          to: session.connectedWallet.toLowerCase(),
          giveawayId,
          giveaway,
          futureEventStart: DateTime.fromMillis(futureEvents[0].eventEnd).toISO(),
          pastEventEnd: DateTime.fromMillis(pastEvents[0].eventEnd).toISO(),
          time: DateTime.now().toISO(),
        })
        return { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.BETWEEN_VALID_EVENTS }
      }
    } catch (error) {
      AdminLogManager.logError('CLAIM ERROR', { error })
      return { responseType: Giveaway.ClaimResponseType.CLAIM_SERVER_ERROR, reason: error }
    }
  }
}
