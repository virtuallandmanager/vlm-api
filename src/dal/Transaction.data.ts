import { docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { BaseWallet } from "../models/Wallet.model";
import { GenericDbManager } from "./Generic.data";
import { Transaction } from "../models/Transaction.model";

export abstract class TransactionDbManager {
  static get: CallableFunction = async (wallet: BaseWallet) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Transaction.pk,
        sk: wallet.address,
      },
    };

    try {
      const walletRecord = await docClient.get(params).promise();
      return walletRecord.Item as Transaction;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Transaction.data/get",
        wallet,
      });
    }
  };

  static getIdsForUser: CallableFunction = async (userId: string) => {
    try {
      const partialTransactions = await GenericDbManager.getAllForUser(Transaction.pk, userId),
        transactionIds = partialTransactions.map((transaction: Transaction) => transaction.sk);

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
