import ipHelper from '../helpers/ip'
import jwt from 'jsonwebtoken'
import { SessionDbManager } from '../dal/Session.data'
import { DateTime } from 'luxon'
import { ethers } from 'ethers'
import { AdminLogManager } from './ErrorLogging.logic'
import { Analytics } from '../models/Analytics.model'
import { User } from '../models/User.model'
import { Session as BaseSession } from '../models/Session.model'
import { UserManager } from './User.logic'
import { redis } from '../dal/common.data'

const analyticsRestrictedScenes: string[] = SessionDbManager.restoreRedisArray('analyticsRestrictedScenes') // stores urns of scene id and actions that have been restricted
const sceneIdUsageRecords: Record<string, { count: number; lastReset: number }> = {}
type SessionRequestPattern = Record<string, number[]> // session guid, timestamps
const sceneRequestPatterns: Record<string, SessionRequestPattern> = {}

const cleanupSceneIdUsageRecord: CallableFunction = () => {
  const currentTimestamp = Date.now()
  for (const [sceneId, usage] of Object.entries(sceneIdUsageRecords)) {
    if (currentTimestamp - usage.lastReset > 1000) {
      delete sceneIdUsageRecords[sceneId]
    }
  }
}

setInterval(() => {
  AdminLogManager.logErrorToDiscord(
    'Rate Limiter Cache Status:' + JSON.stringify({ analyticsRestrictedScenes, sceneIdUsageRecords, sceneRequestPatterns }),
    true
  )
}, 1000 * 60 * 30)

const hasConsistentInterval: CallableFunction = (sessionAction: Analytics.Session.Action): boolean => {
  try {
    const sceneActionKey = `${sessionAction.sceneId}:${sessionAction.name}`,
      sceneSessionActionKey = `${sessionAction.sceneId}:${sessionAction.sessionId}:${sessionAction.name}`,
      sceneSessionActionPattern = sceneRequestPatterns[sceneActionKey][sessionAction.sessionId]

    // if there are less than 5 timestamps, we need more data to determine if the interval is consistent
    if (sceneSessionActionPattern.length < 5) return false

    // Calculate intervals between timestamps
    let intervals = []
    for (let i = 1; i < sceneRequestPatterns[sceneSessionActionKey][sessionAction.sessionId].length; i++) {
      intervals.push(sceneSessionActionPattern[i] - sceneSessionActionPattern[i - 1])
    }

    // Calculate the average interval
    const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length

    // Define the threshold for consistency (here, half a second or 500 milliseconds)
    const threshold = 500 // milliseconds

    // Check if all intervals are within the threshold of the average interval
    const consistent = intervals.every((interval) => Math.abs(interval - averageInterval) < threshold)

    if (consistent) {
      return true
    } else if (sceneSessionActionPattern.length > 20) {
      // clear this pattern from the cache if it's not consistent and there are more than 20 timestamps
      delete sceneRequestPatterns[sceneActionKey][sessionAction.sessionId]
    }
    return false
  } catch (error) {
    AdminLogManager.logError('Failed to check for consistent interval', {
      from: 'Session Action Rate Limiter - Interval Checker',
      sessionAction: JSON.stringify(sessionAction),
      patterns: JSON.stringify(sceneRequestPatterns),
    })
    return false
  }
}

const rateLimitAnalyticsAction: CallableFunction = (config: Analytics.Session.Action) => {
  try {
    const sceneActionKey = `${config.sceneId}:${config.name}`,
      currentTimestamp = DateTime.now().toUnixInteger()

    // Deny request if scene has been restricted from submitting this action
    if (analyticsRestrictedScenes.includes(sceneActionKey)) {
      return false
    }

    //// START RATE LIMITING LOGIC ////

    // Check if action has an exsiting request pattern for this scene
    if (!sceneRequestPatterns[sceneActionKey]) {
      // If not, create a new request pattern for this scene
      sceneRequestPatterns[sceneActionKey] = {
        [config.sessionId]: [config.ts],
      }
    } else if (sceneRequestPatterns[sceneActionKey][config.sessionId]) {
      // If there's an existing request pattern for this scene and session, add this timestamp
      sceneRequestPatterns[sceneActionKey][config.sessionId].push(config.ts)
    } else {
      // If not, create a new request pattern for this scene and session id
      sceneRequestPatterns[sceneActionKey][config.sessionId] = [config.ts]
    }

    // Check for consistent interval pattern
    if (hasConsistentInterval(config)) {
      // If this scene is submitting actions at a consistent interval, restrict it from submitting this action
      analyticsRestrictedScenes.push(sceneActionKey)
      redis.set('analyticsRestrictedScenes', JSON.stringify(analyticsRestrictedScenes))
      // Remove this scene action from the request patterns cache
      delete sceneRequestPatterns[sceneActionKey]

      AdminLogManager.logError(
        `${config.sceneId} is submitting analytics actions at a consistent interval and has been restricted from submitting "${config.name}" actions.`,
        {
          from: 'Session Action Rate Limiter',
          config,
          patterns: JSON.stringify(sceneRequestPatterns),
        }
      )
      return false
    }

    const usage = sceneIdUsageRecords[sceneActionKey]

    if (!usage || currentTimestamp - usage.lastReset > 1000) {
      // Set object if new sceneId or more than a second has passed
      sceneIdUsageRecords[sceneActionKey] = {
        count: 1,
        lastReset: currentTimestamp,
      }
    } else if (usage.count <= 100) {
      // Increment count
      usage.count++
    } else if (usage.count > 100) {
      // Rate limit exceeded
      AdminLogManager.logError(`${config.sceneId} has been rate limited on "${config.name}" actions.`, {
        from: 'Session Action Rate Limiter',
      })
      analyticsRestrictedScenes.push(sceneActionKey)
      return false
    }
    //// END RATE LIMITING LOGIC ////
  } catch (error) {
    AdminLogManager.logError('Failed to check for consistent interval', {
      from: 'Session Action Rate Limiter - Main Try/Catch',
      error: JSON.stringify(error),
      sessionAction: JSON.stringify(config),
      patterns: JSON.stringify(sceneRequestPatterns),
    })
    return false
  }
}

export abstract class SessionManager {
  static getSessionStats: CallableFunction = async () => {
    try {
      return { analyticsRestrictedScenes, sceneIdUsageRecords, sceneRequestPatterns }
    } catch (error) {
      AdminLogManager.logError('Failed to get session stats', { from: 'Session.logic/getSessionStats' })
      console.log(error)
      return
    }
  }

  static initAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    try {
      const session = new Analytics.Session.Config(config)
      return await SessionDbManager.create(session, { minutes: 10 })
    } catch (error: any) {
      AdminLogManager.logError('Failed to initialize analytics session', config)
      console.log(error)
      return
    }
  }

  static startAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    try {
      const recentSession = await SessionDbManager.getRecentAnalyticsSession(config.userId)
      if (recentSession) {
        await SessionDbManager.refresh(recentSession)
      }
      return recentSession || (await SessionDbManager.start(new Analytics.Session.Config(config)))
    } catch (error: any) {
      AdminLogManager.logError('Failed to start analytics session', config)
      console.log(error)
      return
    }
  }

  static startBotSession: CallableFunction = async (config: Analytics.Session.BotConfig) => {
    try {
      const recentSession = await SessionDbManager.getRecentAnalyticsSession(config.userId)
      if (recentSession) {
        await SessionDbManager.refresh(recentSession)
      }
      return recentSession || (await SessionDbManager.start(new Analytics.Session.Config(config)))
    } catch (error: any) {
      AdminLogManager.logError('Failed to start analytics session', config)
      console.log(error)
      return
    }
  }

  static refreshSession: CallableFunction = async (config: User.Session.Config) => {
    try {
      this.issueUserSessionToken(config)
      this.issueSignatureToken(config)
      return await SessionDbManager.refresh(config)
    } catch (error: any) {
      AdminLogManager.logError('Failed to refresh session', config)
      console.log(error)
      return
    }
  }

  static getAnalyticsSession: CallableFunction = async (config: Analytics.Session.Config) => {
    try {
      const session = new Analytics.Session.Config(config)
      return await SessionDbManager.get(session)
    } catch (error) {
      AdminLogManager.logError('Failed to get analytics session', config)
      console.log(error)
      return
    }
  }

  static endAnalyticsSession: CallableFunction = async (session: Analytics.Session.Config) => {
    try {
      if (session && session.pk && session.sk && !session.sessionEnd) {
        await SessionDbManager.end(session)
      } else if (session.sessionEnd) {
        AdminLogManager.logError('Tried to end a session that is already over', session.sk)
      } else {
        AdminLogManager.logError('Session failed to end', session.sk)
      }
    } catch (error: any) {
      AdminLogManager.logError('Session failed to end', session.sk)
      console.log(error)
      return
    }
  }

  static logAnalyticsAction: CallableFunction = async (config: Analytics.Session.Action) => {
    try {
      const action = new Analytics.Session.Action(config)
      const rateLimited = rateLimitAnalyticsAction(action)
      if (rateLimited) {
        return false
      }
      const logResponse = await SessionDbManager.logAnalyticsAction(action)

      if (logResponse?.error && logResponse.sceneActionKey && !analyticsRestrictedScenes.includes(logResponse.sceneActionKey)) {
        analyticsRestrictedScenes.push(logResponse.sceneActionKey)
        AdminLogManager.logError(
          `${config.sceneId} has caused a Throttling Exception and has been restricted from submitting "${config.name}" actions.`,
          {
            from: 'Session.logic/logAnalyticsAction',
          }
        )
      }
    } catch (error) {
      AdminLogManager.logError('Failed to log analytics action', {
        from: 'Session.logic/logAnalyticsAction',
        config: JSON.stringify(config),
      })
      return
    }
  }

  static getServerRestrictions: CallableFunction = async () => {
    try {
      return {
        analyticsRestrictedScenes,
        sceneIdUsageRecords,
        sceneRequestPatterns,
      }
    } catch (error) {
      AdminLogManager.logError('Failed to get server restrictions', {
        from: 'Session.logic/getServerRestrictions',
      })
      return
    }
  }

  static storePreSession: CallableFunction = async (session: Analytics.Session.Config | User.Session.Config) => {
    try {
      return await SessionDbManager.create(session, { minutes: 10 })
    } catch (error) {
      AdminLogManager.logError('Failed to store pre-session', session.sk)
    }
  }

  static startVLMSession: CallableFunction = async (config: User.Session.Config) => {
    try {
      const session = new User.Session.Config(config)
      const user = await UserManager.getById(session.userId)
      const updatedUser = new User.Account({
        ...user,
        lastIp: session.clientIp,
      })
      await UserManager.updateIp(updatedUser)
      await SessionDbManager.start(session)
      return session
    } catch (error) {
      AdminLogManager.logError('Failed to store pre-session', config.sk)
      console.log(error)
      return
    }
  }

  static getVLMSession: CallableFunction = async (config: User.Session.Config) => {
    try {
      if (config.sk) {
        const session = new User.Session.Config(config)
        return await SessionDbManager.get(session)
      } else {
        const activeSessions = await SessionDbManager.activeVLMSessionsByUserId(config.userId)

        if (!activeSessions.length) {
          return
        }

        const chosenSession = await SessionDbManager.get(activeSessions[0])
        await activeSessions.forEach(async (session: User.Session.Config, i: number) => {
          if (i > 0) {
            await this.endVLMSession(session)
          }
        })
        return chosenSession
      }
    } catch (error) {
      AdminLogManager.logError('Failed to get VLM session', config)
      console.log(error)
      return
    }
  }

  static endVLMSession: CallableFunction = async (config: User.Session.Config) => {
    try {
      const session = await SessionDbManager.get(config)
      if (session && !session.sessionEnd) {
        return await SessionDbManager.end(session)
      } else {
        return
      }
    } catch (error) {
      AdminLogManager.logError('Failed to end VLM session', config)
      console.log(error)
      return
    }
  }

  static renew: CallableFunction = async (session: User.Session.Config) => {
    try {
      SessionManager.issueUserSessionToken(session)
      SessionManager.issueSignatureToken(session)
      return await SessionDbManager.renew(session)
    } catch (error) {
      AdminLogManager.logError('Failed to renew VLM session', session)
      console.log(error)
      return
    }
  }

  static issueUserSessionToken: CallableFunction = (session: User.Session.Config) => {
    session.expires = DateTime.now().plus({ minutes: 30 }).toUnixInteger()
    session.sessionToken = jwt.sign(
      {
        pk: session.pk,
        sk: session.sk,
        userId: session.userId,
        iat: DateTime.now().toUnixInteger(),
        nonce: DateTime.now().toUnixInteger(),
      },
      process.env.JWT_ACCESS,
      {
        expiresIn: '30m',
      }
    )
    return session.sessionToken
  }

  static issueAnalyticsSessionToken: CallableFunction = (session: Analytics.Session.Config) => {
    session.expires = DateTime.now().plus({ hours: 12 }).toUnixInteger()
    session.sessionToken = jwt.sign(
      {
        pk: session.pk,
        sk: session.sk,
        userId: session.userId,
        iat: DateTime.now().toUnixInteger(),
        nonce: DateTime.now().toUnixInteger(),
      },
      process.env.JWT_ANALYTICS,
      {
        expiresIn: '12h',
      }
    )
    return session.sessionToken
  }

  static issueRefreshToken: CallableFunction = (session: User.Session.Config) => {
    session.expires = DateTime.now().plus({ days: 14 }).toUnixInteger()
    session.refreshToken = jwt.sign(
      {
        sk: session.sk,
        userId: session.userId,
        iat: DateTime.now().toUnixInteger(),
        nonce: DateTime.now().toUnixInteger(),
      },
      process.env.JWT_REFRESH,
      {
        expiresIn: '14d',
      }
    )
    return session.refreshToken
  }

  static issueSignatureToken: CallableFunction = (session: Analytics.Session.Config | User.Session.Config) => {
    session.signatureToken = jwt.sign(
      {
        pk: session.pk,
        sk: session.sk,
        userId: session.userId,
        iat: DateTime.now().toUnixInteger(),
        nonce: DateTime.now().toUnixInteger(),
      },
      process.env.JWT_SIGNATURE,
      {
        expiresIn: '90s',
      }
    )
    return session.signatureToken
  }

  static validateUserSessionToken: CallableFunction = async (sessionToken: string) => {
    let decodedSession
    try {
      decodedSession = jwt.verify(sessionToken, process.env.JWT_ACCESS)
    } catch (error) {
      return false
    }

    try {
      let dbSession = await SessionDbManager.get(decodedSession)

      if (!dbSession) {
        AdminLogManager.logError('No Session Found', {
          from: 'Session Validation Middleware',
          decodedSession,
        })
        return false
      }

      if (dbSession.sessionToken !== sessionToken) {
        AdminLogManager.logWarning('Session Token Mismatch', {
          from: 'Session Validation Middleware',
          decodedSession,
        })
        return
      } else if (dbSession.sessionEnd >= DateTime.now().toUnixInteger()) {
        AdminLogManager.logInfo('Session Has Ended', {
          from: 'Session Validation Middleware',
          decodedSession,
        })
        return
      } else {
        return dbSession
      }
    } catch (error) {
      AdminLogManager.logError('Session Validation Failed', {
        from: 'Session Validation Middleware',
        decodedSession,
      })
      return false
    }
  }

  static validateAnalyticsSessionToken: CallableFunction = async (sessionToken: string) => {
    let decodedSession
    try {
      decodedSession = jwt.verify(sessionToken, process.env.JWT_ANALYTICS)
    } catch (error) {
      return false
    }

    try {
      let dbSession = await SessionDbManager.get(decodedSession)

      if (!dbSession) {
        AdminLogManager.logError('No Session Found', {
          from: 'Session Validation Middleware',
          decodedSession,
        })
        return false
      }

      if (dbSession.sessionToken !== sessionToken) {
        AdminLogManager.logWarning('Session Token Mismatch', {
          from: 'Session Validation Middleware',
          decodedSession,
        })
        return
      } else if (dbSession.sessionEnd >= DateTime.now().toUnixInteger()) {
        AdminLogManager.logInfo('Session Has Ended', {
          from: 'Session Validation Middleware',
          decodedSession,
        })
        return
      } else {
        return dbSession
      }
    } catch (error) {
      AdminLogManager.logError('Session Validation Failed', {
        from: 'Session Validation Middleware',
        decodedSession,
      })
      return false
    }
  }

  static validateSignatureToken: CallableFunction = async (config: {
    signatureToken: string
    signature: string
    signatureAccount: string
    signatureMessage: string
  }) => {
    let dbSession,
      decodedSession,
      { signatureToken, signature, signatureAccount, signatureMessage } = config
    try {
      decodedSession = jwt.verify(signatureToken, process.env.JWT_SIGNATURE)
    } catch (error) {
      return
    }

    try {
      if (!decodedSession) {
        AdminLogManager.logError('No Session Decoded', {
          from: 'Signature Validation Middleware',
          object: jwt.verify(signatureToken, process.env.JWT_SIGNATURE) as String,
        })
        return
      }

      dbSession = await SessionDbManager.get(decodedSession)
      if (!dbSession) {
        AdminLogManager.logError('No Session Found', {
          from: 'Signature Validation Middleware',
          decodedSession,
        })
        return
      }

      if (dbSession.sessionEnd > DateTime.now().toUnixInteger()) {
        AdminLogManager.logError('Session Already Ended.', {
          from: 'Signature Validation Middleware',
          decodedSession,
        })
        return
      }

      const initialAddress = dbSession?.connectedWallet, // the address that originally requested to connect
        reportedAddress = signatureAccount, // the address that the client says signed the message
        actualAddress = ethers.verifyMessage(
          // who signed the message according to the cryptographic signature
          signatureMessage,
          signature
        )

      if (![initialAddress.toLowerCase(), reportedAddress.toLowerCase()].every((address) => address == actualAddress.toLowerCase())) {
        AdminLogManager.logError('Signature/Session Address Mismatch', {
          from: 'Signature Validation Middleware',
          decodedSession,
          dbSession,
          signatureAccount,
        })
        return
      }

      if (dbSession.signatureToken !== signatureToken) {
        AdminLogManager.logError('Signature Token Mismatch', {
          from: 'Signature Validation Middleware',
          dbSession,
          signatureToken,
        })
        return
      }

      return dbSession
    } catch (error) {
      AdminLogManager.logError('Signature Validation Failed', {
        from: 'Signature Validation Middleware',
        decodedSession,
        dbSession,
        signatureToken,
      })
      return
    }
  }

  static validateSessionRefreshToken: CallableFunction = async (refreshToken: string) => {
    let decodedSession: Partial<User.Session.Config>
    try {
      decodedSession = jwt.verify(refreshToken, process.env.JWT_REFRESH) as Partial<User.Session.Config>
    } catch (error) {
      return false
    }

    try {
      let dbSession = await SessionDbManager.get({
        pk: User.Session.Config.pk,
        ...decodedSession,
      })

      if (!dbSession) {
        AdminLogManager.logError('No Session Found', {
          from: 'Session Validation Middleware',
          decodedSession,
        })
        return false
      }

      if (dbSession.refreshToken !== refreshToken) {
        AdminLogManager.logWarning('Session Token Mismatch', {
          from: 'Session Validation Middleware',
          decodedSession,
        })
        return
      } else if (dbSession.sessionEnd >= DateTime.now().toUnixInteger()) {
        AdminLogManager.logInfo('Session Has Ended', {
          from: 'Session Validation Middleware',
          decodedSession,
        })
        return
      } else {
        return dbSession
      }
    } catch (error) {
      AdminLogManager.logError('Session Validation Failed', {
        from: 'Session Validation Middleware',
        decodedSession,
      })
      return false
    }
  }

  static getIpData: CallableFunction = async (session: BaseSession.Config) => {
    session.ipData = await ipHelper.addIpData(session.clientIp)
  }

  static createSessionPath: CallableFunction = async (sessionConfig: Analytics.Session.Config, sessionPathConfig?: Analytics.Path) => {
    const sessionPath = new Analytics.Path(sessionPathConfig)
    await SessionDbManager.createPath(sessionConfig, sessionPath)
    return sessionPath
  }

  static extendPath: CallableFunction = async (pathId: string, pathSegments: Analytics.PathSegment[]) => {
    const segments = pathSegments.map((segment: Analytics.PathSegment) => new Analytics.PathSegment({ ...segment, pathId }))
    return await SessionDbManager.addPathSegments(pathId, segments)
  }

  static addPath: CallableFunction = async (userSessionPath: Analytics.Path) => {
    return await SessionDbManager.createPath(userSessionPath)
  }

  static getSessionPath: CallableFunction = async (userSessionPath?: Analytics.Path) => {
    return await SessionDbManager.getPath(userSessionPath)
  }
}
