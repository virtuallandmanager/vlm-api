import {
  Advertisement,
  TAdvertisementConfig,
} from "../models/Advertisement.model";
import { AdvertisementDbManager } from "../dal/Advertisement.data";

export abstract class AdvertisementManager {
  static createAdvertisement: CallableFunction = async (
    eventConfig?: TAdvertisementConfig
  ) => {
    const event = new Advertisement(eventConfig);
    return await AdvertisementDbManager.put(event);
  };

  static addAdvertisement: CallableFunction = async (event: Advertisement) => {
    return await AdvertisementDbManager.put(event);
  };

  static getAdvertisement: CallableFunction = async (
    eventConfig?: TAdvertisementConfig
  ) => {
    const event = new Advertisement(eventConfig);
    return await AdvertisementDbManager.get(event);
  };
}
