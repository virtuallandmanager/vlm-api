import { User } from "../models/User.model";
import { docClient, vlmLandLegacyTable, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { AttributeMap, DocumentClient } from "aws-sdk/clients/dynamodb";
import { largeQuery } from "../helpers/data";
import { Scene } from "../models/Scene.model";

export abstract class SceneDbManager {
  static get: CallableFunction = async (scene: Scene.Config) => {
    const { pk, sk } = scene;

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
        from: "Scene.data/get",
        scene,
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
    const scene = data.Items.find((parcel: AttributeMap) => {
      return `${parcel.x},${parcel.y}` == baseParcel;
    });

    return scene;
  };

  static getAllLegacy: CallableFunction = async () => {
    var params = {
      TableName: vlmLandLegacyTable,
    };
    const data = await docClient.scan(params).promise();
    const scenes = data.Items.filter((parcel: AttributeMap) => {
      return parcel.baseParcel && parcel.propertyName;
    });

    return scenes;
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
        ":pk": Scene.Config.pk,
        ":userId": user.sk,
      },
      KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };

    try {
      const sceneRecords = await largeQuery(params);
      return sceneRecords;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getByUser",
        user,
      });
    }
  };

  static getIdsForUser: CallableFunction = async (user: User.Account) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: "userId-index",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#userId": "userId",
      },
      ExpressionAttributeValues: {
        ":pk": User.SceneLink.pk,
        ":userId": user.sk,
      },
      KeyConditionExpression: "#pk = :pk and #userId = :userId",
    };

    try {
      const sceneLinks = await largeQuery(params);
      const ids = sceneLinks.map((sceneLink: User.SceneLink) => sceneLink.sceneId);
      return ids;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getIdsByUser",
        user,
      });
    }
  };

  static getListById: CallableFunction = async (sceneIds: string[]) => {
    const scenes: Scene.Config[] = [];

    sceneIds.forEach(async (sceneId: string) => {
      const params = {
        TableName: vlmMainTable,
        Key: {
          pk: Scene.Config.pk,
          sk: sceneId,
        },
      };

      try {
        const sceneRecord = await docClient.get(params).promise();
        scenes.push(sceneRecord.Item as Scene.Config);
      } catch (error) {
        AdminLogManager.logError(JSON.stringify(error), {
          from: "Scene.data/get",
          sceneIds,
          sceneId,
        });
      }
    });
    return scenes;
  };

  static initScene: CallableFunction = async (scene: Scene.Config, preset: Scene.Preset, sceneLink: User.SceneLink) => {
    const ts = Date.now();

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            // Add a scene
            Item: {
              ...scene,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            // Add preset for scene
            Item: {
              ...preset,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            // Add preset for scene
            Item: {
              ...sceneLink,
              ts,
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      return scene;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/initScene",
      });
    }
  };

  static createScenePreset: CallableFunction = async (scene: Scene.Config, scenePreset: Scene.Preset) => {
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            // Add a scene preset
            Item: {
              ...scenePreset,
              ts: Date.now(),
            },
            TableName: vlmMainTable,
          },
        },
        {
          Update: {
            // Add scene to user
            Key: {
              pk: Scene.Config.pk,
              sk: scene.sk,
            },
            UpdateExpression: "set #scenePresetIds = list_append(if_not_exists(#scenePresetIds, :empty_list), :presetId)",
            ExpressionAttributeNames: {
              "#scenePresetIds": "scenePresetIds",
            },
            ExpressionAttributeValues: {
              ":presetId": [scenePreset.sk],
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      return { scene, scenePreset };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addSceneForUser",
      });
    }
  };

  static put: CallableFunction = async (scene: Scene.Config) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...scene,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return await SceneDbManager.get(scene);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/put",
        scene,
      });
    }
  };
}
