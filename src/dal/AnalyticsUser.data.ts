import { docClient, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { Analytics } from "../models/Analytics.model";

export abstract class AnalyticsUserDbManager {
  static obtain: CallableFunction = async (analyticsUserConfig: Analytics.User.Account) => {
    let existingUser, newUser;
    try {
      existingUser = await this.get(analyticsUserConfig);

      if (existingUser) {
        return existingUser;
      }

      newUser = await this.put(analyticsUserConfig);

      return newUser;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "AnalyticsUser.data/obtain",
        analyticsUserConfig,
      });
      return;
    }
  };

  static get = async (analyticsUser: Analytics.User.Account) => {
    const { pk, sk } = analyticsUser;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const analyticsUserRecord = await docClient.get(params).promise();
      return analyticsUserRecord.Item as Analytics.User.Account;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "AnalyticsUser.data/get",
        analyticsUser,
      });
      return;
    }
  };

  static getById = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Analytics.User.Account.pk,
        sk,
      },
    };

    try {
      const analyticsUserRecord = await docClient.get(params).promise();
      return analyticsUserRecord.Item as Analytics.User.Account;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "AnalyticsUser.data/getById",
        sk,
      });
      return;
    }
  };

  static put = async (analyticsUser: Analytics.User.Account) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...analyticsUser,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return await AnalyticsUserDbManager.get(analyticsUser);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "AnalyticsUser.data/put",
        analyticsUser,
      });
      return;
    }
  };
}
