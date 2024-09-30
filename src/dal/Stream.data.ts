import { docClient, vlmMainTable } from './common.data'
import { AdminLogManager } from '../logic/ErrorLogging.logic'
import { Stream } from '../models/Stream.model'
import { DateTime } from 'luxon'

export abstract class StreamDbManager {
  static obtain: CallableFunction = async (stream: Stream.Config) => {
    let existingWallet, createdWallet
    try {
      existingWallet = await this.get(stream)
      if (!existingWallet) {
        createdWallet = await this.put(stream)
      }

      return existingWallet || createdWallet
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Stream.data/obtain',
        stream,
      })
    }
  }

  static get: CallableFunction = async (stream: Stream.Config) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Stream.Config.pk,
        sk: stream.sk,
      },
    }

    try {
      const streamRecord = await docClient.get(params).promise()
      return streamRecord.Item
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Stream.data/get',
        stream,
      })
    }
  }

  static getAllForUserId: CallableFunction = async (userId: string) => {
    try {
      const params = {
        TableName: vlmMainTable,
        IndexName: 'userId-index',
        KeyConditionExpression: '#pk = :pk AND #userId = :userId',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#userId': 'userId',
        },
        ExpressionAttributeValues: {
          ':pk': Stream.Config.pk,
          ':userId': userId,
        },
      }

      const streamRecords = await docClient.query(params).promise()
      return streamRecords.Items
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Stream.data/getAllForUser',
        userId,
      })
    }
  }

  static put: CallableFunction = async (stream: Stream.Config) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...stream,
        ts: DateTime.now().toMillis(),
      },
    }

    try {
      await docClient.put(params).promise()
      return stream
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Stream.data/put',
        stream,
      })
    }
  }
}
