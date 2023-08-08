import { docClient, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { User } from "../models/User.model";
import { BaseWallet } from "../models/Wallet.model";
import { GenericDbManager } from "./Generic.data";
import { Organization } from "../models/Organization.model";

export abstract class BalanceDbManager {
  static getIdsForUser: CallableFunction = async (userId: string) => {
    try {
      const partialBalances = await GenericDbManager.getAllForUser(User.Balance.pk, userId),
        balanceIds = partialBalances.map((transaction: User.Balance) => transaction.sk);

      return balanceIds;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Balance.data/getById",
        userId,
      });
      return;
    }
  };

  static getIdsForOrg: CallableFunction = async (orgId: string) => {
    try {
      const partialBalances = await GenericDbManager.getAllForOrg(Organization.Balance.pk, orgId),
        balanceIds = partialBalances.map((transaction: User.Balance) => transaction.sk);

      return balanceIds;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Balance.data/getById",
        orgId,
      });
      return;
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
        from: "Balance.data/put",
        wallet,
      });
      return;
    }
  };
}
