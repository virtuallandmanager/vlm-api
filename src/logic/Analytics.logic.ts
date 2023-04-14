import { AnalyticsUserDbManager } from "../dal/AnalyticsUser.data";
import { UserWalletDbManager } from "../dal/UserWallet.data";
import { Analytics } from "../models/Analytics.model";
import { BaseWallet } from "../models/Wallet.model";

export abstract class AnalyticsManager {
  static createUser: CallableFunction = async (userConfig?: Analytics.User.Config) => {
    const user = new Analytics.User.Account(userConfig);
    return await AnalyticsUserDbManager.put(user);
  };

  static getUser: CallableFunction = async (userConfig?: Analytics.User.Config) => {
    const vlmUser = new Analytics.User.Account(userConfig);
    return await AnalyticsUserDbManager.get(vlmUser);
  };

  static updateUser: CallableFunction = async (userConfig?: Analytics.User.Config) => {
    const vlmUser = new Analytics.User.Account(userConfig);
    return await AnalyticsUserDbManager.put(vlmUser);
  };

  static obtainUserByWallet: CallableFunction = async (walletConfig?: BaseWallet) => {
    const wallet = new Analytics.User.Wallet(walletConfig);
    const dbWallet = await UserWalletDbManager.obtain(wallet);
    const dbUser = await AnalyticsUserDbManager.getById(dbWallet.userId);
    return dbUser;
  };

  static obtainUser: CallableFunction = async (userConfig?: Analytics.User.Config) => {
    const user = new Analytics.User.Account(userConfig);
    return await AnalyticsUserDbManager.obtain(user);
  };
}
