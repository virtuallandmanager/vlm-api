import { Scene } from "../models/Scene.model";
import { docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";

export abstract class ScenePresetDbManager {
  static getOrCreate: CallableFunction = async (scenePreset: Scene.Preset) => {
    let existingScenePreset, createdScenePreset;
    try {
      existingScenePreset = await this.get(scenePreset);
      if (!existingScenePreset) {
        createdScenePreset = await this.put(scenePreset);
      }

      return createdScenePreset || existingScenePreset;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "ScenePreset.data/getOrCreate",
        scenePreset,
      });
    }
  };

  static get: CallableFunction = async (scenePreset: Scene.Preset) => {
    const { pk, sk } = scenePreset;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const sceneRecord = await docClient.get(params).promise();
      return sceneRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "ScenePreset.data/getSceneOrCreate",
        scenePreset,
      });
    }
  };

  static put: CallableFunction = async (scenePreset: Scene.Preset) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...scenePreset,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return scenePreset;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "ScenePreset.data/getSceneOrCreate",
        scenePreset,
      });
    }
  };
}
