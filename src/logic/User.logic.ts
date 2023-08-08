import { BalanceDbManager } from "../dal/Balance.data";
import { GenericDbManager } from "../dal/Generic.data";
import { SceneDbManager } from "../dal/Scene.data";
import { TransactionDbManager } from "../dal/Transaction.data";
import { UserDbManager } from "../dal/User.data";
import { UserWalletDbManager } from "../dal/UserWallet.data";
import { User } from "../models/User.model";
import { BaseWallet } from "../models/Wallet.model";

export abstract class UserManager {
  static create: CallableFunction = async (vlmUser: User.Account) => {
    return await UserDbManager.put(vlmUser);
  };

  static get: CallableFunction = async (vlmUser: User.Account) => {
    return await UserDbManager.get(vlmUser);
  };

  static getById: CallableFunction = async (userId: string) => {
    return await UserDbManager.getById(userId);
  };

  static getAdminLevel: CallableFunction = async (vlmUser: User.Account) => {
    if (!vlmUser.roles) {
      return User.Roles.BASIC_USER;
    }
    return Math.max(...vlmUser.roles);
  };

  static update: CallableFunction = async (vlmUser: User.Account) => {
    return await UserDbManager.put(vlmUser);
  };

  static updateIp: CallableFunction = async (vlmUser: User.Account) => {
    return await UserDbManager.updateIp(vlmUser);
  };

  static obtainUserByWallet: CallableFunction = async (walletConfig?: BaseWallet) => {
    const wallet = new User.Wallet(walletConfig);
    const userWallet = await UserWalletDbManager.obtain(wallet);
    const user = new User.Account({ sk: userWallet.userId, connectedWallet: userWallet.sk });
    const dbUser = await UserDbManager.obtain(user);
    return dbUser;
  };

  static obtain: CallableFunction = async (user: User.Account) => {
    return await UserDbManager.obtain(user);
  };

  static injectUiData: CallableFunction = async (vlmUser: User.Account) => {
    const uiUserInfo = new User.Aggregates();
    uiUserInfo.walletIds = await UserWalletDbManager.getIdsForUser(vlmUser);
    uiUserInfo.sceneIds = await SceneDbManager.getIdsForUser(vlmUser.sk);
    uiUserInfo.transactionIds = await TransactionDbManager.getIdsForUser(vlmUser.sk);
    uiUserInfo.balanceIds = await BalanceDbManager.getIdsForUser(vlmUser);
  };

  static createUserRoles: CallableFunction = async () => {
    await User.InitialRoles.forEach(async (role: User.Role) => {
      return (await GenericDbManager.put(role)) as User.Role;
    });
  };

  static createSceneLink: CallableFunction = async (sceneLink: User.SceneLink) => {
    return (await GenericDbManager.put(sceneLink)) as User.SceneLink;
  };

  static createMediaLink: CallableFunction = async (mediaLink: User.MediaLink) => {
    return (await GenericDbManager.put(mediaLink)) as User.MediaLink;
  };

  // getUserRole gets the name and description of a user role by the id of that user role.
  // to get roles for a userId, get a user account and look at the roles attribute.
  static getUserRole: CallableFunction = async (id: User.Roles) => {
    return await UserDbManager.getUserRole(id);
  };
}
