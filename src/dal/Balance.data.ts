import { docClient, largeQuery, vlmMainTable } from './common.data'
import { AdminLogManager } from '../logic/ErrorLogging.logic'
import { User } from '../models/User.model'
import { GenericDbManager } from './Generic.data'
import { Organization } from '../models/Organization.model'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { VLMRecord } from '../models/VLM.model'
import { BalanceType } from '../models/Balance.model'
import { DateTime } from 'luxon'

export abstract class BalanceDbManager {
  static getIdsForUser: CallableFunction = async (userId: string) => {
    try {
      const partialBalances = await GenericDbManager.getAllForUser(User.Balance.pk, userId),
        balanceIds = partialBalances.map((transaction: User.Balance) => transaction.sk)

      return balanceIds
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/getById',
        userId,
      })
      return
    }
  }

  static getIdsForOrg: CallableFunction = async (orgId: string) => {
    try {
      const partialBalances = await GenericDbManager.getAllForOrg(Organization.Balance.pk, orgId),
        balanceIds = partialBalances.map((transaction: User.Balance) => transaction.sk)

      return balanceIds
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/getById',
        orgId,
      })
      return
    }
  }

  static obtain: CallableFunction = async (balance: User.Balance | Organization.Balance) => {
    let existingBalance, createdBalance
    try {
      existingBalance = await this.get(balance)
      if (!existingBalance) {
        createdBalance = await this.put(balance)
      }

      return existingBalance || createdBalance
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/obtain',
        balance,
      })
    }
  }

  static obtainBalanceTypeForUser: CallableFunction = async (userId: string, balanceType: BalanceType) => {
    try {
      const balanceIds = await this.getIdsForUser(userId)
      const fullBalanceObjs = await Promise.all(
        balanceIds.map(async (balanceId: { pk: string; sk: string; userId: string }) => await this.getUserBalanceById(balanceId))
      )
      const balancesOfType = await fullBalanceObjs.filter((balance: User.Balance) => balance.type === balanceType)
      if (!balancesOfType || balancesOfType.length === 0) {
        const newBalance = new User.Balance({
          userId,
          type: balanceType,
          value: 0,
        })
        await this.put(newBalance)
        return newBalance
      } else if (balancesOfType.length > 1) {
        return new Error('Balance error: More than one balance of the same type was found for this user.')
      } else {
        return balancesOfType[0]
      }
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/getBalanceTypeForUser',
        userId,
        balanceType,
      })
    }
  }

  static obtainBalanceTypeForOrg: CallableFunction = async (orgId: string, balanceType: BalanceType) => {
    try {
      const balanceIds = await this.getIdsForOrg(orgId)
      const fullBalanceObjs = await balanceIds.map(
        async (balanceId: { pk: string; sk: string; userId: string }) => await this.getUserBalanceById(balanceId)
      )
      const balancesOfType = await fullBalanceObjs.filter((balance: Organization.Balance) => balance.type === balanceType)
      if (!balancesOfType || balancesOfType.length === 0) {
        const newBalance = new Organization.Balance({
          orgId,
          type: balanceType,
          value: 0,
        })
        await this.put(newBalance)
        return newBalance
      } else if (balancesOfType.length > 1) {
        return new Error('Balance error: More than one balance of the same type was found for this organization.')
      } else {
        return balancesOfType[0]
      }
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/obtainBalanceTypeForOrg',
        orgId,
        balanceType,
      })
    }
  }

  static getUserBalanceById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: User.Balance.pk,
        sk,
      },
    }

    try {
      const balanceRecord = await docClient.get(params).promise()
      const balance = balanceRecord.Item as User.Balance
      return balance
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/getUserBalanceById',
        sk,
      })
    }
  }

  static obtainBalances: CallableFunction = async (userId: string) => {
    try {
      const params = {
        TableName: vlmMainTable,
        IndexName: 'userId-index',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#userId': 'userId',
        },
        ExpressionAttributeValues: {
          ':pk': User.Balance.pk,
          ':userId': userId,
        },
        KeyConditionExpression: '#pk = :pk and #userId = :userId',
      }

      const balanceFragments = await largeQuery(params),
        balanceIds = balanceFragments.map((userBalance: User.Balance) => userBalance.sk),
        balances = await balanceIds.map(async (balance: User.Balance) => await this.getUserBalanceById(balance.sk))

      return balances
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/obtainBalances',
        userId,
      })
      return
    }
  }

  static createNewBalance: CallableFunction = async (userAccount: User.Account, userBalances: User.Balance[]) => {
    const balanceIds: string[] = userBalances.map((balance: User.Balance) => balance.sk)
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            TableName: vlmMainTable,
            // Add the balance id to the user's account
            Key: {
              ...userAccount,
              ts: DateTime.now().toMillis(),
            },
            UpdateExpression: 'SET #ts = :ts, #attr = list_append(#attr, :balanceIds)',
            ConditionExpression: '#ts = :userTs',
            ExpressionAttributeNames: { '#ts': 'ts', '#value': 'value' },
            ExpressionAttributeValues: {
              ':balanceIds': balanceIds,
              ':userTs': Number(userAccount.ts) || 0,
              ':ts': Number(DateTime.now().toMillis()),
              TableName: vlmMainTable,
            },
          },
        },
      ],
    }

    if (userBalances) {
      userBalances.forEach((userBalance: User.Balance) => {
        params.TransactItems.push({
          Put: {
            // Add a connection from organization to user
            Item: {
              ...userBalance,
              ts: DateTime.now().toMillis(),
            },
            TableName: vlmMainTable,
          },
        })
      })
    }

    try {
      await docClient.transactWrite(params).promise()
      return userAccount
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/createNewBalance',
        userAccount,
      })
    }
  }

  static updateBalance: CallableFunction = async (balance: User.Balance & VLMRecord, adjustment: number) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: balance.pk, sk: balance.sk },
      UpdateExpression: 'SET #ts = :ts, #value = :value',
      ConditionExpression: '#ts <= :balanceTs',
      ExpressionAttributeNames: { '#ts': 'ts', '#value': 'value' },
      ExpressionAttributeValues: {
        ':value': balance.value || 0,
        ':balanceTs': Number(balance.ts) || 0,
        ':ts': Number(DateTime.now().toMillis()),
      },
    }

    try {
      await docClient.update(params).promise()
      return await this.obtain(balance)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/updateBalance',
        balance,
      })
    }
  }

  static transferBalance: CallableFunction = async (
    fromBalance: User.Balance | Organization.Balance,
    toBalance: User.Balance | Organization.Balance,
    amount: number
  ): Promise<User.Balance | Organization.Balance> => {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0')
    }

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            TableName: vlmMainTable,
            Key: {
              pk: fromBalance.pk,
              sk: fromBalance.sk,
            },
            UpdateExpression: 'SET balance = balance - :amount',
            ConditionExpression: '#ts <= :balanceTs AND #value >= :amount',
            ExpressionAttributeNames: { '#ts': 'ts', '#value': 'value' },
            ExpressionAttributeValues: {
              ':amount': amount,
              ':balanceTs': Number(fromBalance.ts),
            },
          },
        },
        {
          Update: {
            TableName: vlmMainTable,
            Key: {
              pk: toBalance.pk,
              sk: toBalance.sk,
            },
            UpdateExpression: 'SET balance = balance + :amount',
            ConditionExpression: '#ts <= :balanceTs',
            ExpressionAttributeValues: {
              ':amount': amount,
              ':balanceTs': Number(toBalance.ts),
            },
          },
        },
      ],
    }

    try {
      await docClient.transactWrite(params).promise()
      return this.get(fromBalance)
    } catch (error) {
      console.error('Transaction failed:', error)
      return
    }
  }

  static get: CallableFunction = async (balance: User.Balance | Organization.Balance) => {
    const { pk, sk } = balance

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    }

    try {
      const userRecord = await docClient.get(params).promise()
      const user = userRecord.Item
      return user
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/get',
        balance,
      })
    }
  }

  static put: CallableFunction = async (balance: User.Balance | Organization.Balance) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...balance,
        ts: DateTime.now().toMillis(),
      },
    }

    try {
      await docClient.put(params).promise()
      return balance
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Balance.data/put',
        balance,
      })
      return
    }
  }
}
