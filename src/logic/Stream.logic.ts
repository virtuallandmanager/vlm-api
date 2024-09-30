import { Stream } from '../models/Stream.model'
import { StreamDbManager } from '../dal/Stream.data'
import { AdminLogManager } from './ErrorLogging.logic'

export abstract class StreamManager {
  static obtain: CallableFunction = async (sceneConfig?: Stream.Config) => {
    try {
      let scene = await StreamDbManager.get(sceneConfig)
      if (!scene) {
        scene = await StreamDbManager.put(new Stream.Config(sceneConfig))
      }
      return scene
    } catch (error) {
      AdminLogManager.logError(error, { from: 'StreamManager.obtain' })
    }
  }

  static getStreamsForUser: CallableFunction = async (userId: string) => {
    try {
      return await StreamDbManager.getAllForUserId(userId)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'StreamManager.getStreamsForUser' })
    }
  }
}
