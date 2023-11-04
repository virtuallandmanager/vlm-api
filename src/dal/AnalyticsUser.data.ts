import { docClient, vlmAnalyticsTable } from "./common.data";
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
      console.log(error);
      return;
    }
  };

  static obtainByWallet: CallableFunction = async (analyticsUserConfig: Analytics.User.Account) => {
    let existingUser, newUser;
    try {
      existingUser = await this.getByWallet(analyticsUserConfig.connectedWallet);

      if (existingUser && existingUser == analyticsUserConfig) {
        return existingUser;
      } else if (existingUser) {
        return await this.put({ ...existingUser, ...analyticsUserConfig });
      }

      newUser = await this.put(analyticsUserConfig);

      return newUser;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "AnalyticsUser.data/obtainByWallet",
        analyticsUserConfig,
      });
      console.log(error);
      return;
    }
  };

  static get = async (analyticsUser: Analytics.User.Account) => {
    const { pk, sk } = analyticsUser;

    const params = {
      TableName: vlmAnalyticsTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const analyticsUserRecord = await docClient.get(params).promise();
      return new Analytics.User.Account(analyticsUserRecord.Item);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "AnalyticsUser.data/get",
        analyticsUser,
      });
      console.log(error);
      return;
    }
  };

  static getByWallet = async (connectedWallet: string) => {

    const params = {
      TableName: vlmAnalyticsTable,
      IndexName: "connectedWallet-index",
      KeyConditionExpression: "#pk = :pk and #connectedWallet = :connectedWallet",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#connectedWallet": "connectedWallet",
      },
      ExpressionAttributeValues: {
        ":pk": Analytics.User.Account.pk,
        ":connectedWallet": connectedWallet,
      },
    };

    try {
      const analyticsUserRecord = await docClient.query(params).promise();
      if (analyticsUserRecord.Items.length === 0) return;
      const analyticsUserPartial = new Analytics.User.Account(analyticsUserRecord.Items[0]);
      if (analyticsUserPartial) {
        return await this.get(analyticsUserPartial);
      } else {
        return;
      }
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "AnalyticsUser.data/getByWallet",
        connectedWallet,
      });
      console.log(error);
      return;
    }
  }

  static getById = async (sk: string) => {
    const params = {
      TableName: vlmAnalyticsTable,
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
      console.log(error);
      return;
    }
  };

  static put = async (analyticsUser: Analytics.User.Account) => {
    const params = {
      TableName: vlmAnalyticsTable,
      Item: {
        ...analyticsUser,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return await this.get(analyticsUser);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "AnalyticsUser.data/put",
        analyticsUser,
      });
      console.log(error);
      return;
    }
  };
}
