import { Event } from "../models/Event.model";
import { docClient, vlmLandLegacyTable, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { User } from "../models/User.model";
import { largeQuery } from "../helpers/data";

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

  static getByUser: CallableFunction = async (user: User.Account) => {
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
      const eventRecords = await largeQuery(params);
      return eventRecords as Event.SceneLink[];
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getByUser",
        user,
      });
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
      const dbEvent = await docClient.put(params).promise();
      return dbEvent.Attributes;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Event.data/put",
        event,
      });
    }
  };
}
