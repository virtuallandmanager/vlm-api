import { Event } from "../models/Event.model";
import { largeQuery, vlmAnalyticsTable, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { AttributeValue, Key, QueryInput } from "aws-sdk/clients/dynamodb";
import { User } from "../models/User.model";
import { Organization } from "../models/Organization.model";
import { Scene } from "../models/Scene.model";
import { Analytics } from "../models/Analytics.model";
import { Log } from "../models/Log.model";
import { DateTime } from "luxon";

export abstract class AdminDbManager {
  static getUsers: CallableFunction = async (
    pageSize?: number,
    lastEvaluated?: Key,
    sort?: string
  ) => {
    let params: QueryInput = {
      TableName: vlmMainTable,
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":pk": User.Account.pk as AttributeValue,
      },
      KeyConditionExpression: "#pk = :pk",
      Limit: pageSize || 100,
    };

    if (lastEvaluated) {
      params.ExclusiveStartKey = lastEvaluated;
    }

    try {
      const users = await largeQuery(params);
      return users;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Admin.data/getUsers",
      });
      return;
    }
  };

  static getUserSessions: CallableFunction = async (
    pageSize?: number,
    lastEvaluated?: Key,
    sort?: string
  ) => {
    let params: QueryInput = {
      TableName: vlmMainTable,
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#expires": "expires",
      },
      ExpressionAttributeValues: {
        ":pk": User.Session.Config.pk as AttributeValue,
        ":ts": DateTime.now().toMillis() as AttributeValue,
      },
      KeyConditionExpression: "#pk = :pk",
      FilterExpression: "#expires >= :ts",
      Limit: pageSize || 100,
    };

    if (lastEvaluated) {
      params.ExclusiveStartKey = lastEvaluated;
    }

    try {
      const users = await largeQuery(params);
      return users;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Admin.data/getUserSessions",
      });
      return;
    }
  };

  static getAnalyticsSessions: CallableFunction = async (
    pageSize?: number,
    lastEvaluated?: Key,
    sort?: string
  ) => {
    let params: QueryInput = {
      TableName: vlmAnalyticsTable,
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#expires": "expires",
      },
      ExpressionAttributeValues: {
        ":pk": Analytics.Session.Config.pk as AttributeValue,
        ":ts": DateTime.now().toMillis() as AttributeValue,
      },
      KeyConditionExpression: "#pk = :pk",
      FilterExpression: "#expires >= :ts",
      Limit: pageSize || 100,
    };

    if (lastEvaluated) {
      params.ExclusiveStartKey = lastEvaluated;
    }

    try {
      const users = await largeQuery(params);
      return users;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Admin.data/getAnalyticsSessions",
      });
      return;
    }
  };

  static getOrganizations: CallableFunction = async (
    pageSize?: number,
    lastEvaluated?: Key,
    sort?: string
  ) => {
    let params: QueryInput = {
      TableName: vlmMainTable,
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":pk": Organization.Account.pk as AttributeValue,
      },
      KeyConditionExpression: "#pk = :pk",
      ProjectionExpression: "sk, displayName, createdAt",
      Limit: pageSize || 100,
    };

    if (lastEvaluated) {
      params.ExclusiveStartKey = lastEvaluated;
    }

    try {
      const orgs = await largeQuery(params);
      return orgs;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Admin.data/getOrganizations",
      });
      return;
    }
  };

  static getScenes: CallableFunction = async (
    pageSize?: number,
    lastEvaluated?: Key,
    sort?: string
  ) => {
    let params: QueryInput = {
      TableName: vlmMainTable,
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":pk": Scene.Config.pk as AttributeValue,
      },
      KeyConditionExpression: "#pk = :pk",
      ProjectionExpression: "sk, #name, createdAt, scenePresetIds",
      Limit: pageSize || 100,
    };

    if (lastEvaluated) {
      params.ExclusiveStartKey = lastEvaluated;
    }

    try {
      const scenes = await largeQuery(params);
      return scenes;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Admin.data/getScenes",
      });
      return;
    }
  };

  static getEvents: CallableFunction = async (
    pageSize?: number,
    lastEvaluated?: Key,
    sort?: string
  ) => {
    let params: QueryInput = {
      TableName: vlmMainTable,
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":pk": Event.Config.pk as AttributeValue,
      },
      KeyConditionExpression: "#pk = :pk",
      ProjectionExpression: "sk, #name, startTime, endTime, created",
      Limit: pageSize || 100,
    };

    if (lastEvaluated) {
      params.ExclusiveStartKey = lastEvaluated;
    }

    try {
      const events = await largeQuery(params);
      return events;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Admin.data/getEvents",
      });
      return;
    }
  };

  static getErrorLogs: CallableFunction = async (
    pageSize?: number,
    lastEvaluated?: Key,
    sort?: string
  ) => {
    let params: QueryInput = {
      TableName: vlmMainTable,
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":pk": Log.AdminLogError.pk as AttributeValue,
      },
      KeyConditionExpression: "#pk = :pk",
      ProjectionExpression: "sk, #name, startTime, endTime, created",
      Limit: pageSize || 1000,
    };

    if (lastEvaluated) {
      params.ExclusiveStartKey = lastEvaluated;
    }

    try {
      const events = await largeQuery(params);
      return events;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Admin.data/getErrorLogs",
      });
      return;
    }
  };

  static getWarningLogs: CallableFunction = async (
    pageSize?: number,
    lastEvaluated?: Key,
    sort?: string
  ) => {
    let params: QueryInput = {
      TableName: vlmMainTable,
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":pk": Log.AdminLogError.pk as AttributeValue,
      },
      KeyConditionExpression: "#pk = :pk",
      ProjectionExpression: "sk, #name, startTime, endTime, created",
      Limit: pageSize || 1000,
    };

    if (lastEvaluated) {
      params.ExclusiveStartKey = lastEvaluated;
    }

    try {
      const events = await largeQuery(params);
      return events;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Admin.data/getWarningLogs",
      });
      return;
    }
  };

  static getInfoLogs: CallableFunction = async (
    pageSize?: number,
    lastEvaluated?: Key,
    sort?: string
  ) => {
    let params: QueryInput = {
      TableName: vlmMainTable,
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":pk": Log.AdminLogInfo.pk as AttributeValue,
      },
      KeyConditionExpression: "#pk = :pk",
      ProjectionExpression: "sk, #name, startTime, endTime, created",
      Limit: pageSize || 1000,
    };

    if (lastEvaluated) {
      params.ExclusiveStartKey = lastEvaluated;
    }

    try {
      const events = await largeQuery(params);
      return events;
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Admin.data/getInfoLogs",
      });
      return;
    }
  };
}
