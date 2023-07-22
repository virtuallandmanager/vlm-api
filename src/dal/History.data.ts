import { docClient, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { History } from "../models/History.model";

export abstract class HistoryDbManager {
  static get: CallableFunction = async (history: History.Config) => {
    const { pk, sk } = history;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const historyRecord = await docClient.get(params).promise();
      return historyRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "History.data/get",
        history,
      });
      return;
    }
  };

  static getById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: History.Config.pk,
        sk,
      },
    };

    try {
      const historyRecord = await docClient.get(params).promise();
      return historyRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "History.data/getById",
        sk,
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
            pk: History.Config.pk,
            sk,
          },
          TableName: vlmMainTable,
        },
      });
    });

    try {
      const response = await docClient.transactGet(params).promise(),
        historys = response.Responses.map((item) => item.Item as History.Config);
      return historys?.length ? historys : [];
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "History.data/getHistoryLinksFromIds",
        sks,
      });
      return;
    }
  };

  static initHistory: CallableFunction = async (config: History.Config, root: History.Root, update: History.Update) => {
    const ts = Date.now();

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            // Add a history
            Item: {
              ...config,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            // Add preset for history
            Item: {
              ...root,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            // Add preset for history
            Item: {
              ...update,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      return history;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "History.data/initHistory",
      });
      return;
    }
  };

  static addUpdateToHistory: CallableFunction = async (history: History.Config, update: History.Update) => {
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            // Add a history update
            Item: {
              ...update,
              ts: Date.now(),
            },
            TableName: vlmMainTable,
          },
        },
        {
          Update: {
            // Add history to user
            Key: {
              pk: History.Config.pk,
              sk: history.sk,
            },
            UpdateExpression: "set #updates = list_append(if_not_exists(#updates, :empty_list), :updateId)",
            ExpressionAttributeNames: {
              "#updates": "updates",
            },
            ExpressionAttributeValues: {
              ":updateId": [update.sk],
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      return { history, update };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "History.data/addUpdateToHistory",
      });
      return;
    }
  };

  static put: CallableFunction = async (history: History.Config) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...history,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return await HistoryDbManager.get(history);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "History.data/put",
        history,
      });
      return;
    }
  };
}
