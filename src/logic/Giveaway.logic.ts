import { GiveawayDbManager } from "../dal/Giveaway.data";
import { Giveaway } from "../models/Giveaway.model";

export abstract class GiveawayManager {
  static createEventGiveaway: CallableFunction = async (giveawayConfig?: Giveaway.Config) => {
    const giveaway = new Giveaway.Config(giveawayConfig);
    return await GiveawayDbManager.put(giveaway);
  };

  static addEventGiveaway: CallableFunction = async (giveaway: Giveaway.Config) => {
    return await GiveawayDbManager.put(giveaway);
  };

  static getEventGiveaway: CallableFunction = async (giveawayConfig?: Giveaway.Config) => {
    const giveaway = new Giveaway.Config(giveawayConfig);
    return await GiveawayDbManager.get(giveaway);
  };
}
