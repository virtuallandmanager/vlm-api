import { daxClient, docClient, largeQuery, vlmMainTable } from './common.data'
import { AdminLogManager } from '../logic/ErrorLogging.logic'
import { User } from '../models/User.model'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { UserWalletDbManager } from './UserWallet.data'
import { VLMRecord } from '../models/VLM.model'
import { Scene } from '../models/Scene.model'
import { GenericDbManager } from './Generic.data'
import { Organization } from '../models/Organization.model'
import { DateTime } from 'luxon'

export abstract class UserDbManager {
  static obtain: CallableFunction = async (user: User.Account) => {
    let existingUser, createdUser
    try {
      existingUser = await this.get(user)
      if (!existingUser) {
        createdUser = await this.put(user)
      }

      return existingUser || createdUser
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/obtain',
        user,
      })
    }
  }

  static get: CallableFunction = async (user: User.Account) => {
    if (!user.sk && user.connectedWallet) {
      const walletRecord = await UserWalletDbManager.get({
        sk: user.connectedWallet,
      })
      user.sk = walletRecord.userId
    } else if (!user.sk && !user.connectedWallet) {
      AdminLogManager.logError('User must have either a connectedWallet or sk', {
        from: 'User.data/get',
        user,
      })
      return
    }

    const { pk, sk } = user
    try {
      const params = {
        TableName: vlmMainTable,
        Key: {
          pk,
          sk,
        },
      }

      const userRecord = await daxClient.get(params).promise()
      return userRecord.Item as User.Account
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/get',
        user,
      })
      throw error
    }
  }

  static getById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: User.Account.pk,
        sk,
      },
    }

    try {
      const userRecord = await docClient.get(params).promise()
      return userRecord.Item
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/getById',
        sk,
      })
    }
  }

  static getSceneInvites: CallableFunction = async (userId: string) => {
    try {
      const params = {
        TableName: vlmMainTable,
        IndexName: 'userId-index',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#userId': 'userId',
        },
        ExpressionAttributeValues: {
          ':pk': Scene.Invite.pk,
          ':userId': userId,
        },
        KeyConditionExpression: '#pk = :pk and #userId = :userId',
      }

      const sceneInviteFragments = await largeQuery(params),
        sceneInviteIds = sceneInviteFragments.map((sceneInvite: Scene.Invite) => sceneInvite.sk),
        sceneInvites = await sceneInviteIds.map(
          async (sceneInvite: Scene.Invite) =>
            await GenericDbManager.get({
              pk: Scene.Invite.pk,
              sk: sceneInvite.sk,
            })
        )

      return sceneInvites
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/getSceneInvites',
        userId,
      })
      return
    }
  }

  static getOrgInvites: CallableFunction = async (userId: string) => {
    try {
      const params = {
        TableName: vlmMainTable,
        IndexName: 'userId-index',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#userId': 'userId',
        },
        ExpressionAttributeValues: {
          ':pk': Organization.Invite.pk,
          ':userId': userId,
        },
        KeyConditionExpression: '#pk = :pk and #userId = :userId',
      }

      const orgInviteFragments = await largeQuery(params),
        orgInviteIds = orgInviteFragments.map((orgInvite: Scene.Invite) => orgInvite.sk),
        orgInvites = await orgInviteIds.map(
          async (orgInvite: Scene.Invite) =>
            await GenericDbManager.get({
              pk: Organization.Invite.pk,
              sk: orgInvite.sk,
            })
        )

      return orgInvites
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/getOrgInvites',
        userId,
      })
      return
    }
  }

  static getBalance: CallableFunction = async (user: User.Account) => {
    if (!user.sk) {
      const walletRecord = await UserWalletDbManager.get({
        wallet: user.connectedWallet,
      })
      user.sk = walletRecord.userId
    }

    const { pk, sk } = user

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    }

    try {
      const balanceResponse = await daxClient.get(params).promise()
      const balance = balanceResponse.Item as User.Balance
      return user
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/getBalance',
        user,
      })
    }
  }

  static obtainBalance: CallableFunction = async (balance: User.Balance) => {
    let existingBalance, createdBalance
    try {
      existingBalance = await this.getBalance(balance)
      if (!existingBalance) {
        createdBalance = await this.putBalance(balance)
      }

      return existingBalance || createdBalance
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/obtainBalance',
        balance,
      })
    }
  }

  static getBalanceById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: User.Balance.pk,
        sk,
      },
    }

    try {
      const userRecord = await daxClient.get(params).promise()
      const user = userRecord.Item as User.Account
      return user
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/getBalance',
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
        balances = await balanceIds.map(async (balance: User.Balance) => await UserDbManager.getBalanceById(balance.sk))

      return balances
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Scene.data/obtainBalances',
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
              ts: DateTime.now().toUnixInteger(),
            },
            UpdateExpression: 'SET #ts = :ts, #attr = list_append(#attr, :balanceIds)',
            ConditionExpression: '#ts = :userTs',
            ExpressionAttributeNames: { '#ts': 'ts', '#value': 'value' },
            ExpressionAttributeValues: {
              ':balanceIds': balanceIds,
              ':userTs': userAccount.ts || 0,
              ':ts': DateTime.now().toMillis(),
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
              ts: DateTime.now().toUnixInteger(),
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
        from: 'User.data/createNewBalance',
        userAccount,
      })
    }
  }

  static updateBalance: CallableFunction = async (balance: User.Balance & VLMRecord, adjustment: number) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: balance.pk, sk: balance.sk },
      UpdateExpression: 'SET #ts = :ts, #value = :value',
      ConditionExpression: '#ts = :balanceTs',
      ExpressionAttributeNames: { '#ts': 'ts', '#value': 'value' },
      ExpressionAttributeValues: {
        ':value': balance.value || 0,
        ':balanceTs': balance.ts || 0,
        ':ts': DateTime.now().toMillis(),
      },
    }

    try {
      await daxClient.update(params).promise()
      return await UserDbManager.obtainBalance(balance)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/updateBalance',
        balance,
      })
    }
  }

  static getUserRole: CallableFunction = async (id: User.Roles) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: User.Role.pk,
        sk: id,
      },
    }

    try {
      const roleRecord = await daxClient.get(params).promise()
      const role = roleRecord.Item as User.Role
      return role
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/getUserRole',
        id,
      })
    }
  }

  static updateIp: CallableFunction = async (user: User.Account) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: user.pk, sk: user.sk },
      UpdateExpression: 'set #ts = :ts, lastIp = :lastIp',
      ExpressionAttributeNames: { '#ts': 'ts' },
      ExpressionAttributeValues: {
        ':ts': DateTime.now().toMillis(),
        ':lastIp': user.lastIp,
      },
    }

    try {
      await daxClient.update(params).promise()
      return await UserDbManager.get(user)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/update',
        user,
      })
    }
    return false
  }

  static put: CallableFunction = async (user: User.Account) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...user,
        ts: DateTime.now().toUnixInteger(),
      },
    }

    try {
      await daxClient.put(params).promise()
      return await UserDbManager.get(user)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/put',
        user,
      })
    }
  }
  static putBalance: CallableFunction = async (balance: User.Balance) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...balance,
        ts: DateTime.now().toUnixInteger(),
      },
    }

    try {
      await daxClient.put(params).promise()
      return await UserDbManager.getBalance(balance)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'User.data/put',
        balance,
      })
    }
  }
}
