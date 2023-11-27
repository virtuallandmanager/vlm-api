import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Session as BaseSession } from "../models/Session.model";
import {
  daxClient,
  docClient,
  vlmAnalyticsTable,
  vlmSessionsTable,
} from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { DateTime } from "luxon";
import { largeQuery } from "../helpers/data";
import { Analytics } from "../models/Analytics.model";
import { User } from "../models/User.model";
import { DynamoDBServiceException } from "@aws-sdk/client-dynamodb";

type AnalyticsRestrictedScene = {
  sceneId: string;
  restrictedActions: string[];
};

const analyticsRestrictedScenes: AnalyticsRestrictedScene[] = [];
let sceneIdUsageRecord: Record<string, { count: number; lastReset: number }> =
  {};

export abstract class SessionDbManager {
  static start: CallableFunction = async (
    sessionConfig: BaseSession.Config
  ) => {
    const startTime = DateTime.now();
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmAnalyticsTable,
      Key: { pk: sessionConfig.pk, sk: sessionConfig.sk },
      ExpressionAttributeNames: {
        "#ts": "ts",
        "#sessionStart": "sessionStart",
        "#ttl": "ttl", // Added this line
      },
      ExpressionAttributeValues: {
        ":sessionStart": startTime.toUnixInteger(),
        ":ts": startTime.toUnixInteger(),
      },
      UpdateExpression:
        "SET #ts = :ts, #sessionStart = :sessionStart REMOVE #ttl", // Added "REMOVE #ttl"
    };

    try {
      await daxClient.update(params).promise();
      return await this.get(sessionConfig);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/start",
        sessionConfig,
      });
    }
  };

  static create: CallableFunction = async (
    session: BaseSession.Config,
    expirationTime?: { hours: number; minutes: number; seconds: number }
  ) => {
    const ttl = expirationTime
      ? DateTime.now().plus(expirationTime).toUnixInteger()
      : undefined;

    const table =
      session.pk === Analytics.Session.Config.pk
        ? vlmAnalyticsTable
        : vlmSessionsTable;

    const params = {
      TableName: table,
      Item: {
        ...session,
        ts: DateTime.now().toUnixInteger(),
        ttl,
      },
    };

    try {
      await daxClient.put(params).promise();
      return this.get(session);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/create",
        session,
      });
    }
  };

  static logAnalyticsAction: CallableFunction = async (
    config: Analytics.Session.Action
  ) => {
    try {
      // Rate limiting logic
      const currentTimestamp = Date.now();
      const usage = sceneIdUsageRecord[`${config.sceneId}:${config.name}`];

      if (!usage || currentTimestamp - usage.lastReset > 1000) {
        // Set object if new sceneId or more than a second has passed
        sceneIdUsageRecord[`${config.sceneId}:${config.name}`] = {
          count: 1,
          lastReset: currentTimestamp,
        };
      } else if (usage.count <= 100) {
        // Increment count
        usage.count++;
      } else if (usage.count > 100) {
        // Rate limit exceeded
        AdminLogManager.logError(
          `${config.sceneId} is being rate limited on "${config.name}" actions.`,
          {
            from: "Session.data/logAnalyticsAction",
          }
        );
        return false;
      }

      const existingRestriction = analyticsRestrictedScenes.find(
        (restriction) => restriction.sceneId === config.sceneId
      );
      if (
        existingRestriction &&
        existingRestriction.restrictedActions.includes(config.name)
      ) {
        return false;
      }

      const params = {
        TableName: vlmAnalyticsTable,
        Item: {
          ...config,
          ts: DateTime.now().toUnixInteger(),
          ttl: DateTime.now().plus({ months: 12 }).toUnixInteger(),
        },
      };

      await daxClient.put(params).promise();
      return true;
    } catch (error: any | DynamoDBServiceException) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/logAnalyticsAction",
      });
      if (error.code === "ThrottlingException") {
        AdminLogManager.logError(
          `${config.sceneId} has caused a Throttling Exception and has been restricted from submitting "${config.name}" actions.`,
          {
            from: "Session.data/logAnalyticsAction",
          }
        );
        const existingRestriction = analyticsRestrictedScenes.find(
          (restriction) => restriction.sceneId === config.sceneId
        );
        if (existingRestriction) {
          existingRestriction.restrictedActions.push(config.name);
        } else {
          analyticsRestrictedScenes.push({
            sceneId: config.sceneId,
            restrictedActions: [config.name],
          });
        }
      }
      return false;
    }
  };

  static cleanupSceneIdUsageRecord() {
    const currentTimestamp = Date.now();
    for (const [sceneId, usage] of Object.entries(sceneIdUsageRecord)) {
      if (currentTimestamp - usage.lastReset > 1000) {
        delete sceneIdUsageRecord[sceneId];
      }
    }
  }

  static get: CallableFunction = async (
    session: Analytics.Session.Config | User.Session.Config
  ): Promise<Analytics.Session.Config | User.Session.Config | void> => {
    const { pk, sk } = session;
    if (!pk || !sk) {
      console.log("PROBLEM:");
      console.log(session);
    }
    const table =
      session.pk === Analytics.Session.Config.pk
        ? vlmAnalyticsTable
        : vlmSessionsTable;
    const params = {
      TableName: table,
      Key: {
        pk,
        sk,
      },
    };
    try {
      const sessionRecord = await daxClient.get(params).promise();
      return sessionRecord.Item as
        | Analytics.Session.Config
        | User.Session.Config;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/get",
        session,
      });
      console.log(error);
      return;
    }
  };

  static activeVLMSessionsByUserId: CallableFunction = async (
    userId: string
  ): Promise<User.Session.Config[]> => {
    const params = {
      TableName: vlmSessionsTable,
      IndexName: "userId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#userId": "userId",
      },
      ExpressionAttributeValues: {
        ":pk": User.Session.Config.pk,
        ":userId": userId,
      },
      KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };

    try {
      const sessionRecords = await largeQuery(params),
        expandedRecords: User.Session.Config[] = [];
      for (let i = 0; i < sessionRecords.length; i++) {
        const expanded: User.Session.Config = await this.get(sessionRecords[i]);
        if (expanded && !expanded.sessionEnd) {
          expandedRecords.push(expanded);
        }
      }
      return expandedRecords;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/getVLMByUserId",
        userId,
      });
      return [];
    }
  };

  static getRecentAnalyticsSession: CallableFunction = async (
    userId: string
  ): Promise<Analytics.Session.Config> => {
    const sessionStartBuffer = DateTime.now()
      .minus({ minutes: 5 })
      .toUnixInteger();
    const params = {
      TableName: vlmAnalyticsTable,
      IndexName: "userId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#userId": "userId",
      },
      ExpressionAttributeValues: {
        ":pk": Analytics.Session.Config.pk,
        ":userId": userId,
      },
      KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };

    try {
      const sessionRecords = await largeQuery(params);
      for (let i = 0; i < sessionRecords.length; i++) {
        const expanded: Analytics.Session.Config = await this.get(
          sessionRecords[i]
        );
        if (expanded && expanded.sessionStart >= sessionStartBuffer) {
          expanded.sessionEnd = null;
          return expanded;
        }
      }
      return;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/recentAnalyticsSessionsByUserId",
        userId,
      });
      return;
    }
  };

  static update: CallableFunction = async (session: BaseSession.Config) => {
    const table =
      session.pk == Analytics.Session.Config.pk
        ? vlmAnalyticsTable
        : vlmSessionsTable;

    const params: DocumentClient.UpdateItemInput = {
      TableName: table,
      Key: { pk: session.pk, sk: session.sk },
      UpdateExpression: "set #ts = :ts",
      ConditionExpression: "#ts = :sessionTs",
      ExpressionAttributeNames: { "#ts": "ts" },
      ExpressionAttributeValues: {
        ":sessionTs": session.ts,
        ":ts": DateTime.now().toUnixInteger(),
      },
    };

    try {
      await daxClient.update(params).promise();
      return await SessionDbManager.get(session);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/update",
        session,
      });
    }
  };

  static addPathId: CallableFunction = async (
    session: Analytics.Session.Config,
    path: Analytics.Path
  ) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmAnalyticsTable,
      Key: { pk: session.pk, sk: session.sk },
      UpdateExpression:
        "set #ts = :ts, #pathIds = list_append(if_not_exists(#pathIds, :emptyList), :pathIds)",
      ConditionExpression: "#ts = :sessionTs",
      ExpressionAttributeNames: { "#ts": "ts", "#pathIds": "pathIds" },
      ExpressionAttributeValues: {
        ":pathIds": [path.sk],
        ":sessionTs": session.ts,
        ":emptyList": new Array(),
        ":ts": DateTime.now().toUnixInteger(),
      },
    };

    try {
      await daxClient.update(params).promise();
      return await SessionDbManager.get(session);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/addPathId",
        session,
      });
    }
  };

  static renew: CallableFunction = async (
    session: User.Session.Config | Analytics.Session.Config
  ) => {
    const table =
      session.pk == Analytics.Session.Config.pk
        ? vlmAnalyticsTable
        : vlmSessionsTable;

    const params: DocumentClient.UpdateItemInput = {
      TableName: table,
      Key: { pk: session.pk, sk: session.sk },
      ConditionExpression:
        "attribute_not_exists(sessionEnd) AND #ts <= :sessionTs",
      UpdateExpression:
        "set #ts = :ts, #expires = :expires, #sessionToken = :sessionToken, #signatureToken = :signatureToken",
      ExpressionAttributeNames: {
        "#ts": "ts",
        "#expires": "expires",
        "#sessionToken": "sessionToken",
        "#signatureToken": "signatureToken",
      },
      ExpressionAttributeValues: {
        ":sessionTs": session.ts,
        ":sessionToken": session.sessionToken || "",
        ":signatureToken": session.signatureToken || "",
        ":expires": session.expires,
        ":ts": DateTime.now().toUnixInteger(),
      },
    };

    try {
      await daxClient.update(params).promise();
      return await SessionDbManager.get(session);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/renew",
        session,
      });
    }
  };

  static refresh: CallableFunction = async (
    session: User.Session.Config | Analytics.Session.Config
  ) => {
    const table =
      session.pk == Analytics.Session.Config.pk
        ? vlmAnalyticsTable
        : vlmSessionsTable;

    const params: DocumentClient.UpdateItemInput = {
      TableName: table,
      Key: { pk: session.pk, sk: session.sk },
      ConditionExpression: "#ts <= :sessionTs",
      UpdateExpression:
        "set #ts = :ts, #sessionEnd = :sessionEnd, #sessionToken = :sessionToken, #refreshToken = :refreshToken, #signatureToken = :signatureToken, #expires = :expires",
      ExpressionAttributeNames: {
        "#ts": "ts",
        "#sessionEnd": "sessionEnd",
        "#sessionToken": "sessionToken",
        "#signatureToken": "signatureToken",
        "#refreshToken": "refreshToken",
        "#expires": "expires",
      },
      ExpressionAttributeValues: {
        ":sessionTs": session.ts,
        ":sessionEnd": null,
        ":sessionToken": session.sessionToken || null,
        ":signatureToken": session.signatureToken || null,
        ":refreshToken": session.refreshToken || null,
        ":expires": session.expires || null,
        ":ts": DateTime.now().toUnixInteger(),
      },
    };

    try {
      await daxClient.update(params).promise();
      return await SessionDbManager.get(session);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/refresh",
        session,
      });
    }
  };

  static end: CallableFunction = async (
    session: Analytics.Session.Config | User.Session.Config
  ) => {
    const table =
      session.pk == Analytics.Session.Config.pk
        ? vlmAnalyticsTable
        : vlmSessionsTable;

    const endTime = DateTime.now().toUnixInteger();
    try {
      const params: DocumentClient.UpdateItemInput = {
        TableName: table,
        Key: { pk: session.pk, sk: session.sk },
        UpdateExpression: "set #ts = :ts, #sessionEnd = :sessionEnd",
        ExpressionAttributeNames: { "#ts": "ts", "#sessionEnd": "sessionEnd" },
        ExpressionAttributeValues: {
          ":sessionEnd": endTime,
          ":ts": endTime,
        },
      };

      await docClient.update(params).promise();
      return session;
    } catch (error) {
      console.log(error);
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/end",
        session,
      });
    }
    return;
  };

  static getPath: CallableFunction = async (
    userSessionPath: Analytics.Path
  ) => {
    const { pk, sk } = userSessionPath;

    const params = {
      TableName: vlmAnalyticsTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const userSessionPathRecord = await daxClient.get(params).promise();
      return userSessionPathRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/getPath",
        userSessionPath,
      });
    }
  };

  static getPathById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmAnalyticsTable,
      Key: {
        pk: Analytics.Path.pk,
        sk,
      },
    };

    try {
      const userSessionPathRecord = await daxClient.get(params).promise();
      return userSessionPathRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/getPathById",
        sk,
      });
    }
  };

  static createPath: CallableFunction = async (
    path: Analytics.Path,
    pathSegment: Analytics.PathSegment
  ) => {
    const ts = DateTime.now().toUnixInteger();

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            // Add a path
            Item: {
              ...path,
              ts,
            },
            TableName: vlmAnalyticsTable,
          },
        },
        {
          Put: {
            // Add the first path segment
            Item: {
              ...pathSegment,
              ts,
            },
            TableName: vlmAnalyticsTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      return await SessionDbManager.getPath(path);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/createPath",
      });
    }
  };

  static addPathSegments: CallableFunction = async (
    pathId: string,
    pathSegments: Analytics.PathSegment[]
  ) => {
    const ts = DateTime.now().toUnixInteger();

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [],
    };

    try {
      for (let i = 0; i < pathSegments.length; i++) {
        params.TransactItems.push(
          {
            Put: {
              // Add a path segment to the path
              Item: {
                ...pathSegments[i],
                ts,
              },
              TableName: vlmAnalyticsTable,
            },
          },
          {
            Update: {
              // Update the path with the new path segments
              TableName: vlmAnalyticsTable,
              Key: {
                pk: Analytics.Path.pk,
                sk: pathId,
              },
              UpdateExpression:
                "set #segments = list_append(if_not_exists(#segments, :emptyList), :pathSegment), #ts = :ts",
              ExpressionAttributeNames: {
                "#segments": "segments",
                "#ts": "ts",
              },
              ExpressionAttributeValues: {
                ":pathSegment": [pathSegments[i].sk],
                ":emptyList": [],
                ":ts": ts,
              },
            },
          }
        );
      }

      await docClient.transactWrite(params).promise();

      const path = await SessionDbManager.getPathById(pathId);

      return { added: pathSegments.length, total: path.segments.length };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/addPathSegments",
      });
    }
  };
}
