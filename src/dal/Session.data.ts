import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Session as BaseSession } from "../models/Session.model";
import { daxClient, docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { DateTime } from "luxon";
import { largeQuery } from "../helpers/data";
import { Analytics } from "../models/Analytics.model";
import { User } from "../models/User.model";

export abstract class SessionDbManager {
  static start: CallableFunction = async (session: BaseSession.Config) => {
    const startTime = DateTime.now();
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: session.pk, sk: session.sk },
      ExpressionAttributeNames: {
        "#ts": "ts",
        "#ttl": "ttl",
        "#sessionStart": "sessionStart",
      },
      ExpressionAttributeValues: {
        ":sessionStart": startTime.toUnixInteger(),
        ":ts": Date.now(),
      },
    };

    if (session.pk == Analytics.Session.Config.pk) {
      params.UpdateExpression = "SET #ts = :ts, #sessionStart = :sessionStart REMOVE #ttl";
    } else {
      params.ExpressionAttributeValues[":ttl"] = startTime.plus({ hours: 12 }).toUnixInteger();
      params.UpdateExpression = "SET #ts = :ts, #sessionStart = :sessionStart, #ttl = :ttl";
    }

    try {
      const session = await docClient.update(params).promise();
      return session.Attributes;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/start",
        session,
      });
    }
  };

  static create: CallableFunction = async (session: BaseSession.Config, expirationTime?: { hours: number; minutes: number; seconds: number }) => {
    const ttl = expirationTime ? DateTime.now().plus(expirationTime).toUnixInteger() : undefined;

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
        from: "Session.data/start",
        session,
      });
    }
  };

  static get: CallableFunction = async (session: BaseSession.Config): Promise<User.Session.Config | void> => {
    const { pk, sk } = session;
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const sessionRecord = await daxClient.get(params).promise();
      if (sessionRecord?.Item?.sessionEnd <= Date.now()) {
        return;
      }
      return sessionRecord.Item as User.Session.Config;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/getVLM",
        session,
      });
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
      const sessionRecords = await largeQuery(params);
      return sessionRecords;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/getVLMByUserId",
        userId,
      });
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

  static addPathId: CallableFunction = async (session: BaseSession.Config, path: Analytics.Session.Path) => {
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

  static renew: CallableFunction = async (session: BaseSession.Config) => {
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
        from: "Session.data/end",
        session,
      });
    }
  };

  static end: CallableFunction = async (session: BaseSession.Config) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: session.pk, sk: session.sk },
      ConditionExpression: "attribute_not_exists(sessionEnd) AND #ts <= :sessionTs",
      UpdateExpression: "set #ts = :ts, #sessionEnd = :sessionEnd, #ttl = :sessionEnd",
      ExpressionAttributeNames: { "#ts": "ts", "#sessionEnd": "sessionEnd", "#ttl": "ttl" },
      ExpressionAttributeValues: {
        ":sessionEnd": session.sessionEnd,
        ":sessionTs": session.ts,
        ":ts": Date.now(),
      },
    };

    try {
      await daxClient.update(params).promise();
      return await SessionDbManager.get(session);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Session.data/end",
        session,
      });
    }
  };

  static getPath: CallableFunction = async (userSessionPath: Analytics.Session.Path) => {
    const { pk, sk } = userSessionPath;

    const params = {
      TableName: vlmMainTable,
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
      TableName: vlmMainTable,
      Key: {
        pk: Analytics.Session.Path.pk,
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

  static createPath: CallableFunction = async (path: Analytics.Session.Path, pathLink: Analytics.Session.PathLink) => {
    const ts = Date.now();

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            // Add a scene
            Item: {
              ...path,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            // Add preset for scene
            Item: {
              ...pathLink,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      return await SessionDbManager.getPath(path);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/initScene",
      });
    }
  };

  static extendPath: CallableFunction = async (path: Analytics.Session.Path) => {
    try {
      const params = {
        TableName: vlmMainTable,
        Key: {
          pk: path.pk,
          sk: path.sk,
        },
        UpdateExpression: "set #path = list_append(if_not_exists(#path, :emptyList), :pathPoint)",
        ExpressionAttributeNames: {
          "#path": "path",
        },
        ExpressionAttributeValues: {
          ":pathPoint": [path.path],
          ":emptyList": new Array(),
        },
      };

      await daxClient.update(params).promise();
      return await SessionDbManager.getPath(path);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "UserSessionPath.data/put",
        path,
      });
    }
  };
}
