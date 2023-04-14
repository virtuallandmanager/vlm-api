import {
  SceneVideo,
  SceneVideoConfig,
  SceneVideoInstance,
  SceneVideoInstanceConfig,
} from "../models/SceneVideo.model";
import { docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";

export abstract class SceneVideoDbManager {
  static get: CallableFunction = async (config: SceneVideoConfig) => {
    const videoScreen = new SceneVideo(config),
      { pk, sk } = videoScreen;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const videoScreenRecord = await docClient.get(params).promise();
      return videoScreenRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "SceneVideo.data/get",
        config,
      });
    }
  };

  static put: CallableFunction = async (config: SceneVideoConfig) => {
    const videoScreen = new SceneVideo(config);

    const params = {
      TableName: vlmMainTable,
      Item: {
        ...videoScreen,
        ts: Date.now(),
      }
    };

    try {
      const videoScreenRecord = await docClient.put(params).promise();
      return videoScreenRecord.Attributes;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "SceneVideo.data/put",
        config,
      });
    }
  };

  static getInstance: CallableFunction = async (
    config: SceneVideoInstanceConfig
  ) => {
    const sceneVideoInstance = new SceneVideoInstance(config),
      { pk, sk } = sceneVideoInstance;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const videoScreenRecord = await docClient.get(params).promise();
      return videoScreenRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "SceneVideo.data/get",
        config,
      });
    }
  };

  static putInstance: CallableFunction = async (
    config: SceneVideoInstanceConfig
  ) => {
    const videoInstance = new SceneVideoInstance(config);

    const params = {
      TableName: vlmMainTable,
      Item: {
        ...videoInstance,
        ts: Date.now(),
      },
    };

    try {
      const videoScreenRecord = await docClient.put(params).promise();
      return videoScreenRecord.Attributes;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "SceneVideo.data/put",
        config,
      });
    }
  };
}
