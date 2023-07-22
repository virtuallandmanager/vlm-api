import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Session as BaseSession } from "../models/Session.model";
import { daxClient, docClient, vlmAnalyticsTable, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { DateTime } from "luxon";
import { largeQuery } from "../helpers/data";
import { Analytics } from "../models/Analytics.model";
import { User } from "../models/User.model";

export abstract class SessionDbManager {
  static start: CallableFunction = async (sessionConfig: BaseSession.Config) => {
    const startTime = DateTime.now();
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: sessionConfig.pk, sk: sessionConfig.sk },
      ExpressionAttributeNames: {
        "#ts": "ts",
        "#sessionStart": "sessionStart",
      },
      ExpressionAttributeValues: {
        ":sessionStart": startTime.toMillis(),
        ":ts": Date.now(),
      },
      UpdateExpression: "SET #ts = :ts, #sessionStart = :sessionStart",
    };

    try {
      await docClient.update(params).promise();
      return await this.get(sessionConfig);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/start",
        sessionConfig,
      });
    }
  };

  static create: CallableFunction = async (session: BaseSession.Config, expirationTime?: { hours: number; minutes: number; seconds: number }) => {
    const ttl = expirationTime ? DateTime.now().plus(expirationTime).toMillis() : undefined;

    const params = {
      TableName: vlmMainTable,
      Item: {
        ...session,
        ts: Date.now(),
        ttl,
      },
    };

    try {
      const dbSession = await docClient.put(params).promise();
      return dbSession.Attributes;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/create",
        session,
      });
    }
  };

  static logAnalyticsAction: CallableFunction = async (config: Analytics.Session.Action) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...config,
        ts: Date.now(),
        ttl: DateTime.now().plus({ months: 12 }).toMillis(),
      },
    };

    try {
      await docClient.put(params).promise();
      return true;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/logAnalyticsAction",
      });
      return false;
    }
  };

  static get: CallableFunction = async (session: Analytics.Session.Config | User.Session.Config): Promise<Analytics.Session.Config | User.Session.Config | void> => {
    const { pk, sk } = session;
    if (!pk || !sk) {
      console.log(`PROBLEM: ${session}`);
    }
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };
    try {
      const sessionRecord = await daxClient.get(params).promise();
      return sessionRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/get",
        session,
      });
      throw error;
    }
  };

  static activeVLMSessionsByUserId: CallableFunction = async (userId: string): Promise<User.Session.Config[]> => {
    const params = {
      TableName: vlmMainTable,
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

  static update: CallableFunction = async (session: BaseSession.Config) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: session.pk, sk: session.sk },
      UpdateExpression: "set #ts = :ts",
      ConditionExpression: "#ts = :sessionTs",
      ExpressionAttributeNames: { "#ts": "ts" },
      ExpressionAttributeValues: {
        ":sessionTs": session.ts,
        ":ts": Date.now(),
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

  static addPathId: CallableFunction = async (session: BaseSession.Config, path: Analytics.Path) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: session.pk, sk: session.sk },
      UpdateExpression: "set #ts = :ts, #pathIds = list_append(if_not_exists(#pathIds, :emptyList), :pathIds)",
      ConditionExpression: "#ts = :sessionTs",
      ExpressionAttributeNames: { "#ts": "ts", "#pathIds": "pathIds" },
      ExpressionAttributeValues: {
        ":pathIds": [path.sk],
        ":sessionTs": session.ts,
        ":emptyList": new Array(),
        ":ts": Date.now(),
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

  static renew: CallableFunction = async (session: User.Session.Config | Analytics.Session.Config) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: session.pk, sk: session.sk },
      ConditionExpression: "attribute_not_exists(sessionEnd) AND #ts <= :sessionTs",
      UpdateExpression: "set #ts = :ts, #expires = :expires, #sessionToken = :sessionToken, #signatureToken = :signatureToken",
      ExpressionAttributeNames: { "#ts": "ts", "#expires": "expires", "#sessionToken": "sessionToken", "#signatureToken": "signatureToken" },
      ExpressionAttributeValues: {
        ":sessionTs": session.ts,
        ":sessionToken": session.sessionToken,
        ":signatureToken": session.signatureToken,
        ":expires": session.expires,
        ":ts": Date.now(),
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

  static end: CallableFunction = async (session: Analytics.Session.Config | User.Session.Config) => {
    const endTime = DateTime.now().toUnixInteger();
    try {
      const params: DocumentClient.UpdateItemInput = {
        TableName: vlmMainTable,
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

  static getPath: CallableFunction = async (userSessionPath: Analytics.Path) => {
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

  static createPath: CallableFunction = async (path: Analytics.Path, pathSegment: Analytics.PathSegment) => {
    const ts = Date.now();

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

  static addPathSegments: CallableFunction = async (pathId: string, pathSegments: Analytics.PathSegment[]) => {
    const ts = Date.now(),
      pathSegmentIds = pathSegments.map((pathSegment) => pathSegment.sk);

    try {
      for (let i = 0; i < pathSegments.length; i++) {
        const params: DocumentClient.TransactWriteItemsInput = {
          TransactItems: [
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
                UpdateExpression: "set #segments = list_append(if_not_exists(#segments, :emptyList), :pathSegment), #ts = :ts",
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
            },
          ],
        };
        await docClient.transactWrite(params).promise();
      }

      const path = await SessionDbManager.getPathById(pathId);

      return { added: pathSegments.length, total: path.pathSegments.length };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/addPathSegments",
      });
    }
  };
}
