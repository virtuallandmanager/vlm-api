import { AnalyticsUserDbManager } from "../dal/AnalyticsUser.data";
import { UserWalletDbManager } from "../dal/UserWallet.data";
import { Analytics } from "../models/Analytics.model";
import { BaseWallet } from "../models/Wallet.model";
import { UserManager } from "./User.logic";

export abstract class AnalyticsManager {
  static createUser: CallableFunction = async (userConfig: Analytics.User.Account) => {
    return await AnalyticsUserDbManager.put(userConfig);
  };

  static getUser: CallableFunction = async (userConfig: Analytics.User.Account) => {
    return await AnalyticsUserDbManager.get(userConfig);
  };

  static getUserById: CallableFunction = async (sk: string) => {
    return await AnalyticsUserDbManager.getById(sk);
  };

  static getUserByWallet: CallableFunction = async (wallet: string) => {
    return await AnalyticsUserDbManager.getByWallet(wallet)
  };

  static updateUser: CallableFunction = async (userConfig: Analytics.User.Account) => {
    return await AnalyticsUserDbManager.put(userConfig);
  };

  static obtainUserByWallet: CallableFunction = async (walletConfig: BaseWallet, userConfig: Analytics.User.Config) => {
    const existingHostUser = await UserManager.obtainUserByWallet(walletConfig);
    if (existingHostUser) {
      const matchedAnalyticsUser = await AnalyticsUserDbManager.obtain(new Analytics.User.Account(existingHostUser));
      return matchedAnalyticsUser;
    }
    const wallet = new Analytics.User.Wallet(walletConfig);
    const dbWallet = await UserWalletDbManager.obtain(wallet);
    const user = new Analytics.User.Account({ connectedWallet: dbWallet.sk, ...userConfig });
    const dbUser = await AnalyticsUserDbManager.obtainByWallet(user);
    return dbUser;
  };

  static obtainUser: CallableFunction = async (userConfig?: Analytics.User.Config) => {
    const user = new Analytics.User.Account(userConfig);
    return await AnalyticsUserDbManager.obtain(user);
  };
}
