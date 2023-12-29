import { Event } from "../models/Event.model";
import { docClient, largeQuery, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { User } from "../models/User.model";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Giveaway } from "../models/Giveaway.model";
import { GenericDbManager } from "./Generic.data";
import { env } from "process";
import { DateTime } from "luxon";

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
      AdminLogManager.logError(error, {
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
      AdminLogManager.logError(error, {
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
      AdminLogManager.logError(error, {
        from: "Event.data/getByIds",
        sk,
      });
      return;
    }
  };

  static getByIds: CallableFunction = async (sks: string[]) => {
    if (!sks?.length) {
      return [];
    }
    const params: DocumentClient.TransactGetItemsInput = {
      TransactItems: [],
    };

    sks.forEach((sk: string) => {
      params.TransactItems.push({
        Get: {
          // Get an event in the list by its sk
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
      AdminLogManager.logError(error, {
        from: "Event.data/getByIds",
        sks,
      });
      return;
    }
  };

  static getLinkedEventsBySceneId: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: "sceneId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sceneId": "sceneId",
      },
      ExpressionAttributeValues: {
        ":pk": Event.SceneLink.pk,
        ":sceneId": sk,
      },
      KeyConditionExpression: "#pk = :pk and #sceneId = :sceneId",
    };

    try {
      const linkRecords = await largeQuery(params);
      const fullLinks = await Promise.all(linkRecords.map((link: Event.SceneLink) => GenericDbManager.get({ pk: Event.SceneLink.pk, sk: link.sk })));
      const linkedEvents = await Promise.all(fullLinks.map((link: Event.SceneLink) => GenericDbManager.get({ pk: Event.Config.pk, sk: link.eventId })));
      return linkedEvents;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/getLinkedEventsBySceneId",
        sk,
      });
      return;
    }
  };

  static getLinkedScenesById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: "eventId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#eventId": "eventId",
      },
      ExpressionAttributeValues: {
        ":pk": Event.SceneLink.pk,
        ":eventId": sk,
      },
      KeyConditionExpression: "#pk = :pk and #eventId = :eventId",
    };

    try {
      const linkRecords = await largeQuery(params);
      const linkedScenes = await Promise.all(linkRecords.map((link: Event.SceneLink) => GenericDbManager.get({ pk: Event.SceneLink.pk, sk: link.sk })));
      return linkedScenes;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/getLinkedGiveawaysById",
        sk,
      });
      return;
    }
  };

  static getLinkedScenesByIds: CallableFunction = async (sks: string[]) => {
    try {
      const sceneLinks = await Promise.all(
        sks.map((sk) => this.getLinkedScenesById(sk))
      );

      return sceneLinks.flat();
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/getLinkedScenesByIds",
      });
      return;
    }
  };

  static getLinkedGiveawaysById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: "eventId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#eventId": "eventId",
      },
      ExpressionAttributeValues: {
        ":pk": Event.GiveawayLink.pk,
        ":eventId": sk,
      },
      KeyConditionExpression: "#pk = :pk and #eventId = :eventId",
    };

    try {
      const linkRecords = await largeQuery(params);
      const linkedGiveaways = await Promise.all(linkRecords.map((link: Event.GiveawayLink) => GenericDbManager.get({ pk: Event.GiveawayLink.pk, sk: link.sk })));
      return linkedGiveaways;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/getLinkedGiveawaysById",
        sk,
      });
      return;
    }
  };

  static getLinkedGiveawaysByIds: CallableFunction = async (sks: string[]) => {
    try {
      const giveawayLinks = await Promise.all(
        sks.map(async (sk) => await this.getLinkedGiveawaysById(sk))
      );

      return giveawayLinks.flat();
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/getLinkedGiveawaysByIds",
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
            pk: Giveaway.Config.pk,
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
      AdminLogManager.logError(error, {
        from: "Event.data/getGiveawaysByIds",
        sks,
      });
      return;
    }
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
      AdminLogManager.logError(error, {
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
      AdminLogManager.logError(error, {
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
      AdminLogManager.logError(error, {
        from: "Event.data/adminGetAll",
      });
      return;
    }
  };

  static update: CallableFunction = async (eventConfig: Event.Config) => {

  };

  static put: CallableFunction = async (event: Event.Config) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...event,
        ts: DateTime.now().toMillis(),
      },
    };

    try {
      await docClient.put(params).promise();
      return event;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/put",
        event,
      });
      return;
    }
  };

  static updateSceneLinks: CallableFunction = async (eventId: string, linksToAdd: Event.SceneLink[], linksToRemove: Event.SceneLink[]) => {
    try {
      if (linksToAdd?.length) {
        await Promise.all(linksToAdd.map((link) => this.linkScene(link)));
      }
      if (linksToRemove?.length) {
        await Promise.all(linksToRemove.map((link) => this.unlinkScene(link.sk)));
      }
      return await this.getLinkedScenesById(eventId);
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/updateSceneLinks",
        linksToAdd,
        linksToRemove,
      });
      return false;
    }
  }

  static updateGiveawayLinks: CallableFunction = async (eventId: string, linksToAdd: Event.GiveawayLink[], linksToRemove: Event.GiveawayLink[]) => {
    try {
      if (linksToAdd?.length) {
        await Promise.all(linksToAdd.map((link) => this.linkGiveaway(link)));
      }
      if (linksToRemove?.length) {
        await Promise.all(linksToRemove.map((link) => this.unlinkGiveaway(link.sk)));
      }
      return await this.getLinkedGiveawaysById(eventId);
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/updateGiveawayLinks",
        linksToAdd,
        linksToRemove,
      });
      return false;
    }
  }

  static linkScene: CallableFunction = async (link: Event.SceneLink) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...link,
        ts: DateTime.now().toMillis(),
      },
    };

    try {
      await docClient.put(params).promise();
      return await GenericDbManager.get({ pk: Event.SceneLink.pk, sk: link.sk });
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/linkScene",
        link,
      });
      return;
    }
  }

  static linkGiveaway: CallableFunction = async (link: Event.GiveawayLink) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...link,
        ts: DateTime.now().toMillis(),
      },
    };

    try {
      await docClient.put(params).promise();
      return await GenericDbManager.get({ pk: Event.GiveawayLink.pk, sk: link.sk });
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/linkGiveaway",
        link,
      });
      return;
    }
  };

  static unlinkScene: CallableFunction = async (linkId: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Event.SceneLink.pk,
        sk: linkId,
      },
    };

    try {
      await docClient.delete(params).promise();
      return;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/linkScene",
        linkId,
      });
      return;
    }
  }

  static unlinkGiveaway: CallableFunction = async (linkId: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Event.Config.pk,
        sk: linkId,
      },
    };

    try {
      await docClient.delete(params).promise();
      return;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Event.data/linkGiveaway",
        linkId,
      });
      return;
    }
  };
}
