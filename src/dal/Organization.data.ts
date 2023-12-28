import { docClient, largeQuery, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { Organization } from "../models/Organization.model";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DateTime } from "luxon";

export abstract class OrganizationDbManager {
  static get: CallableFunction = async (org: Organization.Account) => {
    try {
      return await OrganizationDbManager.getById(org.sk);
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/get",
      });
      return;
    }
  };

  static getById: CallableFunction = async (orgId: string) => {
    if (!orgId) {
      return;
    }
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Organization.Account.pk,
        sk: orgId,
      },
    };

    try {
      const organizationRecord = await docClient.get(params).promise();
      return organizationRecord.Item as Organization.Account;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/getById",
      });
      return;
    }
  };

  static getByIds: CallableFunction = async (sks: string[]) => {
    if (!sks?.length) {
      return;
    }
    const params: DocumentClient.TransactGetItemsInput = {
      TransactItems: [],
    };

    sks.forEach((sk: string) => {
      params.TransactItems.push({
        Get: {
          // Add a connection from organization to user
          Key: {
            pk: Organization.Account.pk,
            sk,
          },
          TableName: vlmMainTable,
        },
      });
    });

    try {
      const organizations = await docClient.transactGet(params).promise();
      return organizations.Responses.map((item) => item.Item);
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/getOrgsFromIds",
        sks,
      });
      return;
    }
  };

  static getUserCon: CallableFunction = async (
    userCon: Organization.UserConnector
  ) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Organization.UserConnector.pk,
        sk: userCon.sk,
      },
    };

    try {
      const userConRecord = await docClient.get(params).promise();
      return userConRecord.Item as Organization.UserConnector;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/getUserConById",
      });
      return;
    }
  };

  static getUserConById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Organization.UserConnector.pk,
        sk,
      },
    };

    try {
      const organizationRecord = await docClient.get(params).promise();
      return organizationRecord.Item as Organization.UserConnector;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/getUserConById",
      });
      return;
    }
  };

  static getUserConsByUserId: CallableFunction = async (
    userId: string,
    roleFilter: Organization.Roles
  ) => {
    const params: DocumentClient.QueryInput = {
      TableName: vlmMainTable,
      IndexName: "userId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#userId": "userId",
      },
      ExpressionAttributeValues: {
        ":pk": Organization.UserConnector.pk,
        ":userId": userId,
      },
      KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };

    try {
      const userConRecords = await largeQuery(params);
      if (!userConRecords?.length) {
        return [];
      }
      const userConIds = userConRecords.map(
        (fragment: { pk: string; sk: string }) => fragment.sk
      );
      const userCons = await this.getUserConsFromIds(userConIds);
      return userCons.filter(
        (userCon: Organization.UserConnector) => userCon.userRole === roleFilter
      );
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/getUserConsByUserId",
      });
      return;
    }
  };

  static getBalance: CallableFunction = async (id: number | string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Organization.Balance.pk,
        sk: String(id),
      },
    };

    try {
      const organizationRecord = await docClient.get(params).promise();
      return organizationRecord.Item as Organization.Balance;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/getBalance",
      });
      return;
    }
  };

  static update: CallableFunction = async (
    organization: Organization.Account
  ) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: organization.pk, sk: organization.sk },
      UpdateExpression: "set #ts = :ts",
      ConditionExpression: "#ts = :sessionTs",
      ExpressionAttributeNames: { "#ts": "ts" },
      ExpressionAttributeValues: {
        ":sessionTs": organization.ts,
        ":ts": DateTime.now().toMillis(),
      },
    };

    try {
      await docClient.update(params).promise();
      return await OrganizationDbManager.get(organization);
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/update",
        organization,
      });
      return;
    }
  };

  static updateBalance: CallableFunction = async (
    balance: Organization.Balance
  ) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: balance.pk, sk: balance.sk },
      UpdateExpression: "set #ts = :ts",
      ConditionExpression: "#ts = :sessionTs",
      ExpressionAttributeNames: { "#ts": "ts" },
      ExpressionAttributeValues: {
        ":sessionTs": balance.ts,
        ":ts": DateTime.now().toMillis(),
      },
    };

    try {
      await docClient.update(params).promise();
      return await OrganizationDbManager.getBalance(balance);
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/update",
        balance,
      });
      return;
    }
  };

  static addMember: CallableFunction = async (
    orgUserCon: Organization.UserConnector
  ) => {
    const params: DocumentClient.PutItemInput = {
      TableName: vlmMainTable,
      Item: { ...orgUserCon },
    };

    try {
      await docClient.put(params).promise();
      return await OrganizationDbManager.getUserCon(orgUserCon);
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/addMember",
        orgUserCon,
      });
      return;
    }
  };

  static init: CallableFunction = async (
    orgAccount: Organization.Account,
    orgUserCon: Organization.UserConnector,
    orgBalances: Organization.Balance[]
  ) => {
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            // Add an organization
            Item: {
              ...orgAccount,
              ts: DateTime.now().toUnixInteger(),
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    if (orgUserCon) {
      params.TransactItems.push({
        Put: {
          // Add a connection from organization to user
          Item: {
            ...orgUserCon,
            ts: DateTime.now().toUnixInteger(),
          },
          TableName: vlmMainTable,
        },
      });
    }

    if (orgBalances) {
      orgBalances.forEach((orgBalance: Organization.Balance) => {
        params.TransactItems.push({
          Put: {
            // Add a connection from organization to user
            Item: {
              ...orgBalance,
              ts: DateTime.now().toUnixInteger(),
            },
            TableName: vlmMainTable,
          },
        });
      });
    }

    try {
      await docClient.transactWrite(params).promise();
      return orgAccount;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/put",
        orgAccount,
        orgUserCon,
        orgBalances,
      });
      return;
    }
  };

  static getUserConsFromIds: CallableFunction = async (sks: string[]) => {
    if (!sks?.length) {
      return;
    }
    const params: DocumentClient.TransactGetItemsInput = {
      TransactItems: [],
    };

    sks.forEach((sk: string) => {
      params.TransactItems.push({
        Get: {
          // Add a connection from organization to user
          Key: {
            pk: Organization.UserConnector.pk,
            sk,
          },
          TableName: vlmMainTable,
        },
      });
    });

    try {
      const userCons = await docClient.transactGet(params).promise();
      return userCons.Responses.map((item) => item.Item);
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/getUserConsFromIds",
        sks,
      });
      return;
    }
  };

  static put: CallableFunction = async (organization: Organization.Account) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...organization,
        ts: DateTime.now().toUnixInteger(),
      },
    };

    try {
      await docClient.put(params).promise();
      return organization;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Organization.data/put",
        Organization,
      });
    }
  };
}
