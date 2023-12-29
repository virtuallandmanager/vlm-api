import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Session as BaseSession } from '../models/Session.model'
import { daxClient, docClient, largeQuery, redis, vlmAnalyticsTable, vlmSessionsTable } from './common.data'
import { AdminLogManager } from '../logic/ErrorLogging.logic'
import { DateTime } from 'luxon'
import { Analytics } from '../models/Analytics.model'
import { User } from '../models/User.model'
import { Cache } from '../models/Cache.model'
import { DynamoDBServiceException } from '@aws-sdk/client-dynamodb'
import { GenericDbManager } from './Generic.data'
import { RedisKey, RedisValue } from 'ioredis'

export abstract class SessionDbManager {
  static start: CallableFunction = async (sessionConfig: BaseSession.Config) => {
    const startTime = DateTime.now()
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmAnalyticsTable,
      Key: { pk: sessionConfig.pk, sk: sessionConfig.sk },
      ExpressionAttributeNames: {
        '#ts': 'ts',
        '#sessionStart': 'sessionStart',
        '#ttl': 'ttl',
      },
      ExpressionAttributeValues: {
        ':sessionStart': Number(startTime.toMillis()),
        ':ts': Number(startTime.toMillis()),
      },
      UpdateExpression: 'SET #ts = :ts, #sessionStart = :sessionStart REMOVE #ttl', // Added "REMOVE #ttl"
    }

    try {
      await daxClient.update(params).promise()
      return await this.get(sessionConfig)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/start',
        sessionConfig,
      })
    }
  }

  static create: CallableFunction = async (session: BaseSession.Config, expirationTime?: { hours: number; minutes: number; seconds: number }) => {
    const ttl = expirationTime ? DateTime.now().plus(expirationTime).toMillis() : undefined

    const table = session.pk === Analytics.Session.Config.pk ? vlmAnalyticsTable : vlmSessionsTable

    const params = {
      TableName: table,
      Item: {
        ...session,
        ts: DateTime.now().toMillis(),
        ttl,
      },
    }

    try {
      await daxClient.put(params).promise()
      return this.get(session)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/create',
        session,
      })
    }
  }

  static logAnalyticsAction: CallableFunction = async (config: Analytics.Session.Action) => {
    try {
      const params = {
        TableName: vlmAnalyticsTable,
        Item: {
          ...config,
          ts: DateTime.now().toMillis(),
          ttl: DateTime.now().plus({ months: 12 }).toMillis(),
        },
      }

      await daxClient.put(params).promise()
      return true
    } catch (error: any | DynamoDBServiceException) {
      AdminLogManager.logError(error, {
        from: 'Session.data/logAnalyticsAction',
      })
      if (error.code === 'ThrottlingException') {
        const sceneActionKey = `${config.sceneId}:${config.name}`
        return { sceneActionKey, error }
      }
      return false
    }
  }

  static get: CallableFunction = async (
    session: Analytics.Session.Config | User.Session.Config
  ): Promise<Analytics.Session.Config | User.Session.Config | void> => {
    const { pk, sk } = session
    if (!pk || !sk) {
      console.log('PROBLEM:')
      console.log(session)
    }
    const table = session.pk === Analytics.Session.Config.pk ? vlmAnalyticsTable : vlmSessionsTable
    const params = {
      TableName: table,
      Key: {
        pk,
        sk,
      },
    }
    try {
      const sessionRecord = await daxClient.get(params).promise()
      return sessionRecord.Item as Analytics.Session.Config | User.Session.Config
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/get',
        session,
      })
      console.log(error)
      return
    }
  }

  static activeVLMSessionsByUserId: CallableFunction = async (userId: string): Promise<User.Session.Config[]> => {
    const params = {
      TableName: vlmSessionsTable,
      IndexName: 'userId-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':pk': User.Session.Config.pk,
        ':userId': userId,
      },
      KeyConditionExpression: '#pk = :pk and #userId = :userId',
    }

    try {
      const sessionRecords = await largeQuery(params),
        expandedRecords: User.Session.Config[] = []
      for (let i = 0; i < sessionRecords.length; i++) {
        const expanded: User.Session.Config = await this.get(sessionRecords[i])
        if (expanded && !expanded.sessionEnd) {
          expandedRecords.push(expanded)
        }
      }
      return expandedRecords
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/getVLMByUserId',
        userId,
      })
      return []
    }
  }

  static getRecentAnalyticsSession: CallableFunction = async (userId: string): Promise<Analytics.Session.Config> => {
    const sessionStartBuffer = DateTime.now().minus({ minutes: 5 }).toMillis()
    const params = {
      TableName: vlmAnalyticsTable,
      IndexName: 'userId-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':pk': Analytics.Session.Config.pk,
        ':userId': userId,
      },
      KeyConditionExpression: '#pk = :pk and #userId = :userId',
    }

    try {
      const sessionRecords = await largeQuery(params)
      for (let i = 0; i < sessionRecords.length; i++) {
        const expanded: Analytics.Session.Config = await this.get(sessionRecords[i])
        if (expanded && expanded.sessionStart >= sessionStartBuffer) {
          expanded.sessionEnd = null
          return expanded
        }
      }
      return
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/recentAnalyticsSessionsByUserId',
        userId,
      })
      return
    }
  }

  static update: CallableFunction = async (session: BaseSession.Config) => {
    const table = session.pk == Analytics.Session.Config.pk ? vlmAnalyticsTable : vlmSessionsTable

    const params: DocumentClient.UpdateItemInput = {
      TableName: table,
      Key: { pk: session.pk, sk: session.sk },
      UpdateExpression: 'set #ts = :ts',
      ConditionExpression: '#ts = :sessionTs',
      ExpressionAttributeNames: { '#ts': 'ts' },
      ExpressionAttributeValues: {
        ':sessionTs': Number(session.ts),
        ':ts': Number(DateTime.now().toMillis()),
      },
    }

    try {
      await daxClient.update(params).promise()
      return await SessionDbManager.get(session)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/update',
        session,
      })
    }
  }

  static addPathId: CallableFunction = async (session: Analytics.Session.Config, path: Analytics.Path) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmAnalyticsTable,
      Key: { pk: session.pk, sk: session.sk },
      UpdateExpression: 'set #ts = :ts, #pathIds = list_append(if_not_exists(#pathIds, :emptyList), :pathIds)',
      ConditionExpression: '#ts = :sessionTs',
      ExpressionAttributeNames: { '#ts': 'ts', '#pathIds': 'pathIds' },
      ExpressionAttributeValues: {
        ':pathIds': [path.sk],
        ':sessionTs': Number(session.ts),
        ':emptyList': new Array(),
        ':ts': Number(DateTime.now().toMillis()),
      },
    }

    try {
      await daxClient.update(params).promise()
      return await SessionDbManager.get(session)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/addPathId',
        session,
      })
    }
  }

  static renew: CallableFunction = async (session: User.Session.Config | Analytics.Session.Config) => {
    const table = session.pk == Analytics.Session.Config.pk ? vlmAnalyticsTable : vlmSessionsTable

    const params: DocumentClient.UpdateItemInput = {
      TableName: table,
      Key: { pk: session.pk, sk: session.sk },
      ConditionExpression: 'attribute_not_exists(sessionEnd) AND #ts <= :sessionTs',
      UpdateExpression: 'set #ts = :ts, #expires = :expires, #sessionToken = :sessionToken, #signatureToken = :signatureToken',
      ExpressionAttributeNames: {
        '#ts': 'ts',
        '#expires': 'expires',
        '#sessionToken': 'sessionToken',
        '#signatureToken': 'signatureToken',
      },
      ExpressionAttributeValues: {
        ':sessionTs': session.ts,
        ':sessionToken': session.sessionToken || '',
        ':signatureToken': session.signatureToken || '',
        ':expires': session.expires,
        ':ts': Number(DateTime.now().toMillis()),
      },
    }

    try {
      await daxClient.update(params).promise()
      return await SessionDbManager.get(session)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/renew',
        session,
      })
    }
  }

  static refresh: CallableFunction = async (session: User.Session.Config | Analytics.Session.Config) => {
    const table = session.pk == Analytics.Session.Config.pk ? vlmAnalyticsTable : vlmSessionsTable

    const params: DocumentClient.UpdateItemInput = {
      TableName: table,
      Key: { pk: session.pk, sk: session.sk },
      ConditionExpression: '#ts <= :sessionTs',
      UpdateExpression:
        'set #ts = :ts, #sessionEnd = :sessionEnd, #sessionToken = :sessionToken, #refreshToken = :refreshToken, #signatureToken = :signatureToken, #expires = :expires',
      ExpressionAttributeNames: {
        '#ts': 'ts',
        '#sessionEnd': 'sessionEnd',
        '#sessionToken': 'sessionToken',
        '#signatureToken': 'signatureToken',
        '#refreshToken': 'refreshToken',
        '#expires': 'expires',
      },
      ExpressionAttributeValues: {
        ':sessionTs': Number(session.ts),
        ':sessionEnd': null,
        ':sessionToken': session.sessionToken || null,
        ':signatureToken': session.signatureToken || null,
        ':refreshToken': session.refreshToken || null,
        ':expires': session.expires || null,
        ':ts': Number(DateTime.now().toMillis()),
      },
    }

    try {
      await daxClient.update(params).promise()
      return await SessionDbManager.get(session)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/refresh',
        session,
      })
    }
  }

  static end: CallableFunction = async (session: Analytics.Session.Config | User.Session.Config) => {
    const table = session.pk == Analytics.Session.Config.pk ? vlmAnalyticsTable : vlmSessionsTable

    const endTime = DateTime.now().toMillis()
    try {
      const params: DocumentClient.UpdateItemInput = {
        TableName: table,
        Key: { pk: session.pk, sk: session.sk },
        UpdateExpression: 'set #ts = :ts, #sessionEnd = :sessionEnd',
        ExpressionAttributeNames: { '#ts': 'ts', '#sessionEnd': 'sessionEnd' },
        ExpressionAttributeValues: {
          ':sessionEnd': Number(endTime),
          ':ts': Number(endTime),
        },
      }

      await docClient.update(params).promise()
      return session
    } catch (error) {
      console.log(error)
      AdminLogManager.logError(error, {
        from: 'Session.data/end',
        session,
      })
    }
    return
  }

  static getPath: CallableFunction = async (userSessionPath: Analytics.Path) => {
    const { pk, sk } = userSessionPath

    const params = {
      TableName: vlmAnalyticsTable,
      Key: {
        pk,
        sk,
      },
    }

    try {
      const userSessionPathRecord = await daxClient.get(params).promise()
      return userSessionPathRecord.Item
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/getPath',
        userSessionPath,
      })
    }
  }

  static getPathById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmAnalyticsTable,
      Key: {
        pk: Analytics.Path.pk,
        sk,
      },
    }

    try {
      const userSessionPathRecord = await daxClient.get(params).promise()
      return userSessionPathRecord.Item
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/getPathById',
        sk,
      })
    }
  }

  static createPath: CallableFunction = async (session: Analytics.Session.Config, path: Analytics.Path, pathSegment: Analytics.PathSegment) => {
    const ts = DateTime.now().toMillis()

    try {
      if (!session.paths.includes(path.sk)) {
        session.paths.push(path.sk)
      }
      
      if (!path.segments.includes(pathSegment.sk)) {
        path.segments.push(pathSegment.sk)
      }

      const params: DocumentClient.TransactWriteItemsInput = {
        TransactItems: [
          {
            Update: {
              // Update the path with the new path segments
              TableName: vlmAnalyticsTable,
              Key: {
                pk: Analytics.Session.Config.pk,
                sk: session.sk,
              },
              UpdateExpression: 'set #paths = list_append(if_not_exists(#paths, :emptyList), :paths), #ts = :ts',
              ExpressionAttributeNames: {
                '#paths': 'paths',
                '#ts': 'ts',
              },
              ExpressionAttributeValues: {
                ':paths': session.paths,
                ':emptyList': [],
                ':ts': Number(ts),
              },
            },
          },
          {
            Put: {
              // Add a path
              Item: {
                ...path,
                ts,
              },
              TableName: vlmAnalyticsTable,
            },
          },
          {
            Put: {
              // Add the first path segment
              Item: {
                ...pathSegment,
                ts,
              },
              TableName: vlmAnalyticsTable,
            },
          },
        ],
      }

      await docClient.transactWrite(params).promise()
      return await SessionDbManager.getPath(path)
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/createPath',
      })
      throw error
    }
  }

  static addPathSegments: CallableFunction = async (pathId: string, pathSegments: Analytics.PathSegment[]) => {
    const ts = DateTime.now().toMillis()

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [],
    }

    try {
      for (let i = 0; i < pathSegments.length; i++) {
        params.TransactItems.push({
          Put: {
            // Add a path segment to the path
            Item: {
              ...pathSegments[i],
              ts,
            },
            TableName: vlmAnalyticsTable,
          },
        })
      }
      params.TransactItems.push({
        Update: {
          // Update the path with the new path segments
          TableName: vlmAnalyticsTable,
          Key: {
            pk: Analytics.Path.pk,
            sk: pathId,
          },
          UpdateExpression: 'set #segments = list_append(if_not_exists(#segments, :emptyList), :pathSegments), #ts = :ts',
          ExpressionAttributeNames: {
            '#segments': 'segments',
            '#ts': 'ts',
          },
          ExpressionAttributeValues: {
            ':pathSegments': pathSegments.map((segment) => segment.sk),
            ':emptyList': [],
            ':ts': Number(ts),
          },
        },
      })

      await docClient.transactWrite(params).promise()

      const path = await SessionDbManager.getPathById(pathId)

      return { added: pathSegments.length, total: path.segments.length }
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/addPathSegments',
      })
    }
  }

  static pushToRedisArray: CallableFunction = async (key: string, data: Array<any>) => {
    try {
      const redisArray = await redis.get(key)
      let deserializedRedisArray

      if (redisArray) {
        deserializedRedisArray = JSON.parse(redisArray)
      }

      if (Array.isArray(deserializedRedisArray)) {
        // Add a new user to the array
        deserializedRedisArray.push(data)
      } else {
        AdminLogManager.logError('Record was not an array', {
          from: 'Session.data/cacheRedisArray',
        })
        return { success: false }
      }

      // Serialize and store the updated array
      const updatedRedisArray = JSON.stringify(deserializedRedisArray)
      redis.set(key, updatedRedisArray)

      return { success: true }
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/cacheRedisArray',
      })
    }
  }

  static restoreRedisArray: CallableFunction = async () => {
    try {
      const cacheRecords = await GenericDbManager.getAll({ pk: Cache.Config.pk })
      cacheRecords.forEach((record: Cache.Config) => {
        redis.set(record.sk, JSON.stringify(record))
      })
      return cacheRecords || []
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/cacheRedisArray',
      })
    }
  }

  static setRedisData: CallableFunction = async (key: RedisKey, data: RedisValue): Promise<Cache.Config> => {
    try {
      const cacheRecord = (await redis.set(key, data)) as Cache.Config
      return cacheRecord?.data
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/cacheRedisArray',
      })
    }
  }

  static getRedisData: CallableFunction = async (key: RedisKey): Promise<Cache.Config> => {
    try {
      const cacheRecord = (await redis.get(key)) as Cache.Config
      return cacheRecord?.data
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/cacheRedisArray',
      })
    }
  }

  static persistRedisData: CallableFunction = async (key: RedisKey) => {
    try {
      const redisData = await redis.get(key)
      let deserializedRedisData

      if (redisData) {
        deserializedRedisData = JSON.parse(redisData)
      }

      await GenericDbManager.put({ pk: Cache.Config.pk, sk: key, deserializedRedisData })

      return { success: true }
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Session.data/cacheRedisArray',
      })
    }
  }
}
