import { GenericDbManager } from '../dal/Generic.data'
import { HistoryDbManager } from '../dal/History.data'
import { History } from '../models/History.model'
import { Scene } from '../models/Scene.model'
import { User } from '../models/User.model'
import { AdminLogManager } from './ErrorLogging.logic'

export abstract class HistoryManager {
  static initHistory: CallableFunction = async (user: User.Account, state: { pk: string; sk: string; [key: string]: unknown }) => {
    const { sk } = state,
      { displayName } = user,
      userId = user.sk,
      descriptors = {
        action: 'created',
        element: state.pk,
        id: state.sk,
      }

    try {
      const history = new History.Config({ sk }),
        historyRoot = new History.Root({ sk, root: state }),
        firstUpdate = new History.Update({ sk, userId, displayName, historyId: history.sk, ...descriptors })

      return await HistoryDbManager.initHistory(history, historyRoot, firstUpdate)
    } catch (error: unknown) {
      AdminLogManager.logError(error, { text: 'Failed to create history!', from: 'History.logic/createHistory' })
    }
  }

  static getHistory: CallableFunction = async (sk: string) => {
    return await GenericDbManager.get({ pk: History.Config.pk, sk })
  }

  static getHistoryRoot: CallableFunction = async (sk: string) => {
    return await GenericDbManager.get({ pk: History.Root.pk, sk })
  }

  static getHistoryUpdate: CallableFunction = async (sk: string) => {
    return await GenericDbManager.get({ pk: History.Update.pk, sk })
  }

  static addUpdate: CallableFunction = async (user: User.Account, sk: string, descriptors: History.IUpdateDescriptors, sceneData?: Scene.Config) => {
    const { displayName } = user,
      userId = user.sk
    try {
      let history = await HistoryDbManager.get(new History.Config({ sk })),
        update

      // create a new history config if none exists
      if (!history) {
        history = await HistoryManager.initHistory(user, { sk })
      }

      // add a root update if none exists
      if (history?.updates?.length === 0) {
        update = new History.Root({ sk, root: sceneData })
      } else if (!history) {
        AdminLogManager.logError('History Log does not exist amd could not be created.', {
          text: 'History log does not exist.',
          from: 'History.logic/addUpdate',
        })
        return
      }

      // create a new update
      update = new History.Update({ userId, displayName, historyId: history.sk, ...descriptors })

      await HistoryDbManager.addUpdateToHistory(history, update)
    } catch (error: unknown) {
      AdminLogManager.logError(error, {
        text: 'Failed to update history log!',
        from: 'History.logic/addUpdate',
      })
    }
  }
}
