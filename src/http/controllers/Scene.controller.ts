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
import { DateTime } from 'luxon'
const router = express.Router()

router.get('/cards', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: 'Bad Request.',
      })
    }

    const user = await UserManager.getById(req.session.userId),
      scenes = await SceneManager.getScenesForUser(user),
      sharedScenes = await SceneManager.getSharedScenesForUser(user)

    return res.status(200).json({
      text: 'Successfully authenticated.',
      scenes: scenes || [],
      sharedScenes: sharedScenes || [],
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

router.get('/leave/:sceneId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sceneId = req.params.sceneId,
      user = await UserManager.getById(req.session.userId),
      scenes = await SceneManager.getSharedScenesForUser(user),
      sceneIds = scenes.map((scene: Scene.Config) => scene.sk)

    if (!sceneIds.includes(sceneId)) {
      return res.status(401).json({
        text: 'Unauthorized - you have not yet joined this scene.',
      })
    }

    const scene = await SceneManager.getSceneById(sceneId),
      history = await HistoryManager.getHistory(sceneId)

    if (history) {
      HistoryManager.addUpdate(user, history.sk, { action: 'left scene' }, scene)
    }

    const leftSceneId = await SceneManager.revokeInvite(sceneId, user)

    if (!leftSceneId) {
      return res.status(400).json({
        text: 'Bad Request.',
      })
    }

    return res.status(200).json({
      text: 'Successfully left scene.',
      sceneId: leftSceneId,
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
    const { userWallet, sceneId, startTime, endTime } = req.body
    let userInfo: User.Account, invite: Scene.Invite, admins: string[]

    if (sceneId) {
      // check if requesting user is the scene's owner
      admins = await SceneManager.getSceneAdmins(sceneId)
    } else {
      return res.status(400).json({
        text: 'Bad Request.',
      })
    }

    if (!admins.includes(req.session.userId)) {
      return res.status(401).json({
        text: 'Unauthorized action.',
      })
    }

    if (userWallet) {
      invite = new Scene.Invite({ sceneId, startTime: startTime || DateTime.now().toMillis(), endTime })
      const response = await SceneManager.inviteUserByWallet({ ...invite, userWallet })
      userInfo = response.userInfo
      invite = response.invite
    } else {
      // TODO: invite user by email/web2 id
    }

    return res.status(200).json({
      text: `Invite sent to ${userInfo.displayName || userWallet}.`,
      userInfo,
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
    const scene = await SceneManager.getSceneById(Scene.DemoSceneId)
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
