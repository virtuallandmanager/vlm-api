import { TransactionDbManager } from "../dal/Transaction.data";
import { Accounting } from "../models/Accounting.model";
import { Giveaway } from "../models/Giveaway.model";
import { User } from "../models/User.model";
import { ethers, Interface, AlchemyProvider, TransactionRequest, TransactionReceipt, Network } from 'ethers';
import { AdminLogManager } from "./ErrorLogging.logic";
import dclAbi from "../abi/dclCollectable.json";

const dclAbiInterface: Interface = new Interface(dclAbi);
const network = process.env.NODE_ENV === 'production' ? 137 : 80001;
const apiKey = process.env.NODE_ENV === 'production' ? process.env.ALCHEMY_API_KEY_MAINNET_MATIC : process.env.ALCHEMY_API_KEY_MAINNET_MATIC;
const prodProvider = new AlchemyProvider(137, apiKey);
const provider = new AlchemyProvider(network, apiKey);

export abstract class TransactionManager {
  static create: CallableFunction = async (transaction?: Accounting.Transaction) => {
    return await TransactionDbManager.put(transaction);
  };

  static get: CallableFunction = async (transaction?: Accounting.Transaction) => {
    return await TransactionDbManager.get(transaction);
  };

  static getTransactionIdsForUser: CallableFunction = async (vlmUser: User.Account) => {
    return await TransactionDbManager.getIdsForUser(vlmUser);
  };

  static getMinter: CallableFunction = async () => {
    const minter = TransactionDbManager.getMinter();
    return minter;
  }

  private static async broadcastTransaction(signedTx: TransactionRequest): Promise<TransactionReceipt> {
    // Sending raw signed transaction

    const txResponse: TransactionReceipt = await provider.send("eth_sendRawTransaction", [signedTx]);
    return txResponse;
  }

  static createMinterRightsTranactions: CallableFunction = async (vlmUser: User.Account, request: Giveaway.SetMinterRequest) => {
    const transactions: TransactionRequest[] = [];

    const consolidatedContracts: { [address: string]: number[] } = {};

    request.contracts.forEach((address: string, index: number) => {
      if (consolidatedContracts[address]) {
        consolidatedContracts[address].push(request.ids[index]);
      } else {
        consolidatedContracts[address] = [request.ids[index]];
      }
    });

    for (const address in consolidatedContracts) {
      const contract = new ethers.Contract(address, dclAbiInterface, provider);

      try {
        const tx = await (contract.populateTransaction as any).setItemsMinters(consolidatedContracts[address], request.minter) as TransactionRequest;
        transactions.push(tx);
      } catch (error) {
        AdminLogManager.logError(error, { from: "TransactionManager.createMinterRightsTransactions" });
      }
    }

    return transactions;
  }

  static broadcastMinerRightsTransactions: CallableFunction = async (signedTransactions: TransactionRequest[]) => {
    try {
      const txReceipts = [];

      for (const signedTx of signedTransactions) {
        try {
          const txReceipt = await this.broadcastTransaction(signedTx);
          txReceipts.push(txReceipt);
        } catch (error) {
          AdminLogManager.logError(error, {
            from: "Transaction.controller/broadcast",
          });
          return;
        }
      }

      return { txReceipts };
    } catch (error: any) {
      AdminLogManager.logError(error, {
        from: "Transaction.controller/broadcast",
      });
      return;
    }
  }

  static checkMintingRights: CallableFunction = async (request: Giveaway.SetMinterRequest) => {
    const { contracts, ids, minter } = request;
    let allGranted = false,
      grantedRights: { [contractAddress: string]: number[] } = {},
      missingRights: { [contractAddress: string]: number[] } = {};

    for (let i = 0; i < contracts.length; i++) {
      const contract = new ethers.Contract(contracts[i], dclAbiInterface, prodProvider);
      const itemId = ids[i];
      const contractItems = contracts.map((contract: string, index: number) => {
        if (contract == contracts[i]) {
          return ids[index]
        }
      }).filter(x => x);

      const isGlobalMinter = await contract.globalMinters(minter);
      let isItemMinter = await contract.itemMinters(itemId, minter);
      isItemMinter = Number(isItemMinter) && Number.isNaN(isItemMinter);

      if (isGlobalMinter && !grantedRights[contracts[i]]) {
        grantedRights[contracts[i]] = contractItems;
      } else if (isItemMinter && !grantedRights[contracts[i]]?.includes(itemId)) {
        if (grantedRights[contracts[i]]) {
          grantedRights[contracts[i]].push(itemId);
        } else {
          grantedRights[contracts[i]] = [itemId];
        }
      } else if (!grantedRights[contracts[i]]) {
        if (missingRights[contracts[i]]) {
          missingRights[contracts[i]].push(itemId);
        } else {
          missingRights[contracts[i]] = [itemId];
        }
      }
    }

    allGranted = Object.keys(missingRights).length === 0;
    return { allGranted, grantedRights, missingRights };
  }
}
