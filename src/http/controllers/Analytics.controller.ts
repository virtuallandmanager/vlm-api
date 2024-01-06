import express, { Request, Response } from 'express'
import { authMiddleware } from '../../middlewares/security/auth'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { AnalyticsManager } from '../../logic/Analytics.logic'

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

    let recentMetrics

    if (sceneId) {
      recentMetrics = await AnalyticsManager.getHistoricalSceneMetrics({ sceneId, start, end, scale })
    }

    return res.status(200).json({
      recentMetrics,
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

export default router
