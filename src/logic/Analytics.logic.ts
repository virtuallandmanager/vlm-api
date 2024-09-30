import { DateTime } from 'luxon'
import { AnalyticsDbManager } from '../dal/Analytics.data'
import { Analytics } from '../models/Analytics.model'

export abstract class AnalyticsManager {
  static getRecentSessionMetrics: CallableFunction = async (sceneId: string) => {
    try {
      // Fetch sessions for the last 7 days
      const sessionsLastWeek = await AnalyticsDbManager.getRecentSessions(sceneId, { days: 7 })

      // Get timestamp for 24 hours ago
      const twentyFourHoursAgo = DateTime.now().minus({ hours: 24 }).toMillis()

      // Filter sessions for the last 24 hours
      const sessionsLast24h = sessionsLastWeek.filter((session: Analytics.Session.Config) => session.ts >= twentyFourHoursAgo)

      // Compute metrics for last 24 hours and last week
      const metricsLast24h = this.computeMetrics(sessionsLast24h)
      const metricsLastWeek = this.computeMetrics(sessionsLastWeek)

      return { last24h: metricsLast24h, lastWeek: metricsLastWeek }
    } catch (error) {
      console.error(error)
      return
    }
  }

  static computeMetrics = (sessions: Analytics.Session.Config[]) => {
    const totalSessions = sessions.length

    // Calculate unique users
    const uniqueUsers = sessions.reduce((acc, session) => {
      if (session.userId && !acc.has(session.userId)) {
        acc.add(session.userId)
      }
      return acc
    }, new Set())
    const totalUniqueUsers = uniqueUsers.size

    // Calculate total session length
    const sessionLengthTotal = sessions.reduce((acc, session) => {
      if (session.sessionStart && session.sessionEnd) {
        acc += session.sessionEnd - session.sessionStart
      }
      return acc
    }, 0)

    // Calculate average session length in milliseconds
    const averageSessionLength = totalSessions > 0 ? Math.round(sessionLengthTotal / totalSessions) : 0

    return { totalSessions, totalUniqueUsers, averageSessionLength }
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
    const aggregates = await AnalyticsDbManager.getHistoricalSceneMetrics(queryOptions)
    const actionAggregates: { [actionName: string]: { [isoDateTime: string]: number } } = {}
    aggregates.forEach((aggregate: Analytics.Session.Aggregate) => {
      const { actionCounts } = aggregate
      Object.entries(actionCounts).forEach(([actionName, actionCount]: [string, { [isoDateTime: string]: number }]) => {
        if (!actionAggregates[actionName]) {
          actionAggregates[actionName] = {}
        } else {
          actionAggregates[actionName] = { ...actionAggregates[actionName], ...actionCount }
        }
      })
    })
    return actionAggregates
  }

  static getCustomSceneMetrics: CallableFunction = async (queryOptions: {
    sceneId: string
    start: EpochTimeStamp
    end: EpochTimeStamp
    action: string
  }) => {
    return await AnalyticsDbManager.getCustomSceneMetrics(queryOptions)
  }

  static exportAnalyticsData: CallableFunction = async (sceneId: string, startDate: string, endDate: string) => {
    return AnalyticsDbManager.exportAnalyticsData(sceneId, startDate, endDate)
  }
}
