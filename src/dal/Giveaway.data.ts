import { Giveaway } from "../models/Giveaway.model";
import { Event } from "../models/Event.model";
import { docClient, vlmAnalyticsTable, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { Accounting } from "../models/Accounting.model";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { largeScan } from "../helpers/data";
import { Analytics } from "../models/Analytics.model";

export abstract class GiveawayDbManager {
  static get: CallableFunction = async (giveawayConfig: Giveaway.Config) => {
    const giveaway = new Giveaway.Config(giveawayConfig),
      { pk, sk } = giveaway;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const giveawayRecord = await docClient.get(params).promise();
      return giveawayRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Giveaway.data/get",
        giveawayConfig,
      });
      return;
    }
  };

  static getItemsByIds: CallableFunction = async (sks: string[]) => {
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
            pk: Event.Giveaway.Item.pk,
            sk,
          },
          TableName: vlmMainTable,
        },
      });
    });

    try {
      const events = await docClient.transactGet(params).promise();
      return events.Responses.map((item) => item.Item);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/getGiveawayItemsByIds",
        sks,
      });
      return;
    }
  };

  static adminGetAll: CallableFunction = async () => {
    const params = {
      TableName: "VLM_MigratedLegacyEvents",
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":pk": Giveaway.Config.pk,
      },
      KeyConditionExpression: "#pk = :pk",
    };

    try {
      const giveawayQuery = await docClient.query(params).promise();
      return giveawayQuery.Items;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Giveaway.data/adminGetAll",
      });
      return;
    }
  };

  static getAllLegacy: CallableFunction = async (chunkCb: CallableFunction) => {
    var params = {
      TableName: "vlm_claims",
    };
    const data = await largeScan(params, chunkCb);
    return data;
  };

  static addClaim: CallableFunction = async (analyticsAction: Analytics.Session.Action, claim: Giveaway.Claim, transaction: Accounting.Transaction) => {
    const ts = Date.now();

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            // Add an analytics action record
            Item: {
              ...analyticsAction,
              ts,
            },
            TableName: vlmAnalyticsTable,
          },
        },
        {
          Put: {
            // Add a claim
            Item: {
              ...claim,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            // Add a transaction for the claim
            Item: {
              ...transaction,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Giveaway.data/addClaim",
      });
      return;
    }
  };

  static put: CallableFunction = async (giveaway: Giveaway.Config) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...giveaway,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return giveaway;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Giveaway.data/put",
        giveaway,
      });
      return;
    }
  };

  static addItem: CallableFunction = async (giveawayItem: Giveaway.Item) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...giveawayItem,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return giveawayItem;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Giveaway.data/addItem",
        giveawayItem,
      });
      return;
    }
  };

  static linkEvent: CallableFunction = async (link: Event.GiveawayLink) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...link,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return link;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/linkGiveaway",
        link,
      });
      return;
    }
  };
}
