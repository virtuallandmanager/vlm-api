import { docClient, largeQuery, vlmMainTable, vlmTransactionsTable } from './common.data'
import { AdminLogManager } from '../logic/ErrorLogging.logic'
import { WalletConfig } from '../models/Wallet.model'
import { GenericDbManager } from './Generic.data'
import { Accounting } from '../models/Accounting.model'
import { DateTime } from 'luxon'
import { QueryCommandInput } from '@aws-sdk/client-dynamodb'

export abstract class TransactionDbManager {
  static get: CallableFunction = async (wallet: WalletConfig) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Accounting.Transaction.pk,
        sk: wallet.address,
      },
    }

    try {
      const walletRecord = await docClient.get(params).promise()
      return walletRecord.Item as Accounting.Transaction
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Transaction.data/get',
        wallet,
      })
    }
  }

  static getIdsForUser: CallableFunction = async (userId: string) => {
    try {
      const partialTransactions = await GenericDbManager.getAllForUser(Accounting.Transaction.pk, userId),
        transactionIds = partialTransactions.map((transaction: Accounting.Transaction) => transaction.sk)

      return transactionIds
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Transaction.data/getById',
        userId,
      })
    }
  }

  // TODO: Extend to allow for shared and dedicated minters
  static getMinter: CallableFunction = async () => {
    const params = {
      TableName: vlmMainTable,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': Accounting.Minter.pk,
      },
    }

    try {
      const walletRecord = await docClient.query(params).promise()
      const minters = walletRecord.Items as Accounting.Minter[]
      const activeMinter = minters.find((minter) => minter.active)
      return activeMinter?.address
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Transaction.data/getMinter',
      })
    }
  }

  static getTransactionByBlockchainTxId: CallableFunction = async (blockchainTxId: string) => {
    try {
      const params = {
        TableName: vlmTransactionsTable,
        KeyConditionExpression: '#pk = :pkValue',
        FilterExpression: 'contains(blockchainTxIds, :blockchainTxId)',
        ExpressionAttributeNames: {
          '#pk': 'pk',
        },
        ExpressionAttributeValues: {
          ':pk': Accounting.Transaction.pk,
          ':blockchainTxId': blockchainTxId,
        },
      }

      const transactionRecord = await largeQuery(params)
      if (!transactionRecord || transactionRecord.length < 1) {
        return null
      }
      return transactionRecord[0] as Accounting.Transaction
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Transaction.data/getTransactionByBlockchainTxId',
        blockchainTxId,
      })
    }
  }

  static updateTransactionStatus: CallableFunction = async (transactionSk: string, newStatus: string) => {
    try {
      await docClient
        .update({
          TableName: vlmMainTable,
          Key: { pk: Accounting.Transaction.pk, sk: transactionSk },
          UpdateExpression: 'SET #status = :newStatus',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':newStatus': newStatus,
          },
        })
        .promise()
    } catch (error) {
      AdminLogManager.logError(error, `Failed to update transaction status: ${JSON.stringify(error)}`)
      console.log(error)
      return
    }
  }

  static put: CallableFunction = async (wallet: WalletConfig) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...wallet,
        ts: DateTime.now().toMillis(),
      },
    }

    try {
      await docClient.put(params).promise()
      return wallet
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Transaction.data/put',
        wallet,
      })
    }
  }
}
