import { BalanceDbManager } from '../dal/Balance.data'
import { GenericDbManager } from '../dal/Generic.data'
import { SceneDbManager } from '../dal/Scene.data'
import { TransactionDbManager } from '../dal/Transaction.data'
import { UserDbManager } from '../dal/User.data'
import { UserWalletDbManager } from '../dal/UserWallet.data'
import { User } from '../models/User.model'
import { WalletConfig } from '../models/Wallet.model'
import { AdminLogManager } from './ErrorLogging.logic'

export abstract class UserManager {
  static create: CallableFunction = async (vlmUser: User.Account) => {
    return await UserDbManager.put(vlmUser)
  }

  static get: CallableFunction = async (vlmUser: User.Account) => {
    return await UserDbManager.get(vlmUser)
  }

  static getById: CallableFunction = async (userId: string) => {
    return await UserDbManager.getById(userId)
  }

  static getAdminLevel: CallableFunction = async (vlmUser: User.Account) => {
    if (!vlmUser.roles) {
      return User.Roles.BASIC_USER
    }
    return Math.max(...vlmUser.roles)
  }

  static getInvites: CallableFunction = async (userId: string) => {
    const orgInvites = await UserDbManager.getOrgInvites(userId),
      sceneInvites = await UserDbManager.getSceneInvites(userId)

    return { orgInvites, sceneInvites }
  }

  static update: CallableFunction = async (user: User.Account) => {
    return await UserDbManager.put(user)
  }

  static updateIp: CallableFunction = async (user: User.Account) => {
    return await UserDbManager.updateIp(user)
  }

  static obtainUserByWallet: CallableFunction = async (walletConfig: WalletConfig, newUserInfo: Partial<User.Account>) => {
    try {
      const wallet = new User.Wallet(walletConfig)
      const userWallet = await UserWalletDbManager.obtain(wallet)
      const user = new User.Account({ sk: userWallet.userId, connectedWallet: userWallet.sk, ...newUserInfo })
      let dbUser = await UserDbManager.obtain(user)
      if (newUserInfo) {
        const updatedUser = new User.Account({ ...dbUser, ...newUserInfo })
        dbUser = await UserDbManager.put(updatedUser)
      }
      return dbUser
    } catch (error: any) {
      AdminLogManager.logError(error, { from: 'UserManager.obtainUserByWallet' })
      console.log(error)
      return
    }
  }

  static obtain: CallableFunction = async (user: User.Account) => {
    return await UserDbManager.obtain(user)
  }

  static obtainBalances: CallableFunction = async (user: User.Account) => {
    return await UserDbManager.obtainBalances(user)
  }

  static injectUiData: CallableFunction = async (vlmUser: User.Account) => {
    // injects data that's only used by the UI side of VLM
    const uiUserInfo = new User.Aggregates()
    uiUserInfo.walletIds = await UserWalletDbManager.getIdsForUser(vlmUser)
    uiUserInfo.sceneIds = await SceneDbManager.getIdsForUser(vlmUser.sk)
    uiUserInfo.transactionIds = await TransactionDbManager.getIdsForUser(vlmUser.sk)
    uiUserInfo.balanceIds = await BalanceDbManager.getIdsForUser(vlmUser)
  }

  static createUserRoles: CallableFunction = async () => {
    await User.InitialRoles.forEach(async (role: User.Role) => {
      return (await GenericDbManager.put(role)) as User.Role
    })
  }

  static createSceneLink: CallableFunction = async (sceneLink: User.SceneLink) => {
    return (await GenericDbManager.put(sceneLink)) as User.SceneLink
  }

  static createMediaLink: CallableFunction = async (mediaLink: User.MediaLink) => {
    return (await GenericDbManager.put(mediaLink)) as User.MediaLink
  }

  // getUserRole gets the name and description of a user role by the id of that user role.
  // to get roles for a userId, get a user account and look at the roles attribute.
  static getUserRole: CallableFunction = async (id: User.Roles) => {
    return await UserDbManager.getUserRole(id)
  }
}
