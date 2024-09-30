import { GenericDbManager } from '../dal/Generic.data'
import { Media } from '../models/Media.model'

export abstract class MediaManager {
  static addCommunityChannel: CallableFunction = async (sk: string, channel: Media.Channel) => {
    return await GenericDbManager.put({ pk: Media.Channel.pk, sk, ...channel })
  }
  static getCommunityChannels: CallableFunction = async (sk: string) => {
    return await GenericDbManager.getAll({ pk: Media.Channel.pk })
  }
}
