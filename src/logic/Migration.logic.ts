import { LegacyCustomizationConfig, LegacyEventConfig, LegacyImageConfig, LegacyImageInstanceConfig, LegacySceneConfig, LegacyVideoInstanceConfig, LegacyVideoScreenConfig } from "../models/Legacy.model";
import { SceneWidgetManager } from "./SceneWidget.logic";
import { SceneImageManager } from "./SceneImage.logic";
import { SceneVideoManager } from "./SceneVideo.logic";
import { Scene } from "../models/Scene.model";
import { SceneManager } from "./Scene.logic";
import { EventManager } from "./Event.logic";
import { GiveawayManager } from "./Giveaway.logic";
import { Event } from "../models/Event.model";
import { Decentraland } from "../models/worlds/Decentraland.model";

export abstract class MigrationManager {
  static migrateLegacyScene: CallableFunction = async (legacyScene: LegacySceneConfig) => {
    const { baseParcel, propertyName } = legacyScene,
      scene = new Decentraland.Scene.Config({
        baseParcel,
        displayName: propertyName,
        parcels: [baseParcel],
      });

    const scenePresetConfig = new Decentraland.Scene.Preset();
    scenePresetConfig.videoIds = await this.migrateSceneVideos(legacyScene.sceneData?.videoScreens);
    scenePresetConfig.imageIds = await this.migrateSceneImages(legacyScene.sceneData?.images);
    scenePresetConfig.widgetIds = await this.migrateSceneWidgets(legacyScene.sceneData?.customizations);

    const events = await this.migrateSceneEvents(legacyScene?.events);

    await SceneManager.createScenePreset(scenePresetConfig);
    await SceneManager.createSceneSetting(legacyScene.sceneData?.moderation);

    const newScene = await SceneManager.addScene(scene);
    await this.migrateSceneEvents(newScene, events);

    return newScene;
  };

  static migrateSceneVideos: CallableFunction = async (videos: LegacyVideoScreenConfig[]) => {
    if (!videos) {
      return [];
    }
    const ids: string[] = [];
    await videos.forEach(async (videoScreen: LegacyVideoScreenConfig) => {
      let instanceIds: string[] = [];
      if (videoScreen.instances?.length) {
        instanceIds = await this.migrateSceneVideoInstances(videoScreen.instances);
      }
      const newVideo = await SceneVideoManager.createSceneVideo({
        ...videoScreen,
        instanceIds,
      });
      ids.push(newVideo.sk);
    });
    return ids;
  };

  static migrateSceneVideoInstances: CallableFunction = async (instances: LegacyVideoInstanceConfig[]) => {
    if (!instances) {
      return [];
    }
    const ids: string[] = [];
    await instances.forEach(async (videoInstance: LegacyVideoInstanceConfig) => {
      const instanceRecord = await SceneVideoManager.createSceneVideoInstance(videoInstance);
      ids.push(instanceRecord.sk);
    });
    return ids;
  };

  static migrateSceneImages: CallableFunction = async (images: LegacyImageConfig[]) => {
    if (!images) {
      return [];
    }
    const ids: string[] = [];
    await images.forEach(async (image: LegacyImageConfig) => {
      let instanceIds: string[] = [];
      if (image.instances?.length) {
        instanceIds = await this.migrateSceneVideoInstances(image.instances);
      }
      const newImage = await SceneImageManager.createSceneImage({
        ...image,
        instanceIds,
      });
      ids.push(newImage.sk);
    });
    return ids;
  };

  static migrateSceneImageInstances: CallableFunction = async (instances: LegacyImageInstanceConfig[]) => {
    if (!instances) {
      return [];
    }
    const ids: string[] = [];
    await instances.forEach(async (imageInstance: LegacyImageInstanceConfig) => {
      const instanceRecord = await SceneImageManager.createSceneImageInstance(imageInstance);
      ids.push(instanceRecord.sk);
    });
    return ids;
  };

  static migrateSceneWidgets: CallableFunction = async (config: LegacyCustomizationConfig[]) => {
    if (!config?.length) {
      return [];
    }
    const ids: string[] = [];
    await config.forEach(async (customization: LegacyCustomizationConfig) => {
      const newWidget = await SceneWidgetManager.createSceneWidget(customization);
      ids.push(newWidget.sk);
    });
    return ids;
  };

  static migrateSceneEvents: CallableFunction = async (scene: Scene.Config, config: LegacyEventConfig[]) => {
    if (!config) {
      return [];
    }
    const ids: string[] = [];
    await config.forEach(async (event: LegacyEventConfig) => {
      const eventConfig = new Event.Config({
        name: event.name,
        giveaways: [],
        startTime: new Date(event.startTime).getTime(),
        endTime: new Date(event.endTime).getTime(),
      });
      event.giveawayItems.forEach(async (giveawayItem) => {
        const giveaway = await GiveawayManager.createEventGiveaway(giveawayItem);
        eventConfig.giveaways.push(giveaway.sk);
      });
      const newEvent = await EventManager.createEvent(eventConfig);
      ids.push(newEvent.sk);
    });
    return ids;
  };
}
