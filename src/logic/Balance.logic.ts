import { Advertisement } from "../models/Advertisement.model";
import { AdvertisementDbManager } from "../dal/Advertisement.data";
import { OrganizationDbManager } from "../dal/Organization.data";
import { Organization } from "../models/Organization.model";
import { UserDbManager } from "../dal/User.data";

export abstract class BalanceManager {
  static createAdvertisement: CallableFunction = async (
    adConfig?: Advertisement
  ) => {
    const event = new Advertisement(adConfig);
    return await AdvertisementDbManager.put(event);
  };

  static adjustOrgBalance: CallableFunction = async (
    balance: Organization.Balance,
    adjustment: number
  ) => {
    balance.value += adjustment;
    return await OrganizationDbManager.updateBalance(event);
  };

  static getUserBalance: CallableFunction = async (balanceId?: string) => {
    return await UserDbManager.getBalance(balanceId);
  };

  static getOrgBalance: CallableFunction = async (balanceId?: string) => {
    return await OrganizationDbManager.getBalance(balanceId);
  };
}
