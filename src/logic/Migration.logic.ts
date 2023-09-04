import { LegacyCustomizationConfig, LegacyEventConfig, LegacyGiveawayClaim, LegacyImageConfig, LegacyImageInstanceConfig, LegacySceneConfig, LegacyVideoInstanceConfig, LegacyVideoScreenConfig } from "../models/Legacy.model";
import { Event } from "../models/Event.model";
import { Scene } from "../models/Scene.model";
import { SceneManager } from "./Scene.logic";
import { EventManager } from "./Event.logic";
import { GiveawayManager } from "./Giveaway.logic";
import { Decentraland } from "../models/worlds/Decentraland.model";
import { Giveaway } from "../models/Giveaway.model";
import { Accounting } from "../models/Accounting.model";
import { DateTime } from "luxon";
import { Analytics } from "../models/Analytics.model";
import { MigrationDbManager } from "../dal/Migration.data";
import { SceneElementManager } from "./SceneElement.logic";
import { SceneSettingsManager } from "./SceneSettings.logic";
import { ScenePresetManager } from "./ScenePreset.logic";

export abstract class MigrationManager {
  static migrateLegacyScene: CallableFunction = async (legacyScene: LegacySceneConfig) => {
    const { baseParcel, propertyName } = legacyScene,
      scene = new Decentraland.Scene.Config({
        baseParcel,
        name: propertyName,
        parcels: [baseParcel],
      });

    const scenePresetConfig = new Decentraland.Scene.Preset();
    scenePresetConfig.videoIds = await this.migrateSceneVideos(legacyScene.sceneData?.videoScreens);
    scenePresetConfig.imageIds = await this.migrateSceneImages(legacyScene.sceneData?.images);
    scenePresetConfig.widgetIds = await this.migrateSceneWidgets(legacyScene.sceneData?.customizations);

    const events = await this.migrateSceneEvents(legacyScene?.events);

    await ScenePresetManager.createScenePreset(scenePresetConfig);
    await SceneSettingsManager.createSceneSetting(legacyScene.sceneData?.moderation);

    const newScene = await SceneManager.createScene(scene);
    await this.migrateSceneEvents(newScene, events);

    return newScene;
  };

  static migrateSceneVideos: CallableFunction = async (videos: LegacyVideoScreenConfig[]) => {
    if (!videos) {
      return [];
    }
    const ids: string[] = [];
    await videos.forEach(async (videoScreen: LegacyVideoScreenConfig) => {
      let instances: string[] = [];
      if (videoScreen.instances?.length) {
        instances = await this.migrateSceneVideoInstances(videoScreen.instances);
      }
      const newVideo = await SceneElementManager.createSceneElement({
        element: "video",
        elementData: new Scene.Video.Config({
          ...videoScreen,
          instances,
        }),
      });
      ids.push(newVideo.sk);
    });
    return ids;
  };

  static migrateSceneVideoInstances: CallableFunction = async (elementData: Scene.Video.Config, instances: LegacyVideoInstanceConfig[]) => {
    if (!instances) {
      return [];
    }
    const ids: string[] = [];
    await instances.forEach(async (videoInstance: LegacyVideoInstanceConfig) => {
      const instanceRecord = await SceneElementManager.createSceneElementInstance({ element: "video", instance: true, elementData, instanceData: new Scene.Video.Instance(videoInstance) });
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
      let instances: string[] = [];
      if (image.instances?.length) {
        instances = await this.migrateSceneImageInstances(image.instances);
      }
      const newImage = await SceneElementManager.createSceneElement(
        new Scene.Image.Config({
          ...image,
          instances,
        })
      );
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
      const instanceRecord = await SceneElementManager.createSceneElement(new Scene.Image.Instance(imageInstance));
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
      customization.type += 1;
      const newWidget = await SceneElementManager.createSceneElement(new Scene.Widget.Config(customization));
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
        eventStart: new Date(event.startTime).getTime(),
        eventEnd: new Date(event.endTime).getTime(),
      });
      event.giveawayItems.forEach(async (giveawayItem) => {
        await GiveawayManager.create(giveawayItem);
      });
      const newEvent = await EventManager.create(eventConfig);
      ids.push(newEvent.sk);
    });
    return ids;
  };

  static migrateGiveawayItems: CallableFunction = async (config: LegacyEventConfig[]) => {
    if (!config) {
      return [];
    }
    const ids: string[] = [];
    await config.forEach(async (event: LegacyEventConfig) => {
      event.giveawayItems.forEach(async (item) => {
        const giveawayItem = new Giveaway.Item({
          contractAddress: item.contractAddress,
          itemId: item.tokenId,
          imageSrc: `https://peer.decentraland.org/lambdas/collections/contents/urn:decentraland:matic:collections-v2:${item.contractAddress}:${item.tokenId}/thumbnail`,
        });
        await GiveawayManager.createItem(giveawayItem);
      });
    });
    return ids;
  };

  static migrateEventClaims: CallableFunction = async (config: LegacyGiveawayClaim[]) => {
    if (!config) {
      return [];
    }
    const ids: string[] = [];
    await config.forEach(async (claim: LegacyGiveawayClaim) => {
      let giveawayId, eventId, transactionId, claimTs: number;
      switch (claim.baseParcel) {
        case "-54,34":
          if (claim.eventId == "547b57a0-c095-4191-b84d-a49ab8a0c72d") {
            giveawayId = claim.eventId;
            eventId = "a0a896d5-92dc-4b22-9f33-dda1c862f522";
          } else {
            giveawayId = "e5fb8f30-7495-4f68-b037-2bef16ee8d20";
            eventId = "9e938d53-16e6-44a0-ac46-b2444ab4442b";
          }
          break;
        case "44,-2":
          giveawayId = "af82ef25-4207-4526-b512-4d2ed0b22de7";
          eventId = "469b62e4-8415-447d-9d67-be39831377c1";
          break;
        case "-111,22":
          giveawayId = "8cb9f03a-7a4f-42d1-972a-fe7e5b17f59d";
          eventId = "2662bd37-ef9c-424d-a470-e9412f3b7af1";
          break;
        case "35,-65":
          giveawayId = "41742e9f-d962-47d6-88b7-d48146b6a1fb";
          eventId = "0c2e0962-f506-4203-98c2-4d9db87af46b";
          break;
        case "37,-115":
          giveawayId = "2bebba7f-6645-4ddb-ad93-1b20f3ebaa4b";
          eventId = "b505954c-fb56-447f-8f49-2a10c0dcb2ce";
          break;
        case "4,-111":
          giveawayId = "ab46bbac-01db-4bdc-b96b-f621232a85d6";
          eventId = "92c4e4d4-b431-4d46-8cd9-83e26f32d980";
          break;
        case "-14,52":
          giveawayId = "838ea33d-5469-40b6-b2c1-0d820220e19d";
          eventId = "fe445445-195a-4db2-a54b-f3c9df7523e0";
          break;
        case "-11,-133":
          giveawayId = "e5fb8f30-7495-4f68-b037-2bef16ee8d20";
          eventId = "9e938d53-16e6-44a0-ac46-b2444ab4442b";
          break;
        default:
          return;
      }

      if (claim.claimedAt && DateTime.fromISO(claim.claimedAt).isValid) {
        claimTs = DateTime.fromISO(claim.claimedAt).toUnixInteger();
      } else if (claim.timestamp && DateTime.fromMillis(claim.timestamp).isValid) {
        claimTs = claim.timestamp;
      } else {
        return;
      }

      const newAnalyticsRecord = new Analytics.Session.Action({
        name: "Giveaway Claim",
        origin: { world: "decentraland", location: claim.baseParcel, coordinates: claim.baseParcel.split(",") },
        metadata: { eventId, giveawayId },
        ts: claimTs,
      });

      const newTransaction = new Accounting.Transaction({
        txType: Accounting.TransactionType.AIRDROP,
        paymentType: Accounting.PaymentType.CREDIT,
        txHash: claim.txHash,
        txAmount: 1,
        complete: true,
        ts: claimTs,
      });

      transactionId = newTransaction.sk;

      const newClaim = new Giveaway.Claim({
        to: claim.wallet,
        analyticsRecord: newAnalyticsRecord.sk,
        eventId,
        clientIp: claim.clientIp,
        giveawayId,
        transactionId,
        claimTs,
      });
      console.log(newAnalyticsRecord, newClaim, newTransaction);
      await GiveawayManager.addClaim(newAnalyticsRecord, newClaim, newTransaction);
    });

    return ids;
  };

  static moveDataInBatches: CallableFunction = async (sourceTableName: string, destinationTableName: string, batchSize: number) => {
    try {
      await MigrationDbManager.moveDataInBatches(sourceTableName, destinationTableName, batchSize);
      console.log("Data migration completed.");
    } catch (error: any) {
      console.error("Data migration failed:", error);
    }
  };
}
