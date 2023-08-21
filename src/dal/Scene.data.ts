import { User } from "../models/User.model";
import { daxClient, docClient, vlmLandLegacyTable, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { AttributeMap, DocumentClient } from "aws-sdk/clients/dynamodb";
import { largeQuery } from "../helpers/data";
import { Scene } from "../models/Scene.model";
import { DateTime } from "luxon";
import { GenericDbManager } from "./Generic.data";
import { VLMSceneMessage } from "../ws/rooms/events/VLMScene.events";

export abstract class SceneDbManager {
  static get: CallableFunction = async (scene: Scene.Config) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Scene.Config.pk,
        sk: scene.sk,
      },
    };

    try {
      const sceneRecord = await daxClient.get(params).promise();
      return sceneRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/get",
        scene,
      });
      return;
    }
  };

  static getPreset: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Scene.Preset.pk,
        sk,
      },
    };

    try {
      const sceneRecord = await daxClient.get(params).promise();
      return sceneRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getPreset",
        sk,
      });
      return;
    }
  };

  static getSetting: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Scene.Setting.pk,
        sk,
      },
    };

    try {
      const sceneRecord = await daxClient.get(params).promise();
      return sceneRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getSetting",
        sk,
      });
      return;
    }
  };

  static getSceneUserState: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Scene.UserState.pk,
        sk,
      },
    };

    try {
      const sceneRecord = await daxClient.get(params).promise();
      return sceneRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getSceneUserState",
        sk,
      });
      return;
    }
  };

  static setSceneUserState: CallableFunction = async (state: Scene.UserState, key: string, value: unknown) => {
    const newState = { ...state, [key]: value }
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Scene.UserState.pk,
        sk: state.sk,
      },
      UpdateExpression: "set #prop = :prop, #ts = :ts",
      ConditionExpression: "#ts <= :stateTs",
      ExpressionAttributeNames: { "#prop": "state", "#ts": "ts" },
      ExpressionAttributeValues: {
        ":prop": newState,
        ":stateTs": state.ts || Date.now(),
        ":ts": Date.now(),
      },
    };

    try {
      await daxClient.update(params).promise();
      const fullState = await SceneDbManager.getSceneUserState(state.sk);
      return fullState && fullState[key]
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/put",
        state,
      });
      return;
    }
  };

  static getById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Scene.Config.pk,
        sk,
      },
    };

    try {
      const sceneRecord = await daxClient.get(params).promise();
      return sceneRecord.Item;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getById",
        sk,
      });
      return;
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

  static getIdsForUser: CallableFunction = async (user: User.Account) => {
    try {
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

      const sceneLinks = await largeQuery(params),
        sceneLinkIds = sceneLinks.map((sceneLink: User.SceneLink) => sceneLink.sk),
        ids = await SceneDbManager.getSceneIdsFromLinkIds(sceneLinkIds);

      if (user?.hideDemoScene) {
        return ids || [];
      } else if (ids?.length) {
        return [Scene.DemoSceneId, ...ids];
      } else {
        return [Scene.DemoSceneId];
      }
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getIdsByUser",
        user,
      });
      return;
    }
  };

  static getSceneIdsFromLinkIds: CallableFunction = async (sks: string[]) => {
    try {
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
              pk: User.SceneLink.pk,
              sk,
            },
            TableName: vlmMainTable,
          },
        });
      });

      const response = await docClient.transactGet(params).promise(),
        sceneLinks = response.Responses.map((item) => item.Item as User.SceneLink),
        sceneIds = sceneLinks.map((sceneLink: User.SceneLink) => sceneLink.sceneId);
      return sceneIds;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getSceneIdsFromLinkIds",
        sks,
      });
      return;
    }
  };

  static getByIds: CallableFunction = async (sks: string[]) => {
    if (!sks?.length) {
      return;
    }
    const params: DocumentClient.TransactGetItemsInput = {
      TransactItems: [],
    };

    sks.forEach((sk: string) => {
      if (!sk) {
        return;
      }
      params.TransactItems.push({
        Get: {
          // Add a connection from organization to user
          Key: {
            pk: Scene.Config.pk,
            sk,
          },
          TableName: vlmMainTable,
        },
      });
    });

    try {
      const response = await docClient.transactGet(params).promise(),
        scenes = response.Responses.map((item) => item.Item as Scene.Config);
      return scenes?.length ? scenes : [];
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/getSceneLinksFromIds",
        sks,
      });
      return;
    }
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
      return;
    }
  };

  static addPresetToScene: CallableFunction = async (sceneConfig: Scene.Config, scenePreset: Scene.Preset) => {
    const sk = scenePreset.sk;
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            // Add preset id to scene presets array
            Key: {
              pk: Scene.Config.pk,
              sk: sceneConfig.sk,
            },
            UpdateExpression: "SET #presets = list_append(if_not_exists(#presets, :empty_list), :presetIds)",
            ExpressionAttributeNames: {
              "#presets": "presets",
            },
            ExpressionAttributeValues: {
              ":presetIds": [sk],
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            // Create a scene preset
            Item: {
              ...scenePreset,
              ts: Date.now(),
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      const scene = await this.get(sceneConfig);
      const preset = await this.getPreset(sk);

      return { scene, preset };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addPresetToScene",
      });
      return;
    }
  };

  static addPresetsToScene: CallableFunction = async (sceneConfig: Scene.Config, scenePresets: Scene.Preset[]) => {
    const sks = scenePresets.map((preset: Scene.Preset) => preset.sk).filter((sk: string) => !sceneConfig?.presets?.includes(sk));
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            // Add preset id to scene presets array
            Key: {
              pk: Scene.Config.pk,
              sk: sceneConfig.sk,
            },
            UpdateExpression: "SET #presets = list_append(if_not_exists(#presets, :empty_list), :presetIds)",
            ExpressionAttributeNames: {
              "#presets": "presets",
            },
            ExpressionAttributeValues: {
              ":presetIds": sks,
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    // loop through the array of scene presets passed in and add each to the transaction
    scenePresets.forEach((preset: Scene.Preset) => {
      params.TransactItems.push({
        Put: {
          // Create a scene preset
          Item: {
            ...preset,
            ts: Date.now(),
          },
          TableName: vlmMainTable,
        },
      });
    });

    try {
      await docClient.transactWrite(params).promise();
      const scene = await this.get(sceneConfig),
        presets: Scene.Preset[] = [];

      for (let i = 0; i < sks.length; i++) {
        const preset = await this.getPreset(sks[i]);
        presets.push(preset);
      }

      return { scene, presets };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addPresetToScene",
      });
      return;
    }
  };

  static deletePreset: CallableFunction = async (sceneId: string, presetId: string) => {
    const scene = await SceneDbManager.getById(sceneId),
      sks = scene.presets.filter((sk: string) => sk !== presetId);
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            // Add preset id to scene presets array
            Key: {
              pk: Scene.Config.pk,
              sk: sceneId,
            },
            UpdateExpression: "SET #presets = :presetIds",
            ExpressionAttributeNames: {
              "#presets": "presets",
            },
            ExpressionAttributeValues: {
              ":presetIds": sks,
            },
            TableName: vlmMainTable,
          },
        },
        {
          Update: {
            // Add preset id to scene presets array
            Key: {
              pk: Scene.Preset.pk,
              sk: presetId,
            },
            UpdateExpression: "SET #ttl = :ttl, #deleted = :deleted",
            ExpressionAttributeNames: {
              "#ttl": "ttl",
              "#deleted": "deleted",
            },
            ExpressionAttributeValues: {
              ":ttl": DateTime.now().plus({ days: 90 }).toMillis(),
              ":deleted": true,
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      const scene = await this.getById(sceneId);

      return scene;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/deletePreset",
      });
      return;
    }
  };

  static addSettingsToScene: CallableFunction = async (sceneConfig: Scene.Config, sceneSettings: Scene.Setting[]) => {
    const sks = sceneSettings.map((setting: Scene.Setting) => setting.sk).filter((sk: string) => !sceneConfig?.settings?.includes(sk));
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            // Add scene to user
            Key: {
              pk: Scene.Config.pk,
              sk: sceneConfig.sk,
            },
            UpdateExpression: "SET #settings = list_append(if_not_exists(#settings, :empty_list), :settingIds)",
            ExpressionAttributeNames: {
              "#settings": "settings",
            },
            ExpressionAttributeValues: {
              ":settingIds": sks,
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    sceneSettings.forEach((setting: Scene.Setting) => {
      params.TransactItems.unshift({
        Put: {
          // Add a scene preset
          Item: {
            ...setting,
            ts: Date.now(),
          },
          TableName: vlmMainTable,
        },
      });
    });

    try {
      await docClient.transactWrite(params).promise();
      const scene = await this.get(sceneConfig),
        sceneSettings: Scene.Setting[] = [];

      for (let i = 0; i < sks.length; i++) {
        const preset = await this.getSetting(sks[i]);
        sceneSettings.push(preset);
      }
      return { scene, sceneSettings };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addSettingsToScene",
      });
      return;
    }
  };

  static addVideoToPreset: CallableFunction = async (presetId: string, sceneVideo: Scene.Video.Config) => {
    const sk = sceneVideo.sk;
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            Key: {
              pk: Scene.Preset.pk,
              sk: presetId,
            },
            UpdateExpression: "SET #videos = list_append(if_not_exists(#videos, :empty_list), :videoIds)",
            ExpressionAttributeNames: {
              "#videos": "videos",
            },
            ExpressionAttributeValues: {
              ":videoIds": [sk],
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            Item: {
              ...sceneVideo,
              ts: Date.now(),
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      const elementData = await GenericDbManager.get(sceneVideo);
      const scenePreset = await this.getPreset(presetId);

      return { scenePreset, elementData };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addVideoToPreset",
      });
      return;
    }
  };

  static addInstanceToElement: CallableFunction = async (message: VLMSceneMessage) => {
    const elementConfig = message.elementData,
      instanceConfig = message.instanceData;

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            Key: {
              pk: elementConfig.pk,
              sk: elementConfig.sk,
            },
            UpdateExpression: "SET #instances = list_append(if_not_exists(#instances, :empty_list), :instanceIds)",
            ExpressionAttributeNames: {
              "#instances": "instances",
            },
            ExpressionAttributeValues: {
              ":instanceIds": [instanceConfig.sk],
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            Item: {
              ...instanceConfig,
              ts: Date.now(),
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      const scenePreset = await this.getPreset(message.scenePreset.sk);
      const elementData = await GenericDbManager.get(elementConfig);
      const instanceData = await GenericDbManager.get(instanceConfig);

      return { scenePreset, elementData, instance: true, instanceData };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addInstanceToElement",
      });
      return;
    }
  };

  static removeInstanceFromElement: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      const dbElement = await GenericDbManager.get(message.elementData),
        instanceIds = dbElement.instances as string[],
        filteredInstanceIds = instanceIds.filter((id: string) => id !== message.instanceData.sk);

      const params: DocumentClient.TransactWriteItemsInput = {
        TransactItems: [
          {
            Update: {
              Key: {
                pk: message.elementData.pk,
                sk: message.elementData.sk,
              },
              ConditionExpression: "#instances = :instanceIds",
              UpdateExpression: "SET #instances = :newInstanceIds",
              ExpressionAttributeNames: {
                "#instances": "instances",
              },
              ExpressionAttributeValues: {
                ":instanceIds": instanceIds,
                ":newInstanceIds": filteredInstanceIds,
              },
              TableName: vlmMainTable,
            },
          },
          {
            Update: {
              Key: {
                pk: message.instanceData.pk,
                sk: message.instanceData.sk,
              },
              UpdateExpression: "SET #ttl = :ttl, #deleted = :deleted",
              ExpressionAttributeNames: {
                "#ttl": "ttl",
                "#deleted": "deleted",
              },
              ExpressionAttributeValues: {
                ":ttl": DateTime.now().plus({ days: 30 }),
                ":deleted": true,
              },
              TableName: vlmMainTable,
            },
          },
        ],
      };

      await docClient.transactWrite(params).promise();
      const elementData = await GenericDbManager.get(dbElement);

      return { elementData };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/removeInstanceFromElement",
      });
      return;
    }
  };

  static addImageToPreset: CallableFunction = async (presetId: string, sceneImage: Scene.Image.Config) => {
    const sk = sceneImage.sk;
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            Key: {
              pk: Scene.Preset.pk,
              sk: presetId,
            },
            UpdateExpression: "SET #images = list_append(if_not_exists(#images, :empty_list), :imageIds)",
            ExpressionAttributeNames: {
              "#images": "images",
            },
            ExpressionAttributeValues: {
              ":imageIds": [sk],
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            Item: {
              ...sceneImage,
              ts: Date.now(),
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      const elementData = await GenericDbManager.get(sceneImage);
      const scenePreset = await this.getPreset(presetId);

      return { scenePreset, elementData };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addImageToPreset",
      });
      return;
    }
  };

  static addNftToPreset: CallableFunction = async (presetId: string, sceneNft: Scene.NFT.Config) => {
    const sk = sceneNft.sk;
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            Key: {
              pk: Scene.Preset.pk,
              sk: presetId,
            },
            UpdateExpression: "SET #nfts = list_append(if_not_exists(#nfts, :empty_list), :nftIds)",
            ExpressionAttributeNames: {
              "#nfts": "nfts",
            },
            ExpressionAttributeValues: {
              ":nftIds": [sk],
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            Item: {
              ...sceneNft,
              ts: Date.now(),
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      const elementData = await GenericDbManager.get(sceneNft);
      const scenePreset = await this.getPreset(presetId);

      return { scenePreset, elementData };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addNftToPreset",
      });
      return;
    }
  };

  static addSoundToPreset: CallableFunction = async (presetId: string, sceneSound: Scene.Sound.Config) => {
    const sk = sceneSound.sk;
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            Key: {
              pk: Scene.Preset.pk,
              sk: presetId,
            },
            UpdateExpression: "SET #sounds = list_append(if_not_exists(#sounds, :empty_list), :soundIds)",
            ExpressionAttributeNames: {
              "#sounds": "sounds",
            },
            ExpressionAttributeValues: {
              ":soundIds": [sk],
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            // Create a scene sound
            Item: {
              ...sceneSound,
              ts: Date.now(),
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      const elementData = await GenericDbManager.get(sceneSound);
      const scenePreset = await this.getPreset(presetId);

      return { scenePreset, elementData };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addSoundToPreset",
      });
      return;
    }
  };

  static addWidgetToPreset: CallableFunction = async (presetId: string, sceneWidget: Scene.Widget.Config) => {
    const sk = sceneWidget.sk;
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            Key: {
              pk: Scene.Preset.pk,
              sk: presetId,
            },
            UpdateExpression: "SET #widgets = list_append(if_not_exists(#widgets, :empty_list), :widgetIds)",
            ExpressionAttributeNames: {
              "#widgets": "widgets",
            },
            ExpressionAttributeValues: {
              ":widgetIds": [sk],
              ":empty_list": [],
            },
            TableName: vlmMainTable,
          },
        },
        {
          Put: {
            // Create a scene preset
            Item: {
              ...sceneWidget,
              ts: Date.now(),
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      const elementData = await GenericDbManager.get(sceneWidget);
      const scenePreset = await this.getPreset(presetId);

      return { scenePreset, elementData };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/addWidgetToPreset",
      });
      return;
    }
  };

  static updateSceneProperty: CallableFunction = async (sceneConfig: Scene.Config, property: string, newValue: unknown) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: Scene.Config.pk, sk: sceneConfig.sk },
      UpdateExpression: "set #prop = :prop, #ts = :ts",
      ConditionExpression: "#ts <= :sceneTs",
      ExpressionAttributeNames: { "#prop": property, "#ts": "ts" },
      ExpressionAttributeValues: {
        ":prop": newValue,
        ":sceneTs": sceneConfig.ts || Date.now(),
        ":ts": Date.now(),
      },
    };

    try {
      await daxClient.update(params).promise();
      return await this.getById(sceneConfig.sk);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/updateSceneProperty",
        sceneConfig,
        property,
        newValue,
      });
      return await this.get(sceneConfig);
    }
  };

  static updateSceneElementProperty: CallableFunction = async (message: VLMSceneMessage) => {
    let { elementData, property, scenePreset } = message;

    let valueProp;
    Object.keys(elementData).forEach((key: string) => {
      if (key == property && elementData.hasOwnProperty(property)) {
        valueProp = key;
      }
    });

    if (!valueProp) {
      return;
    }

    const params: DocumentClient.UpdateItemInput = {
      TableName: vlmMainTable,
      Key: { pk: elementData.pk, sk: elementData.sk },
      UpdateExpression: "set #prop = :prop, #ts = :ts",
      ConditionExpression: "#ts <= :elementTs",
      ExpressionAttributeNames: { "#prop": property, "#ts": "ts" },
      ExpressionAttributeValues: {
        ":prop": elementData[valueProp],
        ":elementTs": elementData.ts,
        ":ts": Date.now(),
      },
    };

    try {
      await daxClient.update(params).promise();
      elementData = await GenericDbManager.get(elementData);
      scenePreset = await this.getPreset(message.scenePreset.sk);
      return { scenePreset, elementData };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/updateElementProperty",
        message,
      });
      return;
    }
  };

  static removeSceneElement: CallableFunction = async (message: VLMSceneMessage) => {
    const { elementData, scenePreset } = message;
    const dbPreset = await this.getPreset(scenePreset.sk);

    const videos = dbPreset.videos.filter((id: string) => id !== elementData.sk),
      images = dbPreset.images.filter((id: string) => id !== elementData.sk),
      nfts = dbPreset.nfts.filter((id: string) => id !== elementData.sk),
      sounds = dbPreset.sounds.filter((id: string) => id !== elementData.sk),
      widgets = dbPreset.widgets.filter((id: string) => id !== elementData.sk);

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Update: {
            Key: {
              pk: dbPreset.pk,
              sk: dbPreset.sk,
            },
            UpdateExpression: "SET #videos = :videos, #images = :images, #nfts = :nfts, #sounds = :sounds, #widgets = :widgets",
            ExpressionAttributeNames: {
              "#videos": "videos",
              "#images": "images",
              "#nfts": "nfts",
              "#sounds": "sounds",
              "#widgets": "widgets",
            },
            ExpressionAttributeValues: {
              ":videos": videos,
              ":images": images,
              ":nfts": nfts,
              ":sounds": sounds,
              ":widgets": widgets,
            },
            TableName: vlmMainTable,
          },
        },
        {
          Update: {
            Key: {
              pk: elementData.pk,
              sk: elementData.sk,
            },
            UpdateExpression: "SET #ttl = :ttl, #deleted = :deleted",
            ExpressionAttributeNames: {
              "#ttl": "ttl",
              "#deleted": "deleted",
            },
            ExpressionAttributeValues: {
              ":ttl": DateTime.now().plus({ days: 30 }),
              ":deleted": true,
            },
            TableName: vlmMainTable,
          },
        },
      ],
    };

    try {
      await docClient.transactWrite(params).promise();
      const scenePreset = await GenericDbManager.get(dbPreset);
      return { scenePreset };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/removeSceneElement",
      });
      return;
    }
  };

  static updatePreset: CallableFunction = async (scene: Scene.Config, preset: Scene.Preset) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...preset,
        ts: Date.now(),
      },
    };

    try {
      await daxClient.put(params).promise();
      const scenePreset = await SceneDbManager.getPreset(preset.sk);
      return { scenePreset };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/put",
        scene,
      });
      return;
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
      await daxClient.put(params).promise();
      return await SceneDbManager.getById(scene.sk);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/put",
        scene,
      });
      return;
    }
  };

  static updateInstance: CallableFunction = async (message: VLMSceneMessage) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...message.instanceData,
        ts: Date.now(),
      },
    };

    try {
      await daxClient.put(params).promise();
      const instanceData = await GenericDbManager.get(message.instanceData);
      const scenePreset = await this.getPreset(message.scenePreset.sk);

      return {
        instanceData,
        scenePreset,
      };
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Scene.data/updateInstance",
        message,
      });
      return;
    }
  };
}
