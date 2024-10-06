import { Request, Response } from 'express'
import { extractToken } from '../../http/controllers/common.controller'
import { NextFunction } from 'express'
import { SessionManager } from '../../logic/Session.logic'
import { UserManager } from '../../logic/User.logic'
import { User } from '../../models/User.model'
import { Client } from 'colyseus'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { Analytics } from '../../models/Analytics.model'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionToken = extractToken(req)

  // If the token is not present, return an error response
  if (!sessionToken) {
    return res.status(401).json({ error: 'Unauthorized: No access token was provided.' })
  }

  // Verify the token
  try {
    const session = await SessionManager.validateUserSessionToken(sessionToken)
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: Session token was invalid or expired.' })
    } else {
      req.session = session
      next()
    }
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }
}

export async function web3AuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const signatureToken = extractToken(req),
    { signatureAccount, signatureMessage, signature } = req.body

  // If the token is not present, return an error response
  if (!signatureToken) {
    return res.status(401).json({ error: 'Unauthorized: No signature token was provided.' })
  }

  // Verify the token
  try {
    const session = await SessionManager.validateSignatureToken({
      signatureToken,
      signature,
      signatureMessage,
      signatureAccount,
    })
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized: Web3 signature was invalid or timed out.',
      })
    } else {
      req.session = session
      next()
    }
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid signature token' })
  }
}

export async function vlmAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId
    const user = await UserManager.getById(userId)
    if (UserManager.getAdminLevel(user) <= User.Roles.VLM_ADMIN) {
      return res.status(401).json({
        error: 'Unauthorized: Insufficient Permissions.',
      })
    }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }
}

export async function analyticsAuthMiddleware(
  client: Client,
  message: { sessionToken: string; sceneId: string },
  next: (auth?: { session: Partial<Analytics.Session.Config>; user: Partial<User.Account> }) => void
) {
  let session: Partial<Analytics.Session.Config>
  const { sessionToken, sceneId } = message

  // Perform token validation here
  if (sessionToken) {
    // Token is valid, allow access to the next message handling logic
    session = await SessionManager.validateAnalyticsSessionToken(sessionToken)
  }

  if (session?.sessionToken && session?.sessionToken !== sessionToken) {
    AdminLogManager.logErrorToDiscord(JSON.stringify({ error: 'Client tokens were mismatched over WebSocket connection', client, message, session }))
  }

  if (session) {
    let user = await UserManager.getById(session.userId)
    next({ session, user })
    return
  }
  next()
}

export async function userAuthMiddleware(
  client: Client,
  message: { sessionToken: string; refreshToken: string; sceneId: string },
  next: ({ session, user }?: { session: User.Session.Config; user: User.Account }) => void
) {
  let session
  const { sessionToken, refreshToken, sceneId } = message

  // Perform token validation here
  if (sessionToken) {
    // Token is valid, allow access to the next message handling logic
    session = await SessionManager.validateUserSessionToken(sessionToken)
  } else if (refreshToken) {
    // Token is invalid or expired, check refresh token
    session = await SessionManager.validateSessionRefreshToken(refreshToken)
    session && (await SessionManager.refreshSession(session))
  }

  if (session) {
    const user = await UserManager.getById(session.userId)
    next({ session, user })
    return
  }
  next({ session, user: null })
}

export async function alchemyWebhook(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (token !== process.env.ALCHEMY_WEBHOOK_AUTH) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Token' })
  }
  if (req.clientIp !== process.env.ALCHEMY_IP_A && req.clientIp !== process.env.ALCHEMY_IP_B) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Origin' })
  }

  next()
}
