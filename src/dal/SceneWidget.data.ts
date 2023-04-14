import { SceneWidget, SceneWidgetConfig } from "../models/SceneWidget.model";
import { docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";

export abstract class SceneWidgetDbManager {
  static getOrCreate: CallableFunction = async (
    sceneWidgetConfig: SceneWidgetConfig
  ) => {
    let existingSceneWidget, createdSceneWidget;
    try {
      existingSceneWidget = await this.get(sceneWidgetConfig);
      if (!existingSceneWidget) {
        createdSceneWidget = await this.put(sceneWidgetConfig);
      }

      return createdSceneWidget || existingSceneWidget;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "SceneWidget.data/getOrCreate",
        sceneWidgetConfig,
      });
    }
  };

  static get: CallableFunction = async (sceneWidgetConfig: SceneWidgetConfig) => {
    const { pk, sk } = sceneWidgetConfig;

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
        from: "Scene.data/getSceneOrCreate",
        sceneWidgetConfig,
      });
    }
  };

  static put: CallableFunction = async (sceneWidgetConfig: SceneWidgetConfig) => {
    const sceneWidget = new SceneWidget(sceneWidgetConfig);

    const params = {
      TableName: vlmMainTable,
      Item: {
        ...sceneWidget,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return sceneWidget;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "SceneWidget.data/getSceneOrCreate",
        sceneWidgetConfig,
      });
    }
  };
}
