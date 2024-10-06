import axios from 'axios'
import { AdminLogDbManager } from '../dal/ErrorLogging.data'
import config from '../../config/config'
import { Log } from '../models/Log.model'
import { User } from '../models/User.model'

export abstract class AdminLogManager {
  static retries: { [retryId: string]: number } = {}

  static logInfo = async (log: string | Object, metadata: any, userInfo?: User.Account) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.INFO)
    } catch (error: any) {
      this.logError(error, { from: 'AdminLogManager.logInfo', metadata })
      console.log(error)
      return
    }
  }
  static logWarning = async (log: string | Object, metadata: any, userInfo?: User.Account) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.WARNING)
    } catch (error: any) {
      this.logError(error, { from: 'AdminLogManager.logWarning', metadata })
      console.log(error)
      return
    }
  }
  static logError = async (log: string | Object, metadata: any, userInfo?: User.Account, noCatch?: boolean) => {
    try {
      if (typeof log === 'string') {
        log = { text: log }
      } else {
        log = convertBigIntToString(log as Record<string, any>)
      }

      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.ERROR)

      if (!noCatch) {
        this.logErrorToDiscord(`<@&1041552453918801973>\n
      ${JSON.stringify(log)}\n
      -\n
      Environment: ${config.environment.toUpperCase()}\n
      Triggered By: ${metadata.from || 'Unknown Method'}\n
      Metadata: ${JSON.stringify(metadata)}}`)
      }
    } catch (error: any) {
      if (noCatch) {
        return
      }
      this.logError(error, { from: 'AdminLogManager.logError', metadata, failedOnce: true }, userInfo, true)
      console.log(error)
      return
    }
  }
  static logFatal = async (log: string | Object, metadata: any, userInfo: User.Account) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.FATAL)
    } catch (error: any) {
      this.logError(error, { from: 'AdminLogManager.logFatal', metadata })
      console.log(error)
      return
    }
  }
  static logWAT = async (log: string, metadata: any, userInfo?: User.Account) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.WAT)
      await this.logErrorToDiscord(log, true)
    } catch (error: any) {
      this.logError(error, { from: 'AdminLogManager.logWAT', metadata })
      console.log(error)
      return
    }
  }
  static logExternalError = async (log: string | Object, metadata: any, userInfo?: User.Account) => {
    try {
      if (typeof log === 'string') {
        log = { text: log }
      } else {
        log = convertBigIntToString(log as Record<string, any>)
      }
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.ERROR)
      this.logErrorToDiscord(`
      :rotating_light: -- ${userInfo ? 'USER-REPORTED ' : ''}ERROR LOGGED FROM ${config.environment.toUpperCase()} -- :rotating_light:\n
      <@&1041552453918801973>\n
      TIME:\n
      **${new Date().toLocaleString()}**\n\n
      ERROR:\n
      \`\`\`json\n${JSON.stringify(log, null, 2)}\n\`\`\`\n
      METADATA:\n
      \`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\`\n
      ${
        userInfo
          ? `AFFECTED USER:\n
      \`\`\`json\n${JSON.stringify(userInfo, null, 2)}\n\`\`\`\n`
          : ''
      }
      :rotating_light: -- END ERROR -- :rotating_light:\n
      `)
    } catch (error: any) {
      this.logError(error, { from: 'AdminLogManager.logExternalError', metadata })
      console.log(error)
      return
    }
  }

  static logErrorToDiscord = async (content: string, wat: boolean = false): Promise<void> => {
    try {
      //
      const webhook = wat ? process.env.DISCORD_BUG_REPORT_WEBHOOK : process.env.DISCORD_ERROR_WEBHOOK
      await axios.post(webhook, {
        content,
      })
    } catch (error: any) {
      console.log(error)
      return
    }
  }

  static logInternalUpdate = async (channel: string, content: string): Promise<void> => {
    try {
      let webhook

      switch (channel) {
        case 'giveaway':
          webhook = process.env.DISCORD_GIVEAWAY_WEBHOOK
          break
        case 'transactions':
          webhook = process.env.DISCORD_TRANSACITONS_WEBHOOK
          break
        case 'tier-limit':
          webhook = process.env.DISCORD_TIER_LIMITING_WEBHOOK
          break
        default:
          webhook = process.env.DISCORD_ERROR_WEBHOOK
          break
      }

      await axios.post(webhook, {
        content,
      })
    } catch (error: any) {
      console.log(error)
      return
    }
  }
}

function convertBigIntToString(obj: Record<string, any>): Record<string, any> {
  const convertedObject: Record<string, any> = {}

  for (const key in obj) {
    if (typeof obj[key] === 'bigint') {
      convertedObject[key] = obj[key].toString()
    } else {
      convertedObject[key] = obj[key]
    }
  }

  return convertedObject
}
