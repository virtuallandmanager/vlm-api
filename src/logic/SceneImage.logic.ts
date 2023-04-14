import { SceneImageDbManager } from "../dal/SceneImage.data";
import {
  SceneImage,
  SceneImageConfig,
  SceneImageInstance,
  SceneImageInstanceConfig,
} from "../models/SceneImage.model";

export abstract class SceneImageManager {
  static getSceneImage: CallableFunction = async (config: SceneImageConfig) => {
    const scene = new SceneImage(config);
    return await SceneImageDbManager.get(scene);
  };
  static createSceneImage: CallableFunction = async (
    config: SceneImageConfig
  ) => {
    const sceneImage = new SceneImage(config);
    await SceneImageDbManager.put(sceneImage);
    return sceneImage;
  };
  static getSceneImageInstance: CallableFunction = async (
    config: SceneImageInstanceConfig
  ) => {
    const sceneImage = new SceneImageInstance(config);
    return await SceneImageDbManager.get(sceneImage);
  };
  static createSceneImageInstance: CallableFunction = async (
    config: SceneImageInstanceConfig
  ) => {
    const sceneImageInstance = new SceneImageInstance(config);
    await SceneImageDbManager.put(sceneImageInstance);
    return sceneImageInstance;
  };
}
