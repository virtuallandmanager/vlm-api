import { Event } from "../models/Event.model";
import { docClient, vlmLandLegacyTable, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { User } from "../models/User.model";
import { largeQuery } from "../helpers/data";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Giveaway } from "../models/Giveaway.model";

export abstract class EventDbManager {
  static obtain: CallableFunction = async (eventConfig: Event) => {
    let existingEvent, createdEvent;
    try {
      existingEvent = await this.get(eventConfig);
      if (!existingEvent) {
        createdEvent = await this.put(eventConfig);
      }

      return createdEvent || existingEvent;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/obtain",
        eventConfig,
      });
      return;
    }
  };

  static get: CallableFunction = async (eventConfig: Event.Config) => {
    const { pk, sk } = eventConfig;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const eventRecord = await docClient.get(params).promise();
      return eventRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/get",
        eventConfig,
      });
      return;
    }
  };

  static getById: CallableFunction = async (sk: string) => {
    if (!sk) {
      return;
    }
    const params: DocumentClient.GetItemInput = {
      Key: {
        pk: Event.Config.pk,
        sk,
      },
      TableName: vlmMainTable,
    };

    try {
      const event = await docClient.get(params).promise();
      return event.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/getByIds",
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
            pk: Event.Config.pk,
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
        from: "Event.data/getByIds",
        sks,
      });
      return;
    }
  };

  static getGiveawaysByIds: CallableFunction = async (sks: string[]) => {
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
            pk: Event.Giveaway.Config.pk,
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
        from: "Event.data/getGiveawaysByIds",
        sks,
      });
      return;
    }
  };

  static getLegacy: CallableFunction = async (baseParcel: string) => {
    var params = {
      TableName: vlmLandLegacyTable,
      IndexName: "vlm_land_baseParcel",
      KeyConditionExpression: "#baseParcel = :baseParcel",
      ExpressionAttributeNames: {
        "#baseParcel": "baseParcel",
      },
      ExpressionAttributeValues: {
        ":baseParcel": baseParcel,
      },
    };

    const data = await docClient.query(params).promise();
    const event = data.Items.find((parcel: any) => {
      return `${parcel.x},${parcel.y}` == baseParcel;
    });

    return event;
  };

  static getAllForUser: CallableFunction = async (user: User.Account) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: "userId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#userId": "userId",
      },
      ExpressionAttributeValues: {
        ":pk": Event.Config.pk,
        ":userId": user.sk,
      },
      KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };

    try {
      const eventRecords = await largeQuery(params),
        eventIds = eventRecords.map((event: Event.Config) => event.sk),
        events = await EventDbManager.getByIds(eventIds);
      return events;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/getAllForUser",
        user,
      });
      return;
    }
  };

  static getGiveawaysForEvent: CallableFunction = async (event: Event.Config) => {
    const params = {
      TableName: vlmMainTable,
      KeyConditionExpression: "#pk = :pkValue",
      FilterExpression: "#eventId = :eventIdValue",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#eventId": "eventId",
      },
      ExpressionAttributeValues: {
        ":pkValue": Event.GiveawayLink.pk,
        ":eventIdValue": event.sk,
      },
    };

    try {
      const eventRecords = await largeQuery(params),
        giveawayIds = eventRecords.map((link: Event.GiveawayLink) => link.giveawayId),
        giveaways = await EventDbManager.getGiveawaysByIds(giveawayIds);
      return giveaways;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/getGiveawaysForEvent",
        event,
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
        ":pk": Giveaway.Item.pk,
      },
      KeyConditionExpression: "#pk = :pk",
    };

    try {
      const eventQuery = await largeQuery(params);
      return eventQuery;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/adminGetAll",
      });
      return;
    }
  };

  static put: CallableFunction = async (event: Event.Config) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...event,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return event;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/put",
        event,
      });
      return;
    }
  };

  static linkGiveaway: CallableFunction = async (link: Event.GiveawayLink) => {
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
