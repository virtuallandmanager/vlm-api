import { SceneImage, SceneImageConfig } from "../models/SceneImage.model";
import { docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";

export abstract class SceneImageDbManager {
  static obtain: CallableFunction = async (
    imageConfig: SceneImageConfig
  ) => {
    let existingSceneImage, createdSceneImage;
    try {
      existingSceneImage = await this.get(imageConfig);
      if (!existingSceneImage) {
        createdSceneImage = await this.put(imageConfig);
      }

      return createdSceneImage || existingSceneImage;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "SceneImage.data/obtain",
        imageConfig,
      });
    }
  };

  static get: CallableFunction = async (
    imageConfig: SceneImageConfig
  ) => {
    const image = new SceneImage(imageConfig),
      { pk, sk } = image;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const imageRecord = await docClient.get(params).promise();
      return imageRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "SceneImage.data/get",
        imageConfig,
      });
    }
  };

  static put: CallableFunction = async (
    imageConfig: SceneImageConfig
  ) => {
    const image = new SceneImage(imageConfig);

    const params = {
      TableName: vlmMainTable,
      Item: {
        ...image,
        ts: Date.now(),
      }
    };

    try {
      const imageRecord = await docClient.put(params).promise();
      return imageRecord.Attributes;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "SceneImage.data/put",
        imageConfig,
      });
    }
  };
}
