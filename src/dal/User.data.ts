import { docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { User } from "../models/User.model";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { UserWalletDbManager } from "./UserWallet.data";

export abstract class UserDbManager {
  static obtain = async (user: User.Account) => {
    let existingUser, createdUser;
    try {
      existingUser = await this.get(user);
      if (!existingUser) {
        createdUser = await this.put(user);
      }

      return existingUser || createdUser;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "User.data/obtain",
        user,
      });
    }
  };

  static get = async (user: User.Account) => {
    if (!user.sk) {
      const walletRecord = await UserWalletDbManager.get({
        wallet: user.connectedWallet,
      });
      user.sk = walletRecord.userId;
    }

    const { pk, sk } = user;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const userRecord = await docClient.get(params).promise();
      const user = userRecord.Item as User.Account;
      return user;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "User.data/get",
        user,
      });
    }
  };

  static getUserBalance = async (balanceId: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: User.Balance.pk,
        sk: String(balanceId),
      },
    };

    try {
      const userRecord = await docClient.get(params).promise();
      const user = userRecord.Item as User.Account;
      return user;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "User.data/getUserBalance",
        balanceId,
      });
    }
  };

  static getUserRole = async (id: User.Roles) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: User.Role.pk,
        sk: id,
      },
    };

    try {
      const roleRecord = await docClient.get(params).promise();
      const role = roleRecord.Item as User.Role;
      return role;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "User.data/getUserRole",
        id,
      });
    }
  };

  static update = async (user: User.Account) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: user.pk, sk: user.sk },
      UpdateExpression: "set #ts = :ts",
      ConditionExpression: "#ts <= :recordTs",
      ExpressionAttributeNames: { "#ts": "ts" },
      ExpressionAttributeValues: {
        ":recordTs": user.ts,
        ":ts": Date.now(),
      },
    };

    try {
      await docClient.update(params).promise();
      return await UserDbManager.get(user);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "User.data/update",
        user,
      });
    }
    return false;
  };

  static put = async (user: User.Account) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...user,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return await UserDbManager.get(user);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "User.data/put",
        user,
      });
    }
  };
}
