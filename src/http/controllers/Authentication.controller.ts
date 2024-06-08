import express, { Request, Response } from 'express'
const router = express.Router()
import ipHelper from '../../helpers/ip'
import dcl, { express as dclExpress } from 'decentraland-crypto-middleware'
import { VALID_SIGNATURE_TOLERANCE_INTERVAL_MS, Metadata } from '../../middlewares/utils'
import { runChecks } from '../../middlewares/security/securityChecks'
import { SessionManager } from '../../logic/Session.logic'
import { UserManager } from '../../logic/User.logic'
import { extractToken } from './common.controller'
import { getSignatureMessage } from '../../web3/provider'
import { web3AuthMiddleware } from '../../middlewares/security/auth'
import { Analytics } from '../../models/Analytics.model'
import { User } from '../../models/User.model'
import { DateTime } from 'luxon'
import { OrganizationManager } from '../../logic/Organization.logic'
import { Organization } from '../../models/Organization.model'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { SceneManager } from '../../logic/Scene.logic'
import { WalletType } from '../../models/Wallet.model'

router.get('/web3', async (req: Request, res: Response) => {
  const address = extractToken(req).toLowerCase(),
    clientIp = req.clientIp
  try {
    const user = await UserManager.obtainUserByWallet({
      sk: address,
      currency: 'ETH',
      type: WalletType.USER,
    })

    const sessionConfig = {
      userId: user.sk,
      connectedWallet: user.connectedWallet.toLowerCase(),
      clientIp,
    }

    let existingSession, newSession
    existingSession = await SessionManager.getVLMSession(sessionConfig)

    if (!existingSession) {
      newSession = new User.Session.Config(sessionConfig)
      await SessionManager.getIpData(newSession)
      SessionManager.issueUserSessionToken(newSession)
      SessionManager.issueRefreshToken(newSession)
      SessionManager.issueSignatureToken(newSession)
      await SessionManager.storePreSession(newSession)
    } else {
      existingSession = await SessionManager.refreshSession(existingSession)
    }

    const session = existingSession || newSession

    return res.status(200).json({
      text: `Signature token issued for ${user.connectedWallet.toLowerCase()}`,
      signatureMessage: getSignatureMessage(user.connectedWallet.toLowerCase(), clientIp),
      signatureToken: session.signatureToken,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Authentication.controller/web3',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/login', web3AuthMiddleware, async (req: Request, res: Response) => {
  const clientIp = req.clientIp,
    session = req.session

  try {
    if (!session.sessionStart) {
      await SessionManager.startVLMSession(session)
    } else {
      await SessionManager.refreshSession(session)
    }

    const user = await UserManager.obtain(
      new User.Account({
        sk: session.userId,
        connectedWallet: session.connectedWallet.toLowerCase(),
        hasConnectedWeb3: !!session.connectedWallet,
        clientIp,
      })
    )

    const userOrgs = await OrganizationManager.getUserOrgs(session.userId, Organization.Roles.ORG_OWNER)

    const status = (user?.registeredAt && user?.roles?.length) || userOrgs?.length ? 200 : 201
    return res.status(status).json({
      status: 200,
      text: 'Successfully authenticated.',
      session,
      user,
      userOrgs,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Authentication.controller/login',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('/refresh', async (req: Request, res: Response) => {
  const clientIp = req.clientIp,
    refreshToken = extractToken(req)

  try {
    let session = await SessionManager.validateSessionRefreshToken(refreshToken)
    if (!session) {
      return res.status(401).json({
        text: 'Invalid refresh token.',
      })
    }
    session = await SessionManager.refreshSession(session)
    const user = await UserManager.obtain(
      new User.Account({
        sk: session.userId,
        connectedWallet: session.connectedWallet.toLowerCase(),
        clientIp,
      })
    )

    if (clientIp !== user.lastIp) {
      await UserManager.updateIp(user)
    }

    const userOrgs = await OrganizationManager.getUserOrgs(session.userId, Organization.Roles.ORG_OWNER)

    const status = (user?.registeredAt && user?.roles?.length) || userOrgs?.length ? 200 : 201
    return res.status(status).json({
      status: 200,
      text: 'Successfully authenticated.',
      session,
      user,
      userOrgs,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Authentication.controller/restore',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post(
  '/decentraland',
  dclExpress({ expiration: VALID_SIGNATURE_TOLERANCE_INTERVAL_MS }),
  async (req: Request & dcl.DecentralandSignatureData<Metadata>, res: Response | any) => {
    const { baseParcel, sceneId, user, location, subPlatform, environment } = req.body,
      clientIp = req.clientIp,
      parcelArr = baseParcel?.split(',').map((str: string): number => Number(str))
    let serverAuthenticated = false,
      sessionRole = Analytics.Session.Role.VISITOR

    try {
      let existingScene = await SceneManager.getSceneById(sceneId)

      if (user && user.lastIp !== clientIp) {
        user.lastIp = clientIp
      }

      if (!sceneId || !existingScene) {
        const ipData = await ipHelper.addIpData(clientIp)
        AdminLogManager.logError('Invalid Scene Request', {
          from: 'Authentication.controller/decentraland',
          request: req.body,
          ipData,
        })
        return res.status(400).json({
          text: 'Bad Request.',
        })
      }

      await runChecks(req, parcelArr, sceneId)
      serverAuthenticated = true
    } catch (error: unknown) {
      AdminLogManager.logError(error, {
        from: 'Authentication.controller/decentraland',
        request: req.body,
      })
      serverAuthenticated = false
    }

    try {
      const dbUser = await UserManager.obtainUserByWallet(
        {
          sk: user.userId,
          currency: 'ETH',
          type: WalletType.USER,
          ttl: user.hasConnectedWeb3 ? DateTime.now().plus({ hours: 24 }).toMillis() : undefined,
        },
        { displayName: user?.displayName, hasConnectedWeb3: user?.hasConnectedWeb3, lastIp: clientIp }
      )

      const sceneIds = await SceneManager.getIdsForUser(dbUser)

      if (UserManager.getAdminLevel(dbUser) >= User.Roles.VLM_ADMIN) {
        sessionRole = Analytics.Session.Role.VLM_ADMIN
      } else if (sceneIds.includes(sceneId)) {
        sessionRole = Analytics.Session.Role.SCENE_ADMIN
      }

      // get existing session
      const existingSession = await SessionManager.getAnalyticsSessionForUserId(dbUser.sk)

      const session =
        existingSession && existingSession.sceneId == sceneId ? existingSession : // if the user is already in the scene, keep the session
        new Analytics.Session.Config({
          userId: dbUser.sk,
          connectedWallet: dbUser.connectedWallet.toLowerCase(),
          location,
          sceneId,
          clientIp,
          sessionRole,
          device: subPlatform,
          serverAuthenticated,
          sessionStart: DateTime.now().toMillis(),
          hasConnectedWeb3: user.hasConnectedWeb3,
          ttl: environment === 'prod' ? undefined : DateTime.now().plus({ hours: 24 }).toMillis(),
        })
      await SessionManager.getIpData(session)
      SessionManager.issueAnalyticsSessionToken(session)
      await SessionManager.storePreSession(session)

      return res.status(200).json({
        text: 'Successfully authenticated.',
        session,
        user: dbUser,
      })
    } catch (error: unknown) {
      AdminLogManager.logError(error, {
        from: 'Authentication.controller/decentraland',
      })
      return res.status(500).json({
        text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
        error,
      })
    }
  }
)

export default router
