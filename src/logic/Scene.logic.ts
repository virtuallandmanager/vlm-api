import { User } from "../models/User.model";
import { GenericDbManager } from "../dal/Generic.data";
import { Scene } from "../models/Scene.model";
import { SceneDbManager } from "../dal/Scene.data";
import { AdminLogManager } from "./ErrorLogging.logic";
import { SceneSettingsManager } from "./SceneSettings.logic";
import { ScenePresetManager } from "./ScenePreset.logic";

export abstract class SceneManager {
  // Base Scene Operations //
  static loadScene: CallableFunction = async (sceneId: string) => {
    try {
      let scene = await SceneDbManager.getById(sceneId);
      if (scene) {
        scene = await this.buildScene(scene);
      } else {
        scene = await this.createScene(new Scene.Config({ sk: sceneId }));
        scene = await this.buildScene(scene);
      }

      return scene;
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.loadScene" });
    }
  };

  static obtainScene: CallableFunction = async (sceneConfig?: Scene.Config) => {
    try {
      let scene = await SceneDbManager.get(sceneConfig);
      if (!scene) {
        scene = await SceneDbManager.put(new Scene.Config(sceneConfig));
        scene = await SceneDbManager.addPresetToScene(scene, new Scene.Preset({ name: "Signature Arrangement" }));
      }
      return scene;
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.createScene" });
    }
  };

  static createScene: CallableFunction = async (scene?: Scene.Config) => {
    try {
      return await SceneDbManager.put(scene);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.createScene" });
    }
  };

  static getScene: CallableFunction = async (scene: Scene.Config) => {
    try {
      return await SceneDbManager.get(scene);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.getScene" });
    }
  };

  static getSceneById: CallableFunction = async (scene: Scene.Config) => {
    try {
      return await SceneDbManager.getById(scene);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.getSceneById" });
    }
  };

  static getScenesForUser: CallableFunction = async (vlmUser: User.Account) => {
    try {
      const sceneIds = await SceneDbManager.getIdsForUser(vlmUser);
      return await SceneDbManager.getByIds(sceneIds);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.getScenesForUser" });
    }
  };

  static getIdsForUser: CallableFunction = async (vlmUser: User.Account) => {
    try {
      return await SceneDbManager.getIdsForUser(vlmUser.sk);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.getIdsForUser" });
    }
  };

  static updateSceneProperty: CallableFunction = async ({ scene, prop, val }: { scene: Scene.Config; prop: string; val?: unknown }) => {
    try {
      return await SceneDbManager.updateSceneProperty(scene, prop, val);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.updateSceneProperty" });
      return;
    }
  };

  static changeScenePreset: CallableFunction = async (sceneConfig: Scene.Config, scenePreset: Scene.Preset) => {
    try {
      const sceneStub = await this.updateSceneProperty({ scene: sceneConfig, prop: "scenePreset", val: scenePreset.sk }),
        scene = await this.buildScene(sceneStub);

      return scene;
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.changeScenePreset" });
    }
  };
  ////

  static buildScene: CallableFunction = async (sceneConfig?: Scene.Config, locale?: string) => {
    try {
      let presetsLoaded = false;

      let scene = new Scene.Config(sceneConfig);

      if (!sceneConfig) {
        await SceneManager.createScene(scene);
      }

      // create the first preset if one doesn't exist in this scene
      if (!scene.presets || !scene.presets.length) {
        scene = await ScenePresetManager.createInitialPreset(scene);
        presetsLoaded = true;
      }

      if (!presetsLoaded) {
        await SceneManager.fillInPresetIds(scene);
      }
      await SceneManager.fillInSettingIds(scene);

      return scene;
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.buildScene" });
      return;
    }
  };

  static fillInPresetIds: CallableFunction = async (scene: Scene.Config) => {
    const presetArr: string[] = (scene.presets as string[]) || [],
      presetIds: string[] = [];

    // start looping through the preset array, convert preset ids to preset records
    for (let i = 0; i < presetArr.length; i++) {
      if (typeof presetArr[i] !== "string") {
        continue;
      }

      const sk: string = presetArr[i];
      presetIds.push(sk);
      let scenePreset = await ScenePresetManager.getScenePresetById(sk);

      if (!scenePreset) {
        scenePreset = await ScenePresetManager.createScenePreset(new Scene.Preset({ name: `Signature Arrangement`, sk }));
      }

      if (!scene.scenePreset && i == 0) {
        const newPreset = await ScenePresetManager.buildScenePreset(scenePreset);
        const changeResult = await SceneManager.changeScenePreset(scene, newPreset.sk);
        scene = changeResult;
        scene.presets[i] = newPreset;
      } else {
        scene.presets[i] = await ScenePresetManager.buildScenePreset(scenePreset);
      }
    }
    // loop ends
  };

  static fillInSettingIds: CallableFunction = async (scene: Scene.Config) => {
    const settingArr: string[] = (scene.settings as string[]) || [],
      settingIds: string[] = [],
      missingSettingIds: string[] = [];

    for (let i = 0; i < settingArr.length; i++) {
      const sk: string = scene.settings[i] as string,
        sceneSetting = await SceneSettingsManager.getSceneSettingById(sk);
      if (sceneSetting && sceneSetting.settingName) {
        settingIds.push(sk);
      } else {
        missingSettingIds.push(sk);
      }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////
    // i forget why i thought this would ever be necessary... keep it and log exceptions I guess?
    if (missingSettingIds.length) {
      AdminLogManager.logWarning("Had to fill in missing scene settings", { scene });
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////

    // add the default scene settings if there are no settings for this scene
    if (!settingArr?.length || missingSettingIds.length) {
      const defaultSettings = new Scene.DefaultSettings(scene);
      await SceneManager.updateSceneProperty({ scene, prop: "settings", val: [] });
      await SceneSettingsManager.addSettingsToScene(scene, defaultSettings.settings);

      scene.settings = defaultSettings.settings;
    }
  };
  //

  // Legacy Scene Operations //
  static getLegacyScene: CallableFunction = async (baseParcel: string) => {
    try {
      return await SceneDbManager.getLegacy(baseParcel);
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.getLegacyScene" });
      return;
    }
  };

  static getLegacyScenes: CallableFunction = async () => {
    try {
      return await SceneDbManager.getAllLegacy();
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.getLegacyScenes" });
      return;
    }
  };
  ////

  // Scene User State Operations //
  static getUserStateByScene: CallableFunction = async (sceneId: string, key: string) => {
    try {
      if (key == "pk" || "sk") {
        return false
      }
      const userState = await SceneDbManager.getSceneUserState(sceneId);
      return userState[key];
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.getSceneElementById" });
      return;
    }
  };

  static setUserStateByScene: CallableFunction = async (sceneId: string, key: string, value: unknown) => {
    try {
      if (key == "pk" || "sk") {
        return false
      }
      const userState = await SceneDbManager.getSceneUserState(sceneId);
      return await SceneDbManager.setSceneUserState(userState, key, value)
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.getSceneElementById" });
      return;
    }
  };
  ////

  // Generic Scene Element Operations //
  static getSceneElementById: CallableFunction = async (pk: string, sk: string) => {
    try {
      return await GenericDbManager.get({ pk, sk });
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.getSceneElementById" });
      return;
    }
  };
  ////

  // Many-to-Many Link Creation Shortcuts //
  static createUserLink: CallableFunction = async (sceneLink: User.SceneLink) => {
    try {
      return (await GenericDbManager.put(sceneLink)) as User.SceneLink;
    } catch (error) {
      AdminLogManager.logError(error, { from: "SceneManager.createUserLink" });
      return;
    }
  };
  //
}
