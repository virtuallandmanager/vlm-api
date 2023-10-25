import { GenericDbManager } from "../dal/Generic.data";
import { Scene } from "../models/Scene.model";
import { SceneDbManager } from "../dal/Scene.data";
import { AdminLogManager } from "./ErrorLogging.logic";
import { SceneElementManager } from "./SceneElement.logic";
import { SceneManager } from "./Scene.logic";

export abstract class ScenePresetManager {
  // Scene Preset Operations //
  static createScenePreset: CallableFunction = async (config: Scene.Preset) => {
    try {
      const scenePreset = new Scene.Preset(config);
      return (await GenericDbManager.put(scenePreset)) as Scene.Setting;
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.createScenePreset" });
      return;
    }
  };

  static createInitialPreset: CallableFunction = async (scene: Scene.Config, sk?: string) => {
    const firstPreset = new Scene.Preset({ name: "Signature Arrangement", sk: sk || null });
    scene.scenePreset = firstPreset.sk;
    await SceneManager.updateSceneProperty({ scene, prop: "scenePreset", value: firstPreset.sk });
    const addPresetsResponse = await this.addPresetsToScene(scene, [firstPreset]);
    scene = addPresetsResponse.scene;
    scene.presets = addPresetsResponse.presets;
    return scene;
  };

  static getScenePreset: CallableFunction = async (scenePreset: Scene.Preset) => {
    try {
      return await GenericDbManager.get(scenePreset);
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.getScenePreset" });
      return;
    }
  };

  static getPresetFragment: CallableFunction = async (sk: string) => {
    try {
      return await GenericDbManager.getFragment({ pk: Scene.Preset.pk, sk }, ["sk", "name", "createdAt"]);
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.getScenePresetFragments" });
      return;
    }
  };

  static clonePreset: CallableFunction = async (scene: Scene.Config, presetConfig: Scene.Preset) => {
    try {
      const newPreset = new Scene.Preset(presetConfig, true);

      return await SceneDbManager.addPresetToScene(scene, newPreset);
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.clonePresetsToScene" });
      return;
    }
  };

  static addPresetToScene: CallableFunction = async (scene: Scene.Config) => {
    try {
      const preset = new Scene.Preset();
      return await SceneDbManager.addPresetToScene(scene, preset);
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.addPresetToScene" });
      return;
    }
  };

  static addPresetsToScene: CallableFunction = async (scene: Scene.Config, scenePresets: Scene.Preset | Scene.Preset[]) => {
    try {
      return await SceneDbManager.addPresetsToScene(scene, scenePresets);
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.addPresetsToScene" });
      return;
    }
  };

  static updateScenePreset: CallableFunction = async (scene: Scene.Config, preset: Scene.Preset) => {
    try {
      return await SceneDbManager.updatePreset(scene, preset);
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.updateScenePreset" });
    }
  };

  static deleteScenePreset: CallableFunction = async (sceneId: string, presetId: string) => {
    try {
      const scene = await SceneDbManager.deletePreset(sceneId, presetId);

      return { scene };
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.deleteScenePreset" });
    }
  };

  static getScenePresetById: CallableFunction = async (sk: string) => {
    try {
      return await GenericDbManager.get({ pk: Scene.Preset.pk, sk });
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.getScenePresetById" });
      return;
    }
  };

  static buildScenePreset: CallableFunction = async (preset: Scene.Preset) => {
    if (!preset) {
      AdminLogManager.logError("Tried to build an undefined preset!", { from: "SceneManager.buildScenePreset" });
      return;
    }
    try {
      const [videos, images, nfts, models, sounds, widgets, claimPoints] = await Promise.all([
        SceneElementManager.buildElements(Scene.Video.Config.pk, preset.videos),
        SceneElementManager.buildElements(Scene.Image.Config.pk, preset.images),
        SceneElementManager.buildElements(Scene.NFT.Config.pk, preset.nfts),
        SceneElementManager.buildElements(Scene.Model.Config.pk, preset.models),
        SceneElementManager.buildElements(Scene.Sound.Config.pk, preset.sounds),
        SceneElementManager.buildElements(Scene.Widget.Config.pk, preset.widgets),
        SceneElementManager.buildElements(Scene.Giveaway.ClaimPoint.pk, preset.claimPoints),
      ]);
      return new Scene.Preset({ ...preset, videos, images, nfts, models, sounds, widgets, claimPoints });
    } catch (error) {
      AdminLogManager.logError(error, { from: "ScenePresetManager.buildScenePreset" });
      return;
    }
  };
  ////
}
