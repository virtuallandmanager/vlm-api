import { largeQuery, s3, vlmAnalyticsTable } from './common.data'
import { AdminLogManager } from '../logic/ErrorLogging.logic'
import { Analytics } from '../models/Analytics.model'
import { DateTime, DurationLikeObject } from 'luxon'
import { S3 } from 'aws-sdk'
import config from '../../config/config'

export abstract class AnalyticsDbManager {
  static getRecentSceneMetrics: CallableFunction = async (sceneId: string) => {
    const twentyFourHoursAgo = DateTime.now().minus({ hours: 1 }).toMillis()

    const params = {
      TableName: vlmAnalyticsTable,
      IndexName: 'sceneId-index',
      KeyConditionExpression: '#pk = :pk and #sceneId = :sceneId',
      FilterExpression: '#ts >= :twentyFourHoursAgo',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sceneId': 'sceneId',
        '#ts': 'ts',
      },
      ExpressionAttributeValues: {
        ':pk': Analytics.Session.Action.pk,
        ':sceneId': sceneId,
        ':twentyFourHoursAgo': twentyFourHoursAgo,
      },
    }

    try {
      const analyticsRecords = await largeQuery(params, { cache: true })
      return analyticsRecords as Analytics.Session.Action[]
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'AnalyticsUser.data/getRecentSceneMetrics',
        sceneId,
      })
      console.log(error)
      return
    }
  }

  static getRecentSessions: CallableFunction = async (sceneId: string, timeRange: DurationLikeObject) => {
    const timeAgo = DateTime.now().minus(timeRange).toMillis()

    const params = {
      TableName: vlmAnalyticsTable,
      IndexName: 'sceneId-index',
      KeyConditionExpression: '#pk = :pk and #sceneId = :sceneId',
      FilterExpression: '#ts >= :timeAgo',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sceneId': 'sceneId',
        '#ts': 'ts',
      },
      ExpressionAttributeValues: {
        ':pk': Analytics.Session.Config.pk,
        ':sceneId': sceneId,
        ':timeAgo': timeAgo,
      },
    }

    try {
      const analyticsRecords = await largeQuery(params, { cache: true })
      return analyticsRecords as Analytics.Session.Config[]
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'AnalyticsUser.data/getRecentSessions',
        sceneId,
      })
      console.error(error)
      return
    }
  }

  static getHistoricalSceneMetrics: CallableFunction = async (queryOptions: {
    sceneId: string
    start: EpochTimeStamp
    end: EpochTimeStamp
    scale: Analytics.AggregateScale
  }) => {
    try {
      const { sceneId, start, end, scale } = queryOptions
      const params = {
        TableName: vlmAnalyticsTable,
        IndexName: 'sceneId-index',
        KeyConditionExpression: '#pk = :pk and #sceneId = :sceneId',
        FilterExpression: '#scale = :scale and #startDateTime >= :startDateTime and #endDateTime <= :endDateTime',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#sceneId': 'sceneId',
          '#startDateTime': 'startDateTime',
          '#endDateTime': 'endDateTime',
          '#scale': 'scale',
        },
        ExpressionAttributeValues: {
          ':pk': Analytics.Session.Aggregate.pk,
          ':sceneId': sceneId,
          ':startDateTime': Number(start),
          ':endDateTime': Number(end),
          ':scale': scale,
        },
      }

      const analyticsRecords = await largeQuery(params, { cache: true })
      return analyticsRecords as Analytics.Session.Aggregate[]
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'AnalyticsUser.data/getRecentSceneMetrics',
      })
      console.log(error)
      return
    }
  }

  static getCustomSceneMetrics: CallableFunction = async (queryOptions: {
    sceneId: string
    start: EpochTimeStamp
    end: EpochTimeStamp
    action: string
  }) => {
    const { sceneId, start, end, action } = queryOptions
    const params = {
      TableName: vlmAnalyticsTable,
      IndexName: 'sceneId-index',
      KeyConditionExpression: '#pk = :pk and #sceneId = :sceneId',
      FilterExpression: '#startDateTime >= :startDateTime and #endDateTime <= :endDateTime and #name = :name',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sceneId': 'sceneId',
        '#startDateTime': 'ts',
        '#endDateTime': 'ts',
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':pk': Analytics.Session.Action.pk,
        ':sceneId': sceneId,
        ':startDateTime': start,
        ':endDateTime': end,
        ':name': action,
      },
    }

    try {
      const analyticsRecords = await largeQuery(params, { cache: true })
      return analyticsRecords as Analytics.Session.Action[]
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'AnalyticsUser.data/getRecentSceneMetrics',
        sceneId,
      })
      console.log(error)
      return
    }
  }

  static exportAnalyticsData: CallableFunction = async (sceneId: string, startDate: string, endDate: string) => {
    const dateRange = this.getDateRange(startDate, endDate)
    const aggregateData = []

    for (const date of dateRange) {
      const fileName = `${sceneId}-${date}.json`
      const params: S3.GetObjectRequest = {
        Bucket: config.s3_data_backups,
        Key: fileName,
      }

      try {
        // Fetch the file from S3
        const data = await s3.getObject(params).promise()
        const fileContents = JSON.parse(data.Body!.toString())

        aggregateData.push(...fileContents)

        console.log(`Processed: ${fileName}`)
      } catch (err) {
        console.error(`Error retrieving file ${fileName}:`, (err as Error).message)
      }
    }

    return aggregateData
  }

  static getDateRange: CallableFunction = (startDate: string, endDate: string): string[] => {
    const dates: string[] = []
    let currentDate = new Date(startDate)

    while (currentDate <= new Date(endDate)) {
      dates.push(currentDate.toISOString().split('T')[0]) // Format yyyy-mm-dd
      currentDate.setDate(currentDate.getDate() + 1) // Increment by 1 day
    }

    return dates
  }
}
