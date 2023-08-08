import { Advertisement } from "../models/Advertisement.model";
import { AdvertisementDbManager } from "../dal/Advertisement.data";

export abstract class AdvertisementManager {
  static createAdvertisement: CallableFunction = async (advert?: Advertisement) => {
    return await AdvertisementDbManager.put(advert);
  };

  static addAdvertisement: CallableFunction = async (advert: Advertisement) => {
    return await AdvertisementDbManager.put(advert);
  };

  static getAdvertisement: CallableFunction = async (advert?: Advertisement) => {
    return await AdvertisementDbManager.get(advert);
  };
}
