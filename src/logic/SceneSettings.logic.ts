import { GenericDbManager } from "../dal/Generic.data";
import { Scene } from "../models/Scene.model";
import { SceneDbManager } from "../dal/Scene.data";
import { AdminLogManager } from "./ErrorLogging.logic";

export abstract class SceneSettingsManager {

  static addSettingsToScene: CallableFunction = async (scene: Scene.Config, sceneSettings: Scene.Setting[]) => {
    try {
      return await SceneDbManager.addSettingsToScene(scene, sceneSettings);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneSettingsManager.addSettingsToScene" });
      return;
    }
  };

  static createSceneSetting: CallableFunction = async (config: Scene.Setting) => {
    try {
      const sceneSetting = new Scene.Setting(config);
      return (await GenericDbManager.put(sceneSetting)) as Scene.Setting;
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneSettingsManager.createSceneSetting" });
      return;
    }
  };

  static getSceneSettingById: CallableFunction = async (sk: string) => {
    try {
      return (await GenericDbManager.get({ pk: Scene.Setting.pk, sk })) as Scene.Setting;
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneSettingsManager.getSceneSettingById" });
      return;
    }
  };
}
