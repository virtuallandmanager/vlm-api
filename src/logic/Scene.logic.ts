import { User } from "../models/User.model";
import { GenericDbManager } from "../dal/Generic.data";
import { Scene } from "../models/Scene.model";
import { SceneDbManager } from "../dal/Scene.data";
import { Decentraland } from "../models/worlds/Decentraland.model";

export abstract class SceneManager {
  static initDCLScene: CallableFunction = async (scene: Decentraland.Scene.Config, preset?: Decentraland.Scene.Preset) => {
    const newScene = new Decentraland.Scene.Config(scene),
      newScenePreset = new Decentraland.Scene.Preset(preset);

    await SceneDbManager.initScene(newScene, newScenePreset);
    return newScene;
  };

  static createScene: CallableFunction = async (scene?: Scene.Config) => {
    return await SceneDbManager.put(scene);
  };

  static addScene: CallableFunction = async (scene: Scene.Config) => {
    return await SceneDbManager.put(scene);
  };

  static getScene: CallableFunction = async (scene: Scene.Config) => {
    return await SceneDbManager.get(scene);
  };

  static getLegacyScene: CallableFunction = async (baseParcel: string) => {
    return await SceneDbManager.getLegacy(baseParcel);
  };

  static getLegacyScenes: CallableFunction = async () => {
    return await SceneDbManager.getAllLegacy();
  };

  static getScenesForUser: CallableFunction = async (vlmUser: User.Account) => {
    return await SceneDbManager.getByUser(vlmUser);
  };

  static getIdsForUser: CallableFunction = async (vlmUser: User.Account) => {
    return await SceneDbManager.getIdsForUser(vlmUser.sk);
  };

  static getScenePreset: CallableFunction = async (scenePreset: Scene.Preset) => {
    return await GenericDbManager.get(scenePreset);
  };

  static createScenePreset: CallableFunction = async (scene: Scene.Config, scenePreset: Scene.Preset) => {
    return await SceneDbManager.createScenePreset(scene, scenePreset);
  };

  static createSceneSetting: CallableFunction = async (config: Scene.Setting) => {
    const sceneData = new Scene.Setting(config);
    return await GenericDbManager.put(sceneData);
  };
}
