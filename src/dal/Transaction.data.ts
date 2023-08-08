import { docClient, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { BaseWallet } from "../models/Wallet.model";
import { GenericDbManager } from "./Generic.data";
import { Accounting } from "../models/Accounting.model";

export abstract class TransactionDbManager {
  static get: CallableFunction = async (wallet: BaseWallet) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Accounting.Transaction.pk,
        sk: wallet.address,
      },
    };

    try {
      const walletRecord = await docClient.get(params).promise();
      return walletRecord.Item as Accounting.Transaction;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Transaction.data/get",
        wallet,
      });
    }
  };

  static getIdsForUser: CallableFunction = async (userId: string) => {
    try {
      const partialTransactions = await GenericDbManager.getAllForUser(Accounting.Transaction.pk, userId),
        transactionIds = partialTransactions.map((transaction: Accounting.Transaction) => transaction.sk);

      return transactionIds;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Transaction.data/getById",
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
        from: "Transaction.data/put",
        wallet,
      });
    }
  };
}
