import { IDbItem, docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { largeQuery } from "../helpers/data";

export abstract class GenericDbManager {
  static obtain = async (dataConfig: IDbItem) => {
    let existingData, updatedData, finalData;
    try {
      existingData = await this.get(dataConfig);
      updatedData = Object.assign({}, existingData, dataConfig);
      finalData = await this.put(updatedData);

      return finalData;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Generic.data/obtain",
        dataConfig,
      });
    }
  };

  static get = async (dataConfig: IDbItem) => {
    const { pk, sk } = dataConfig;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const record = await docClient.get(params).promise();
      return record.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Generic.data/get",
        dataConfig,
      });
    }
  };

  static getAllForUser = async (pk: string, userId: string) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: "userId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#userId": "userId",
      },
      ExpressionAttributeValues: {
        ":pk": pk,
        ":userId": userId,
      },
      KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };

    try {
      const records = await largeQuery(params);
      return records;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Generic.data/get",
        pk,
        userId,
      });
    }
  };

  static getAllForOrg = async (pk: string, orgId: string) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: "orgId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#userId": "userId",
      },
      ExpressionAttributeValues: {
        ":pk": pk,
        ":orgId": orgId,
      },
      KeyConditionExpression: "#pk = :pk and #orgId = :orgId",
    };

    try {
      const records = await largeQuery(params);
      return records;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Generic.data/get",
        pk,
        orgId,
      });
    }
  };

  static put = async (dataConfig: IDbItem) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...dataConfig,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return await this.get(dataConfig);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Generic.data/put",
        dataConfig,
      });
    }
  };
}
