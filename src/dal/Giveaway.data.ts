import { Event } from '../models/Event.model'
import { docClient, largeQuery, largeScan, vlmAnalyticsTable, vlmClaimsTable, vlmMainTable, vlmTransactionsTable } from './common.data'
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

  static getById: CallableFunction = async (sk: string) => {
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

      sks.forEach((sk: string) => {
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
          '#items': 'items', // Replace with your attribute name
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
      const giveawayRecords = await largeQuery(params),
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
    giveaway,
    allocation,
    balance,
  }: {
    giveaway: Giveaway.Config
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
          Key: { pk: Giveaway.Config.pk, sk: giveaway.sk },
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
        giveaway,
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
      const claimRecords = await largeQuery(params)
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
      IndexName: 'giveawayId-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#giveawayId': 'giveawayId',
        '#connectedWallet': 'to',
      },
      ExpressionAttributeValues: {
        ':pk': Giveaway.Claim.pk,
        ':giveawayId': giveawayId,
        ':connectedWallet': user.connectedWallet,
      },
      KeyConditionExpression: '#pk = :pk and #giveawayId = :giveawayId',
      FilterExpression: '#connectedWallet = :connectedWallet',
    }

    try {
      const claimRecords = await largeQuery(params)
      return claimRecords.filter((claim: Giveaway.Claim) => claim.to === user.connectedWallet)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getUserClaimsForEvent',
        user,
        error,
      })
      return
    }
  }

  static getIpClaimsForGiveaway: CallableFunction = async ({ user, giveawayId }: { user: User.Account; giveawayId: string }) => {
    const params = {
      TableName: vlmClaimsTable,
      IndexName: 'clientIp-index',
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
      KeyConditionExpression: '#pk = :pk and #clientIp = :clientIp',
      FilterExpression: '#giveawayId = :giveawayId',
    }

    try {
      const claimRecords = await largeQuery(params)
      return claimRecords
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Giveaway.data/getIpClaimsForEvent',
        user,
        error,
      })
      return
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
}
