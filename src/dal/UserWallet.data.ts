import { docClient, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { User } from "../models/User.model";
import { BaseWallet } from "../models/Wallet.model";
import { GenericDbManager } from "./Generic.data";

export abstract class UserWalletDbManager {
  static obtain: CallableFunction = async (walletConfig: BaseWallet) => {
    let existingWallet, createdWallet;
    try {
      existingWallet = await this.get(walletConfig);
      if (!existingWallet) {
        createdWallet = await this.put(walletConfig);
      }

      return existingWallet || createdWallet;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "UserWallet.data/obtain",
        walletConfig,
      });
    }
  };

  static get: CallableFunction = async (wallet: BaseWallet) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: User.Wallet.pk,
        sk: wallet.sk || wallet.address,
      },
    };

    try {
      const walletRecord = await docClient.get(params).promise();
      return walletRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "UserWallet.data/get",
        wallet,
      });
    }
  };

  static getIdsForUser: CallableFunction = async (userId: string) => {
    try {
      const partialWallets = await GenericDbManager.getAllForUser(User.Wallet.pk, userId),
        walletIds = partialWallets.map((transaction: User.Wallet) => transaction.sk);

      return walletIds;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "UserWallet.data/getById",
        userId,
      });
    }
  };

  static put: CallableFunction = async (wallet: BaseWallet) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...wallet,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return wallet;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "UserWallet.data/put",
        wallet,
      });
    }
  };
}
