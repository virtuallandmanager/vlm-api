import { TransactionDbManager } from "../dal/Transaction.data";
import { Transaction } from "../models/Transaction.model";
import { User } from "../models/User.model";

export abstract class TransactionManager {
  static create: CallableFunction = async (transaction?: Transaction) => {
    return await TransactionDbManager.put(transaction);
  };

  static get: CallableFunction = async (transaction?: Transaction) => {
    return await TransactionDbManager.get(transaction);
  };

  static getTransactionIdsForUser: CallableFunction = async (vlmUser: User.Account) => {
    return await TransactionDbManager.getIdsForUser(vlmUser);
  };
}
