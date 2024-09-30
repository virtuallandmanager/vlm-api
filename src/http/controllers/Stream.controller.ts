import express, { Request, Response } from 'express'
import { SceneManager } from '../../logic/Scene.logic'
import { UserManager } from '../../logic/User.logic'
import { authMiddleware } from '../../middlewares/security/auth'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { HistoryManager } from '../../logic/History.logic'
import { StreamManager } from '../../logic/Stream.logic'
const router = express.Router()

router.get('/cards', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: 'Bad Request.',
      })
    }

    const user = await UserManager.getById(req.session.userId)

    if (!user) {
      return res.status(401).json({
        text: 'Unauthorized.',
      })
    }

    const streams = await StreamManager.getStreamsForUser(user.sk)

    return res.status(200).json({
      text: 'Successfully authenticated.',
      streams: [
        {
          name: 'Mock Stream',
          sk: '0000000-111111111-333333333-44444444',
          streamUrl: 'rtmp://stream-acWef.vlm.gg/live',
          watchUrl: 'https://live-acWef.vlm.gg/live/test/index.m3u8',
          streamKey: 'test',
          authKey: 'asdfnjwerfiuq34fwneflbejqenjq3fubqk',
          starting: false,
          running: true,
        },
      ],
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Authentication.controller/cards',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sceneConfig = req.body,
      user = await UserManager.getById(req.session.userId),
      { sceneLink, fullScene } = await SceneManager.createSceneForUser(user, sceneConfig)

    HistoryManager.initHistory(user, fullScene)

    return res.status(200).json({
      text: 'Successfully created scene.',
      scene: fullScene,
      sceneLink,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Scene.controller/create',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('/delete/:sceneId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sceneId = req.params.sceneId,
      user = await UserManager.getById(req.session.userId),
      sceneIds = await SceneManager.getIdsForUser(user)

    if (!sceneIds.includes(sceneId)) {
      return res.status(401).json({
        text: 'Unauthorized - not your scene.',
      })
    }

    const scene = await SceneManager.getSceneById(sceneId),
      history = await HistoryManager.getHistory(sceneId)

    if (history) {
      HistoryManager.addUpdate(user, history.sk, { action: 'deleted scene' }, scene)
    }

    const deletedSceneId = await SceneManager.deleteScene(sceneId)

    return res.status(200).json({
      text: 'Successfully deleted scene.',
      sceneId: deletedSceneId,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Scene.controller/create',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

export default router
