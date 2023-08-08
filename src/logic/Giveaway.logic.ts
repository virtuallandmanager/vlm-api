import { GiveawayDbManager } from "../dal/Giveaway.data";
import { Accounting } from "../models/Accounting.model";
import { Analytics } from "../models/Analytics.model";
import { Giveaway } from "../models/Giveaway.model";

export abstract class GiveawayManager {
  static create: CallableFunction = async (giveaway: Giveaway.Config) => {
    return await GiveawayDbManager.put(giveaway);
  };

  static createItem: CallableFunction = async (giveawayItem: Giveaway.Item) => {
    return await GiveawayDbManager.addItem(giveawayItem);
  };

  static addClaim: CallableFunction = async (analyticsAction: Analytics.Session.Action, claim: Giveaway.Claim, transaction?: Accounting.Transaction) => {
    return await GiveawayDbManager.addClaim(analyticsAction, claim, transaction);
  };

  static get: CallableFunction = async (giveawayConfig?: Giveaway.Config) => {
    const giveaway = new Giveaway.Config(giveawayConfig);
    return await GiveawayDbManager.get(giveaway);
  };

  static getAllLegacy: CallableFunction = async (chunkCb: CallableFunction) => {
    return await GiveawayDbManager.getAllLegacy(chunkCb);
  };

  static getItemsForGiveaway: CallableFunction = async (items?: string[]) => {
    return await GiveawayDbManager.getItemsByIds(items);
  };
}
