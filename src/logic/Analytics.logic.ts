import { DateTime } from 'luxon'
import { AnalyticsDbManager } from '../dal/Analytics.data'
import { Analytics } from '../models/Analytics.model'

export abstract class AnalyticsManager {
  static getRecentSessionMetrics: CallableFunction = async (sceneId: string) => {
    try {
      const recentSceneSessionsFull = await AnalyticsDbManager.getRecentSessions(sceneId)

      const totalSessions = recentSceneSessionsFull.length,
        uniqueUsers = recentSceneSessionsFull.reduce((acc: any, session: Analytics.Session.Config) => {
          if (!acc[session.userId]) {
            acc[session.userId] = true
          }
          return acc
        }, {}),
        totalUniqueUsers = Object.keys(uniqueUsers).length,
        averageSessionLength =
          recentSceneSessionsFull.reduce((acc: number, session: Analytics.Session.Config) => {
            if (session.sessionStart && session.sessionEnd) {
              acc += session.sessionEnd - session.sessionStart
            }
            return acc
          }, 0) / totalSessions
            ? 0 / totalSessions
            : 0

      return { totalSessions, totalUniqueUsers, averageSessionLength }
    } catch (error) {
      console.log(error)
      return
    }
  }
  static getRecentSceneMetrics: CallableFunction = async (sceneId: string) => {
    try {
      const recentSceneMetricsFull = await AnalyticsDbManager.getRecentSceneMetrics(sceneId)
      // group each metric by the action property and count how many of each action took place during each minute
      let byMinute = recentSceneMetricsFull.reduce((acc: any, metric: Analytics.Session.Action) => {
          const { name, ts } = metric
          const minute = DateTime.fromMillis(ts).toUTC().startOf('minute').toISO()
          if (!acc[minute]) {
            acc[minute] = {}
          }
          if (!acc[minute][name]) {
            acc[minute][name] = 0
          }
          acc[minute][name]++
          return acc
        }, {}),
        byHour = recentSceneMetricsFull.reduce((acc: any, metric: Analytics.Session.Action) => {
          const { name, ts } = metric
          const hour = DateTime.fromMillis(ts).toUTC().startOf('hour').toISO()
          if (!acc[hour]) {
            acc[hour] = {}
          }
          if (!acc[hour][name]) {
            acc[hour][name] = 0
          }
          acc[hour][name]++
          return acc
        }, {}),
        byDay = recentSceneMetricsFull.reduce((acc: any, metric: Analytics.Session.Action) => {
          const { name, ts } = metric
          const day = DateTime.fromMillis(ts).toUTC().startOf('day').toISO()
          if (!acc[day]) {
            acc[day] = {}
          }
          if (!acc[day][name]) {
            acc[day][name] = 0
          }
          acc[day][name]++
          return acc
        }, {})

      return { byMinute, byHour, byDay }
    } catch (error) {
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
    return await AnalyticsDbManager.getHistoricalSceneMetrics({ sceneId, start, end, scale })
  }
}
