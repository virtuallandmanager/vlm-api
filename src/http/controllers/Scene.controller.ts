import express, { Request, Response } from 'express'
import { MigrationManager } from '../../logic/Migration.logic'
import { SceneManager } from '../../logic/Scene.logic'
import { UserManager } from '../../logic/User.logic'
import { LegacySceneConfig } from '../../models/Legacy.model'
import { authMiddleware } from '../../middlewares/security/auth'
import { Decentraland } from '../../models/worlds/Decentraland.model'
import { Scene } from '../../models/Scene.model'
import { User } from '../../models/User.model'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { HistoryManager } from '../../logic/History.logic'
import { AnalyticsManager } from '../../logic/Analytics.logic'
const router = express.Router()

router.get('/cards', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: 'Bad Request.',
      })
    }

    const user = await UserManager.getById(req.session.userId),
      scenes = await SceneManager.getScenesForUser(user)

    return res.status(200).json({
      text: 'Successfully authenticated.',
      scenes: scenes || [],
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
      text: 'Successfully authenticated.',
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

router.post('/invite/user', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { connectedWallet } = req.body
    let user: User.Account, invite: Scene.Invite

    if (connectedWallet) {
      const response = await SceneManager.inviteUserByWallet(connectedWallet)
      user = response.user
      invite = response.invite
    } else {
      // TODO: invite user by email/web2 id
    }

    return res.status(200).json({
      text: `Invite sent to ${connectedWallet}.`,
      user,
      invite,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Scene.controller/invite/user',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('/demo', authMiddleware, async (req: Request, res: Response) => {
  try {
    const scene = await SceneManager.getSceneById('00000000-0000-0000-0000-000000000000')
    await SceneManager.buildScene(scene)
    return res.status(200).json({
      text: 'Successfully authenticated.',
      scene,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Scene.controller/demo',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('/:sceneId', authMiddleware, async (req: Request, res: Response) => {
  const sk = req.params.sceneId

  try {
    const scene = await SceneManager.getSceneById(sk)

    return res.status(200).json({
      text: 'Successfully authenticated.',
      scene,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Scene.controller/:sceneId',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

export default router
