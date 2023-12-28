import { largeQuery, vlmAnalyticsTable } from './common.data'
import { AdminLogManager } from '../logic/ErrorLogging.logic'
import { Analytics } from '../models/Analytics.model'
import { DateTime } from 'luxon'

export abstract class AnalyticsDbManager {
  static getRecentSceneMetrics: CallableFunction = async (sceneId: string) => {
    const twentyFourHoursAgo = DateTime.now().minus({ minutes: 24 }).toMillis()

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

  static getHistoricalSceneMetrics: CallableFunction = async (queryOptions: {
    sceneId: string
    start: EpochTimeStamp
    end: EpochTimeStamp
    scale: Analytics.AggregateScale
  }) => {
    const { sceneId, start, end, scale } = queryOptions
    const params = {
      TableName: vlmAnalyticsTable,
      IndexName: 'sceneId-index',
      KeyConditionExpression: '#pk = :pk and #sceneId = :sceneId',
      FilterExpression: '#startDateTime >= :startDateTime and #endDateTime <= :endDateTime and #scale = :scale',
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
        ':startDateTime': start,
        ':endDateTime': end,
        ':scale': scale,
      },
    }

    try {
      const analyticsRecords = await largeQuery(params, { cache: true })
      return analyticsRecords as Analytics.Session.Aggregate[]
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'AnalyticsUser.data/getRecentSceneMetrics',
        sceneId,
      })
      console.log(error)
      return
    }
  }
}
