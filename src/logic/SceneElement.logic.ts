import { Scene } from "../models/Scene.model";
import { SceneDbManager } from "../dal/Scene.data";
import { AdminLogManager } from "./ErrorLogging.logic";
import { VLMSceneMessage } from "../ws/rooms/events/VLMScene.events";
import { SceneManager } from "./Scene.logic";
import { Network, Alchemy } from "alchemy-sdk";
import { GenericDbManager } from "../dal/Generic.data";

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
  network: Network.ETH_MAINNET, // Replace with your network.
});

const alchemyPoly = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
  network: Network.MATIC_MAINNET, // Replace with your network.
});

export abstract class SceneElementManager {
  static buildElements: CallableFunction = async (pk: string, sks: string[]) => {
    try {
      const sceneElements = [];
      if (sks && sks.length) {
        for (let i = 0; i < sks.length; i++) {
          let sceneElement = await SceneManager.getSceneElementById(pk, sks[i]);

          if (pk == "vlm.scene.nft" && sceneElement.contractAddress && sceneElement.tokenId > -1) {
            await alchemy.nft.getNftMetadata(sceneElement.contractAddress, sceneElement.tokenId);
          }
          if (sceneElement.instances && sceneElement.instances.length) {
            if (typeof sceneElement.instances[0] == "string") {
              sceneElement.instances = await this.buildElementInstances(pk + ":instance", sceneElement.instances);
            } else if (sceneElement.instances[0].sk) {
              sceneElement = await GenericDbManager.put({ ...sceneElement, instances: sceneElement.instances.map((instance: Scene.Element) => instance.sk) }, true);
              sceneElement.instances = await this.buildElementInstances(pk + ":instance", sceneElement.instances);
            }
          }
          sceneElements.push(sceneElement);
        }
        return sceneElements;
      } else {
        return [];
      }
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.buildElements" });
      return;
    }
  };

  static buildElementInstances: CallableFunction = async (pk: string, sks: string[], options?: { skToId: boolean }) => {
    try {
      const sceneInstances = [];
      if (sks && sks.length) {
        for (let i = 0; i < sks.length; i++) {
          const sceneInstance = await SceneManager.getSceneElementById(pk, sks[i]);
          if (options?.skToId) {
            sceneInstance.id = sceneInstance.sk;
          }
          sceneInstances.push(sceneInstance);
        }
        return sceneInstances;
      } else {
        return [];
      }
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.buildElements" });
      return;
    }
  };

  static createSceneElement: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      switch (message.element) {
        case "video":
          return await this.addVideoToPreset(message);
        case "image":
          return await this.addImageToPreset(message);
        case "nft":
          return await this.addNftToPreset(message);
        case "sound":
          return await this.addSoundToPreset(message);
        case "widget":
          return await this.addWidgetToPreset(message);
      }
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.createSceneElement" });
      return;
    }
  };

  static createSceneElementInstance: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      switch (message.element) {
        case "video":
          return await this.addInstanceToElement(message);
        case "image":
          return await this.addImageToPreset(message);
        case "nft":
          return await this.addNftToPreset(message);
        case "sound":
          return await this.addSoundToPreset(message);
        case "widget":
          return await this.addWidgetToPreset(message);
      }
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.createSceneElementInstance" });
      return;
    }
  };

  // ADD ELEMENTS //
  static addVideoToPreset: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      const video = new Scene.Video.Config(message.elementData);
      return await SceneDbManager.addVideoToPreset(message.scenePreset.sk, video);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.addVideoToPreset" });
      return;
    }
  };

  static addImageToPreset: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      const image = new Scene.Image.Config(message.elementData);
      return await SceneDbManager.addImageToPreset(message.scenePreset.sk, image);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.addVideoToPreset" });
      return;
    }
  };

  static addNftToPreset: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      const nft = new Scene.NFT.Config(message.elementData);
      return await SceneDbManager.addNftToPreset(message.scenePreset.sk, nft);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.addVideoToPreset" });
      return;
    }
  };

  static addSoundToPreset: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      const sound = new Scene.Sound.Config(message.elementData);
      return await SceneDbManager.addSoundToPreset(message.scenePreset.sk, sound);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.addSoundToPreset" });
      return;
    }
  };

  static addWidgetToPreset: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      const widget = new Scene.Widget.Config(message.elementData);
      return await SceneDbManager.addWidgetToPreset(message.scenePreset.sk, widget);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.addWidgetToPreset" });
      return;
    }
  };
  //

  static updateSceneElement: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      if (message.property) {
        return await SceneDbManager.updateSceneElementProperty(message);
      } else {
        message.elementData.pk = message.elementData.pk || `vlm:scene:${message.element}`;
        const elementData = await GenericDbManager.put(message.elementData);
        const scenePreset = await SceneDbManager.getPreset(message.scenePreset.sk);
        return { scenePreset, elementData };
      }
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.updateElement" });
      return;
    }
  };

  static removeSceneElement: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      return await SceneDbManager.removeSceneElement(message);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.deleteSceneElement" });
      return;
    }
  };

  static addInstanceToElement: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      switch (message.element) {
        case "video":
          message.instanceData.pk = Scene.Video.Instance.pk;
          break;
        case "image":
          message.instanceData.pk = Scene.Image.Instance.pk;
          break;
        case "nft":
          message.instanceData.pk = Scene.NFT.Instance.pk;
          break;
        case "sound":
          message.instanceData.pk = Scene.Sound.Instance.pk;
          break;
      }

      return await SceneDbManager.addInstanceToElement(message);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.addInstanceToElement" });
      return;
    }
  };

  static updateInstance: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      return await SceneDbManager.updateInstance(message);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.updateInstance" });
      return;
    }
  };

  static removeInstanceFromElement: CallableFunction = async (message: VLMSceneMessage) => {
    try {
      return await SceneDbManager.removeInstanceFromElement(message);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneElementManager.removeInstanceFromElement" });
      return;
    }
  };
}
