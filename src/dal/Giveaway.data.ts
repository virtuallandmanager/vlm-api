import { Event } from '../models/Event.model'
import { daxClient, docClient, largeQuery, largeScan, vlmAnalyticsTable, vlmClaimsTable, vlmMainTable, vlmTransactionsTable } from './common.data'
import { AdminLogManager } from '../logic/ErrorLogging.logic'
import { Accounting } from '../models/Accounting.model'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Analytics } from '../models/Analytics.model'
import { User } from '../models/User.model'
import { Giveaway } from '../models/Giveaway.model'
import { BalanceDbManager } from './Balance.data'
import { Organization } from '../models/Organization.model'
import { GenericDbManager } from './Generic.data'
import { DateTime } from 'luxon'
import { EventDbManager } from './Event.data'

export abstract class GiveawayDbManager {
  static get: CallableFunction = async (giveawayConfig: Giveaway.Config) => {
    const giveaway = new Giveaway.Config(giveawayConfig),
      { pk, sk } = giveaway

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    }

    try {
      const giveawayRecord = await docClient.get(params).promise()
      return giveawayRecord.Item
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/get',
        giveawayConfig,
      })
      return
    }
  }

  static getById: CallableFunction = async (sk: string): Promise<Giveaway.Config> => {
    if (!sk) {
      return
    }
    const params: DocumentClient.GetItemInput = {
      Key: {
        pk: Giveaway.Config.pk,
        sk,
      },
      TableName: vlmMainTable,
    }

    try {
      const giveaway = await docClient.get(params).promise()
      return new Giveaway.Config(giveaway.Item)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Event.data/getById',
        sk,
      })
      return
    }
  }

  static getByIds: CallableFunction = async (sks: string[]) => {
    if (!sks?.length) {
      return
    }
    const params: DocumentClient.TransactGetItemsInput = {
      TransactItems: [],
    }

    sks.forEach((sk: string) => {
      params.TransactItems.push({
        Get: {
          // Add a connection from organization to user
          Key: {
            pk: Giveaway.Config.pk,
            sk,
          },
          TableName: vlmMainTable,
        },
      })
    })

    try {
      const giveaways = await docClient.transactGet(params).promise()
      return giveaways.Responses.map((item) => new Giveaway.Config(item.Item))
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getByIds',
        sks,
      })
      return
    }
  }

  static getItemsByIds: CallableFunction = async (sks: string[]) => {
    if (!sks?.length) {
      return
    }
    try {
      const params: DocumentClient.TransactGetItemsInput = {
        TransactItems: [],
      }

      if (!sks?.length) {
        return []
      }

      sks.forEach((sk: string) => {
        if (!sk) {
          return
        }
        params.TransactItems.push({
          Get: {
            // Add a connection from organization to user
            Key: {
              pk: Giveaway.Item.pk,
              sk,
            },
            TableName: vlmMainTable,
          },
        })
      })

      if (params.TransactItems.length === 0) {
        return []
      }

      const giveaways = await docClient.transactGet(params).promise()
      return giveaways.Responses.map((item) => item.Item)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getItemsByIds',
        sks,
      })
      return
    }
  }

  static adminGetAll: CallableFunction = async () => {
    const params = {
      TableName: 'VLM_MigratedLegacyEvents',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': Giveaway.Config.pk,
      },
      KeyConditionExpression: '#pk = :pk',
    }

    try {
      const giveawayQuery = await docClient.query(params).promise()
      return giveawayQuery.Items
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/adminGetAll',
      })
      return
    }
  }

  static getAllLegacy: CallableFunction = async (chunkCb: CallableFunction) => {
    var params = {
      TableName: 'vlm_claims',
    }
    const data = await largeScan(params, chunkCb)
    return data
  }

  static addClaim: CallableFunction = async (
    analyticsAction: Analytics.Session.Action,
    claim: Giveaway.Claim,
    transaction: Accounting.Transaction
  ) => {
    const ts = DateTime.now().toMillis()

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            // Add an analytics action record
            Item: {
              ...analyticsAction,
              ts,
            },
            TableName: vlmAnalyticsTable,
          },
        },
        {
          Put: {
            // Add a claim
            Item: {
              ...claim,
              ts,
            },
            TableName: vlmClaimsTable,
          },
        },
        {
          Put: {
            // Add a transaction for the claim
            Item: {
              ...transaction,
              ts,
            },
            TableName: vlmTransactionsTable,
          },
        },
      ],
    }

    try {
      await docClient.transactWrite(params).promise()
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/addClaim',
      })
      return
    }
  }

  static put: CallableFunction = async (giveaway: Giveaway.Config) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...giveaway,
        ts: DateTime.now().toMillis(),
      },
    }

    try {
      await docClient.put(params).promise()
      return giveaway
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/put',
        giveaway,
      })
      return
    }
  }

  static addItem: CallableFunction = async ({ giveaway, giveawayItem }: { giveaway: Giveaway.Config; giveawayItem: Giveaway.Item }) => {
    // Add the item
    const itemPut: DocumentClient.TransactWriteItem = {
      Put: {
        TableName: vlmMainTable,
        Item: {
          ...giveawayItem,
          ts: DateTime.now().toMillis(),
        },
      },
    }

    // Update the user balance
    const giveawayUpdate: DocumentClient.TransactWriteItem = {
      Update: {
        TableName: vlmMainTable,
        Key: {
          pk: Giveaway.Config.pk,
          sk: giveaway.sk,
        },
        UpdateExpression: 'SET #items = list_append(#items, :item)', // use list_append function to add new value to the list
        ExpressionAttributeNames: {
          '#items': 'items',
        },
        ExpressionAttributeValues: {
          ':item': [giveawayItem.sk],
        },
      },
    }

    const params = {
      TransactItems: [itemPut, giveawayUpdate],
    }

    try {
      await docClient.transactWrite(params).promise()
      const dbGiveaway = await this.get(giveaway)
      return dbGiveaway
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/addItem',
        giveaway,
        giveawayItem,
      })
      return
    }
  }

  static addItems: CallableFunction = async ({ giveaway, giveawayItems }: { giveaway: Giveaway.Config; giveawayItems: Giveaway.Item[] }) => {
    // get item sk ids
    const itemIds = giveawayItems.map((item: Giveaway.Item) => item.sk)

    // Add the items
    const itemPuts: DocumentClient.TransactWriteItem[] = giveawayItems.map((giveawayItem: Giveaway.Item) => ({
      Put: {
        TableName: vlmMainTable,
        Item: {
          ...giveawayItem,
          ts: DateTime.now().toMillis(),
        },
      },
    }))

    // Update the user balance
    const giveawayUpdate: DocumentClient.TransactWriteItem = {
      Update: {
        TableName: vlmMainTable,
        Key: {
          pk: Giveaway.Config.pk,
          sk: giveaway.sk,
        },
        UpdateExpression: 'SET #items = list_append(#items, :item)', // use list_append function to add new values to the list
        ExpressionAttributeNames: {
          '#items': 'items',
        },
        ExpressionAttributeValues: {
          ':item': itemIds,
        },
      },
    }

    const params = {
      TransactItems: [...itemPuts, giveawayUpdate],
    }

    try {
      await docClient.transactWrite(params).promise()
      const dbGiveaway = await this.get(giveaway)
      return dbGiveaway
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/addItems',
        giveaway,
      })
      return
    }
  }

  static linkEvent: CallableFunction = async (link: Event.GiveawayLink) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...link,
        ts: DateTime.now().toMillis(),
      },
    }

    try {
      await docClient.put(params).promise()
      return link
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/linkEvent',
        link,
      })
      return
    }
  }

  static updateEventLinks: CallableFunction = async (giveawayId: string, linksToAdd: Event.GiveawayLink[], linksToRemove: Event.GiveawayLink[]) => {
    try {
      if (linksToAdd?.length) {
        await Promise.all(linksToAdd.map(async (link) => await EventDbManager.linkGiveaway(link)))
      }
      if (linksToRemove?.length) {
        await Promise.all(linksToRemove.map(async (link) => await EventDbManager.unlinkGiveaway(link.sk)))
      }
      return await this.getLinkedEventsById(giveawayId)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/updateEventLinks',
        linksToAdd,
        linksToRemove,
      })
      return false
    }
  }
  static getLinkedEventsByIds: CallableFunction = async (giveawayIds: string[]) => {
    const eventLinks = await Promise.all(giveawayIds.map(async (giveawayId) => await this.getLinkedEventsById(giveawayId)))
    return eventLinks.flat()
  }

  static getLinkedEventsById: CallableFunction = async (giveawayId: string) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: 'giveawayId-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#giveawayId': 'giveawayId',
      },
      ExpressionAttributeValues: {
        ':pk': Event.GiveawayLink.pk,
        ':giveawayId': giveawayId,
      },
      KeyConditionExpression: '#pk = :pk and #giveawayId = :giveawayId',
    }

    try {
      const linkRecords = await largeQuery(params, { cache: true })
      const linkedGiveaways = await Promise.all(
        linkRecords.map((link: Event.GiveawayLink) => GenericDbManager.get({ pk: Event.GiveawayLink.pk, sk: link.sk }))
      )
      return linkedGiveaways
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getLinkedEventsById',
        giveawayId,
      })
      return
    }
  }

  static getAllForUser: CallableFunction = async (user: User.Account) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: 'userId-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':pk': Giveaway.Config.pk,
        ':userId': user.sk,
      },
      KeyConditionExpression: '#pk = :pk and #userId = :userId',
    }

    try {
      const giveawayRecords = await largeQuery(params, { cache: true }),
        giveawayIds = giveawayRecords.map((giveaway: Giveaway.Config) => giveaway.sk),
        giveaways = await GiveawayDbManager.getByIds(giveawayIds)
      return giveaways || []
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getAllForUser',
        user,
      })
      return
    }
  }

  static allocateCreditsToGiveaway: CallableFunction = async ({
    allocation,
    balance,
  }: {
    allocation: Accounting.CreditAllocation
    balance: User.Balance | Organization.Balance
  }) => {
    try {
      // Add an allocation record
      const allocationPut: DocumentClient.TransactWriteItem = {
        Put: {
          TableName: vlmMainTable,
          Item: allocation,
        },
      }

      // Update the giveaway allocation
      const giveawayUpdate: DocumentClient.TransactWriteItem = {
        Update: {
          TableName: vlmMainTable,
          Key: { pk: Giveaway.Config.pk, sk: allocation.giveawayId },
          UpdateExpression: 'ADD #allocatedCredits :credits',
          ExpressionAttributeValues: {
            ':credits': allocation.allocatedCredits,
          },
          ExpressionAttributeNames: {
            '#allocatedCredits': 'allocatedCredits',
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        },
      }

      // Update the user balance
      const balanceUpdate: DocumentClient.TransactWriteItem = {
        Update: {
          TableName: vlmMainTable,
          Key: { pk: balance.pk, sk: balance.sk },
          UpdateExpression: 'ADD #value :credits',
          ExpressionAttributeValues: {
            ':credits': -allocation.allocatedCredits, // Use a negative value to subtract
          },
          ExpressionAttributeNames: {
            '#value': 'value',
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        },
      }

      const params = {
        TransactItems: [allocationPut, giveawayUpdate, balanceUpdate],
      }

      await docClient.transactWrite(params).promise()

      const adjustedBalance = await BalanceDbManager.get(balance)

      return adjustedBalance
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/allocateCreditsToGiveaway',
        allocation,
        balance,
      })

      // Record a failed transaction
      await GenericDbManager.put({ ...allocation, status: Accounting.TransactionStatus.FAILED })
      console.log(error)
      return
    }
  }

  static getUserClaimsForGiveaway: CallableFunction = async ({ user, giveawayId }: { user: User.Account; giveawayId: string }) => {
    const params = {
      TableName: vlmClaimsTable,
      IndexName: 'userId-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#userId': 'userId',
        '#giveawayId': 'giveawayId',
      },
      ExpressionAttributeValues: {
        ':pk': Giveaway.Claim.pk,
        ':userId': user.sk,
        ':giveawayId': giveawayId,
      },
      KeyConditionExpression: '#pk = :pk and #userId = :userId',
      FilterExpression: '#giveawayId = :giveawayId',
    }

    try {
      const claimRecords = await largeQuery(params, { cache: true })
      return claimRecords
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getUserClaimsForEvent',
        user,
        error,
      })
      return
    }
  }

  static getWalletClaimsForGiveaway: CallableFunction = async ({ user, giveawayId }: { user: User.Account; giveawayId: string }) => {
    const params = {
      TableName: vlmClaimsTable,
      IndexName: 'giveawayId-to-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#giveawayId': 'giveawayId',
        '#to': 'to',
      },
      ExpressionAttributeValues: {
        ':pk': Giveaway.Claim.pk,
        ':giveawayId': giveawayId,
        ':to': user.connectedWallet,
      },
      KeyConditionExpression: '#giveawayId = :giveawayId and #to = :to',
      FilterExpression: '#pk = :pk',
    }

    try {
      const claimRecords = await largeQuery(params, { cache: true })
      if (claimRecords?.length > 0) {
        return claimRecords.filter((claim: Giveaway.Claim) => claim.to === user.connectedWallet)
      } else {
        return []
      }
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getUserClaimsForEvent',
        user,
        error,
      })
      return []
    }
  }

  static getIpClaimsForGiveaway: CallableFunction = async ({ user, giveawayId }: { user: User.Account; giveawayId: string }) => {
    const params = {
      TableName: vlmClaimsTable,
      IndexName: 'giveawayId-clientIp-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#clientIp': 'clientIp',
        '#giveawayId': 'giveawayId',
      },
      ExpressionAttributeValues: {
        ':pk': Giveaway.Claim.pk,
        ':clientIp': user.lastIp,
        ':giveawayId': giveawayId,
      },
      KeyConditionExpression: '#giveawayId = :giveawayId and #clientIp = :clientIp',
      FilterExpression: '#pk = :pk',
    }

    try {
      const claimRecords = await largeQuery(params, { cache: true })
      return claimRecords
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getIpClaimsForGiveaway',
        user,
        error,
      })
      return []
    }
  }

  static addGiveawayClaim: CallableFunction = async (claim: Giveaway.Claim) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...claim,
        ts: DateTime.now().toMillis(),
      },
    }

    try {
      await docClient.put(params).promise()
      return claim
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/addGiveawayClaim',
        claim,
      })
      return
    }
  }

  static getClaimCountForScene: CallableFunction = async ({
    sceneId,
    giveawayId,
    start,
    end,
  }: {
    sceneId: string
    giveawayId: string
    start: number
    end: number
  }) => {
    const params = {
      TableName: vlmClaimsTable,
      IndexName: 'giveawayId-sceneId-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sceneId': 'clientIp',
        '#giveawayId': 'giveawayId',
        '#ts': 'ts',
      },
      ExpressionAttributeValues: {
        ':pk': Giveaway.Claim.pk,
        ':sceneId': sceneId,
        ':giveawayId': giveawayId,
        ':start': start || 0,
        ':end': end || DateTime.now().toMillis(),
      },
      KeyConditionExpression: '#giveawayId = :giveawayId and #sceneId = :sceneId',
      FilterExpression: '#pk = :pk AND #ts BETWEEN :start AND :end',
      Select: 'COUNT',
    }

    try {
      const claimRecords = await largeQuery(params, { cache: true })
      return claimRecords
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getClaimsForScene',
        error,
      })
      return []
    }
  }

  static getMintingWalletById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Giveaway.MintingWallet.pk,
        sk,
      },
    }

    try {
      const wallet = await docClient.get(params).promise()
      return wallet.Item?.walletAddress
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getMintingWalletById',
        sk,
      })
      return
    }
  }

  static getActiveMintingWallets: CallableFunction = async () => {
    const params = {
      TableName: vlmMainTable,
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#active': 'active',
      },
      ExpressionAttributeValues: {
        ':pk': Giveaway.MintingWallet.pk,
        ':active': true,
      },
      KeyConditionExpression: '#pk = :pk',
      FilterExpression: '#active = :active',
    }

    try {
      const wallets = await largeQuery(params, { cache: true })
      return wallets
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getActiveMintingWallets',
        error,
      })
      return []
    }
  }

  static setGiveawayMinter: CallableFunction = async (giveawayConfig: Giveaway.Config, minterObj: Giveaway.MintingWallet) => {
    giveawayConfig.minter = minterObj.sk
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: giveawayConfig.pk, sk: giveawayConfig.sk },
      ExpressionAttributeNames: {
        '#minter': 'minter',
        '#ts': 'ts',
      },
      ExpressionAttributeValues: {
        ':minter': minterObj.sk,
        ':ts': DateTime.now().toMillis(),
      },
      UpdateExpression: 'SET #ts = :ts, #minter = :minter',
    }

    try {
      await daxClient.update(params).promise()
      return giveawayConfig
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/setGiveawayMinter',
        giveawayConfig,
        minterObj,
      })
      return
    }
  }
}
