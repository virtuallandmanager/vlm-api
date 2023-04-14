import { SceneVideoDbManager } from "../dal/SceneVideo.data";
import {
  SceneVideo,
  SceneVideoConfig,
  SceneVideoInstance,
  SceneVideoInstanceConfig,
} from "../models/SceneVideo.model";

export abstract class SceneVideoManager {
  static getSceneVideo: CallableFunction = async (config: SceneVideoConfig) => {
    const sceneVideo = new SceneVideo(config);
    return await SceneVideoDbManager.get(sceneVideo);
  };
  static createSceneVideo: CallableFunction = async (
    config: SceneVideoConfig
  ) => {
    const sceneVideo = new SceneVideo(config);
    await SceneVideoDbManager.put(sceneVideo);
    return sceneVideo;
  };
  static getSceneVideoInstance: CallableFunction = async (
    config: SceneVideoInstanceConfig
  ) => {
    const sceneVideo = new SceneVideoInstance(config);
    return await SceneVideoDbManager.get(sceneVideo);
  };
  static createSceneVideoInstance: CallableFunction = async (
    config: SceneVideoInstanceConfig
  ) => {
    const sceneVideo = new SceneVideoInstance(config);
    await SceneVideoDbManager.put(sceneVideo);
    return sceneVideo;
  };
}
