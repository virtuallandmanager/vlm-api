import { v4 as uuidv4 } from 'uuid'
import { docClient, vlmLogTable } from './common.data'
import { Log } from '../models/Log.model'
import { DateTime } from 'luxon'
import { User } from '../models/User.model'

export abstract class AdminLogDbManager {
  static retries: { [retryId: string]: number } = {}

  static addLogToDb = async (message: string | Object, metadata: Log.MetadataConfig, userInfo: User.Account, type: Log.Type, retryId?: string) => {
    const ts = DateTime.now().toMillis(),
      sk = retryId || uuidv4(),
      environment = process.env.NODE_ENV
    let newLog

    if (!metadata) {
      metadata = {}
    }

    switch (type) {
      case Log.Type.INFO:
        newLog = new Log.AdminLogInfo({ sk, type, message, metadata, environment, ts })
        break
      case Log.Type.WARNING:
        newLog = new Log.AdminLogWarning({ sk, type, message, metadata, environment, ts })
        break
      case Log.Type.ERROR:
        newLog = new Log.AdminLogError({ sk, type, message, metadata, environment, ts })
        break
      case Log.Type.WAT:
        newLog = new Log.AdminLogWAT({ sk, type, message, metadata, environment, ts, userInfo })
        break
      case Log.Type.FATAL:
        newLog = new Log.AdminLogFatal({ sk, type, message, metadata, environment, ts })
        break
    }

    const params = {
      TableName: vlmLogTable,
      Item: newLog,
    }
    try {
      console.log(`${Log.Type[type]} logged${metadata.from ? ` from ${metadata.from}` : ''}:`, '\nMessage:\n', message, '\nMetadata:\n', metadata)
      await docClient.put(params).promise()
      if (this.retries[sk]) {
        delete this.retries[sk]
      }
      return sk
    } catch (error) {
      if (this.retries[sk] && this.retries[sk] > 5) {
        delete this.retries[sk]
        return sk
      }
      this.retries.id++
      await this.addLogToDb(message, metadata, userInfo, type, sk)
      console.log(error)
      return { error: JSON.stringify(error), metadata }
    }
  }
}
