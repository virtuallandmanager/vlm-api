import { Metaverse } from "../Metaverse.model";
import { Scene as BaseScene } from "../Scene.model";

export namespace Hyperfy {
  export class Scene extends BaseScene.Config implements SceneAttributes {
    parcels: string[];
    baseParcel: string;
    world?: Metaverse.Worlds = "hyperfy";

    constructor(config: Scene) {
      super(config);
    }
  }

  export class Preset extends BaseScene.Preset implements PresetAttributes {
    name: string = "New Preset";
    locale: string = "en-US";
    videoIds: string[];
    imageIds: string[];
    nftIds: string[];
    entityIds: string[];
    widgetIds: string[];

    constructor(config?: Preset, clone: boolean = false) {
      super(config, clone);
      this.name = config.name || this.name;
      this.locale = config.locale || this.locale;
      this.videoIds = config.videoIds;
      this.imageIds = config.imageIds;
      this.nftIds = config.nftIds;
      this.entityIds = config.entityIds;
      this.widgetIds = config.widgetIds;
    }
  }
  export interface SceneAttributes {}

  export interface PresetAttributes {
    videoIds: string[];
    imageIds: string[];
    nftIds: string[];
    entityIds: string[];
    widgetIds: string[];
  }
}
