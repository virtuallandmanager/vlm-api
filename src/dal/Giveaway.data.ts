import { Giveaway } from "../models/Giveaway.model";
import { docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";

export abstract class GiveawayDbManager {
  static get: CallableFunction = async (giveawayConfig: Giveaway.Config) => {
    const giveaway = new Giveaway.Config(giveawayConfig),
      { pk, sk } = giveaway;

    const params = {
      TableName: vlmMainTable,   
      Key: {
        pk,
        sk,
      },
    };

    try {
      const giveawayRecord = await docClient.get(params).promise();
      return giveawayRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Giveaway.data/get",
        giveawayConfig,
      });
    }
  };

  static put: CallableFunction = async (giveawayConfig: Giveaway.Config) => {
    const giveaway = new Giveaway.Config(giveawayConfig);

    const params = {
      TableName: vlmMainTable,
      Item: {
        ...giveaway,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return giveaway;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Giveaway.data/put",
        giveawayConfig,
      });
    }
  };
}
