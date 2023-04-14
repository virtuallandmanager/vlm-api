import { Advertisement } from "../models/Advertisement.model";
import { docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";

export abstract class AdvertisementDbManager {
  static obtain: CallableFunction = async (adConfig: Advertisement) => {
    let existingAdvertisement, createdAdvertisement;
    try {
      existingAdvertisement = await this.get(adConfig);
      if (!existingAdvertisement) {
        createdAdvertisement = await this.put(adConfig);
      }

      return createdAdvertisement || existingAdvertisement;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Advertisement.data/obtain",
        adConfig,
      });
    }
  };

  static get: CallableFunction = async (adConfig: Advertisement) => {
    const ad = new Advertisement(adConfig),
      { pk, sk } = ad;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const adRecord = await docClient.get(params).promise();
      return adRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Advertisement.data/get",
        adConfig,
      });
    }
  };

  static put: CallableFunction = async (adConfig: Advertisement) => {
    const ad = new Advertisement(adConfig);

    const params = {
      TableName: vlmMainTable,
      Item: {
        ...ad,
        ts: Date.now(),
      },
    };

    try {
      const adRecord = await docClient.put(params).promise();
      return adRecord.Attributes;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Advertisement.data/put",
        adConfig,
      });
    }
  };
}
