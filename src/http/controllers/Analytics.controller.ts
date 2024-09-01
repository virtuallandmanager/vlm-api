import express, { Request, Response } from 'express'
import { authMiddleware } from '../../middlewares/security/auth'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { AnalyticsManager } from '../../logic/Analytics.logic'
import fs from 'fs'
import path from 'path'
import { EventManager } from '../../logic/Event.logic'
import { Event } from '../../models/Event.model'
import { Analytics } from '../../models/Analytics.model'
import { UserManager } from '../../logic/User.logic'
import { SessionManager } from '../../logic/Session.logic'
import { DateTime } from 'luxon'

const router = express.Router()

router.get('/recent/:sceneId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sceneId } = req.params

    let recentMetrics

    if (sceneId) {
      recentMetrics = await AnalyticsManager.getRecentSessionMetrics(sceneId)
    }

    return res.status(200).json({
      ...recentMetrics,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Analytics.controller/recent',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('/historical/:sceneId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sceneId } = req.params,
      { start, end, scale } = req.query

    let historicalData

    if (sceneId) {
      historicalData = await AnalyticsManager.getHistoricalSceneMetrics({ sceneId, start, end, scale })
    }

    return res.status(200).json({
      historicalData,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Analytics.controller/recent',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

function arrayToCSV(data: object[]): string {
  if (data.length === 0) {
    return ''
  }

  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((obj) =>
    Object.values(obj)
      .map((value) => (typeof value === 'string' && value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value))
      .join(',')
  )

  return [headers, ...rows].join('\n')
}

router.get('/event-data/:eventId', async (req: Request, res: Response) => {
  const { eventId } = req.params

  // Get the data for the event
  const eventData = await EventManager.getById(eventId),
    giveawayLinks = await EventManager.getLinkedGiveaways([eventId]),
    sceneLinks = await EventManager.getLinkedScenes([eventId]),
    sceneIds = sceneLinks.map((link: Event.SceneLink) => link.sceneId),
    giveawayIds = giveawayLinks.map((link: Event.GiveawayLink) => link.giveawayId)

  if (!eventData || !sceneIds.length) {
    return res.status(400).json({
      text: 'Bad Request.',
    })
  }

  const analyticsActions = await AnalyticsManager.getCustomSceneMetrics({
    sceneId: sceneIds[0],
    start: eventData.eventStart,
    end: eventData.eventEnd,
    action: 'Contest Submission',
  })

  const records = await Promise.all(
    analyticsActions.map(
      async (
        action: Analytics.Session.Action
      ): Promise<{
        actionName: string
        userName: string
        emailAddress: string
        city: string
        region: string
        country: string
        walletAddress: string
        timestamp: string
      }> => {
        const session = await SessionManager.getAnalyticsSessionById(action.sessionId),
          user = await UserManager.getById(session.userId)

        return {
          actionName: action.name,
          userName: user.displayName,
          city: session.ipData.location.city,
          region: session.ipData.location.region,
          country: session.ipData.location.country,
          emailAddress: action?.metadata?.email || action?.metadata?.userEmail || user.emailAddress,
          walletAddress: session.connectedWallet,
          timestamp: DateTime.fromMillis(action.ts).toISO(),
        }
        return
      }
    )
  )

  const csvContent = arrayToCSV(records)
  const filePath = path.join(__dirname, 'event-data.csv')

  // Write the CSV content to a file
  fs.writeFileSync(filePath, csvContent)

  // Set the headers to prompt a download
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=event-data.csv')

  // Send the file to the user
  res.download(filePath, 'event-data.csv', (err) => {
    if (err) {
      console.error('Error downloading the file:', err)
      res.status(500).send('Error downloading the file')
    }

    // Optionally, you can delete the file after it has been downloaded
    fs.unlinkSync(filePath)
  })
})

router.get('/scene-sessions/:sceneId', async (req: Request, res: Response) => {
  const { sceneId } = req.params,
    { start, end, scale } = req.query

  // Get the data for the event
  let sceneSessions = await SessionManager.getSessionsInTimeRangeBySceneId(sceneId, start, end)

  sceneSessions = await Promise.all(
    sceneSessions.map(async (session: Analytics.Session.Config) => {
      const user = await UserManager.getById(session.userId)
      const displayName = user.displayName
      return {
        ['Wallet']: session.connectedWallet,
        ['Display Name']: displayName,
        ['Session Start']: DateTime.fromMillis(session.sessionStart).toUTC().toISO(),
        ['Session End']: session.sessionEnd ? DateTime.fromMillis(session.sessionEnd).toUTC().toISO() : 'N/A',
      }
    })
  )

  if (!sceneSessions.length) {
    return res.status(400).json({
      text: 'Bad Request.',
    })
  }

  const csvContent = arrayToCSV(sceneSessions)
  const filePath = path.join(__dirname, 'event-data.csv')

  // Write the CSV content to a file
  fs.writeFileSync(filePath, csvContent)

  // Set the headers to prompt a download
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=event-data.csv')

  // Send the file to the user
  res.download(filePath, 'event-data.csv', (err) => {
    if (err) {
      console.error('Error downloading the file:', err)
      res.status(500).send('Error downloading the file')
    }

    // Optionally, you can delete the file after it has been downloaded
    fs.unlinkSync(filePath)
  })
})

export default router
