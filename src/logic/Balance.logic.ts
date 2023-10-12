import { OrganizationDbManager } from "../dal/Organization.data";
import { Organization } from "../models/Organization.model";
import { UserDbManager } from "../dal/User.data";
import { User } from "../models/User.model";
import { BalanceDbManager } from "../dal/Balance.data";
import { BalanceType, InitialBalances } from "../models/Balance.model";
import { GenericDbManager } from "../dal/Generic.data";

export abstract class BalanceManager {

  static obtainUserBalances: CallableFunction = async (userId: string) => {
    let balancesObj: { [key: string]: User.Balance } = {};
    const userBalances = await this.getUserBalances(userId);

    if (!userBalances.length || userBalances.length < InitialBalances.user.length) {
      balancesObj = await this.createInitialUserBalances(userId);
    } else {
      userBalances.forEach((balance: User.Balance) => {
        balancesObj[balance.type] = balance;
      });

    }

    const balanceValues = Object.values(balancesObj).reduce((acc: { [key: string]: number }, balance: User.Balance) => {
      acc[balance.type] = balance.value;
      return acc;
    }, {});

    return balanceValues;
  };

  static createInitialUserBalances: CallableFunction = async (userId: string) => {
    const balances: { [key: string]: User.Balance } = {};

    for (const initialBalance of InitialBalances.user) {
      const existingBalance = await BalanceDbManager.obtainBalanceTypeForUser(userId, initialBalance.type);

      if (existingBalance) {
        balances[initialBalance.type] = existingBalance;
      } else {
        const newBalance = new User.Balance({
          pk: userId,
          type: initialBalance.type,
          userId,
          value: 0,
        });

        await GenericDbManager.put(newBalance);
        balances[initialBalance.type] = newBalance;
      }
    }

    return balances;
  };


  static createInitialOrgBalances: CallableFunction = async (orgId: string) => {
    const balances: { [key: string]: User.Balance } = {};

    InitialBalances.user.forEach(async (initalBalance: User.Balance) => {
      const existingBalance = await BalanceDbManager.obtainBalanceTypeForUser(orgId, initalBalance.type);
      if (existingBalance) {
        balances[initalBalance.type] = existingBalance;
      } else {
        const newBalance = new Organization.Balance({
          pk: orgId,
          type: initalBalance.type,
          orgId,
          value: 0,
        });
        await GenericDbManager.put(newBalance);
      }
    });
  };


  static obtainBalanceTypeForUser: CallableFunction = async (userId: string, balanceType: BalanceType) => {
    return await BalanceDbManager.obtainBalanceTypeForUser(userId, balanceType);
  };

  static obtainBalanceTypeForOrg: CallableFunction = async (orgId: string, balanceType: BalanceType) => {
    return await BalanceDbManager.obtainBalanceTypeForOrg(orgId, balanceType);
  };

  static adjustUserBalance: CallableFunction = async (
    balance: User.Balance,
    adjustment: number
  ) => {
    balance.value += adjustment;
    if (balance.value < 0) {
      throw new Error("Insufficient balance.");
    }
    return await BalanceDbManager.updateBalance(balance, adjustment);
  };

  static adjustOrgBalance: CallableFunction = async (
    balance: Organization.Balance,
    adjustment: number
  ) => {
    balance.value += adjustment;
    if (balance.value < 0) {
      throw new Error("Insufficient balance.");
    }
    return await BalanceDbManager.updateBalance(balance, adjustment);
  };

  static getUserBalances: CallableFunction = async (userId?: string) => {
    const balanceIds = await BalanceDbManager.getIdsForUser(userId);
    let userBalances = [];
    for (const balanceId of balanceIds) {
      const balance = await BalanceDbManager.getUserBalanceById(balanceId);
      userBalances.push(balance);
    }
    return userBalances;
  };

  static getUserBalance: CallableFunction = async (balanceId?: string) => {
    return await UserDbManager.getBalance(balanceId);
  };

  static getOrgBalance: CallableFunction = async (balanceId?: string) => {
    return await OrganizationDbManager.getBalance(balanceId);
  };

  static getOrgBalances: CallableFunction = async (orgId?: string) => {
    const balanceFragments = await BalanceDbManager.getIdsForOrg(orgId);
    return await balanceFragments.map(async (balanceFragment: Organization.Balance) => {
      return await GenericDbManager.get(new Organization.Balance({ pk: balanceFragment.pk, sk: balanceFragment.sk }));
    });
  };

  static transferBalance: CallableFunction = async (
    fromBalance: User.Balance | Organization.Balance,
    toBalance: User.Balance | Organization.Balance,
    amount: number
  ) => {
    fromBalance.value += amount;
    if (fromBalance.value < 0) {
      throw new Error("Insufficient balance.");
    }
    return await BalanceDbManager.transferBalance(fromBalance, toBalance, amount);
  };
}
