import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import { Metaverse } from "./Metaverse.model";

export namespace Scene {
  export abstract class Config {
    static pk: string = "vlm:scene:config";
    pk?: string;
    sk?: string = uuidv4();
    displayName?: string = "New Scene";
    world?: Metaverse.Worlds;
    scenePresetIds?: string[];
    settings?: string[];
    created?: EpochTimeStamp = DateTime.now().toUnixInteger();

    constructor(config: Config) {
      this.sk = config.sk || this.sk;
      this.displayName = config.displayName || this.displayName;
      this.created = config.created || this.created;
      this.scenePresetIds = config.scenePresetIds || [];
      this.settings = config.settings || [];
    }
  }

  export abstract class Preset {
    static pk: string = "vlm:scene:preset";
    pk: string = Preset.pk;
    sk: string = uuidv4();
    displayName: string = "New Preset";
    locale: string;
    created: EpochTimeStamp = DateTime.now().toUnixInteger();

    constructor(config: Preset, clone: boolean = false) {
      this.sk = clone ? this.sk : config.sk || this.sk;
      this.displayName = config.displayName || this.displayName;
      this.created = config.created || this.created;
    }
  }

  export class Setting {
    static pk: string = "vlm:scene:setting";
    pk: string = Setting.pk;
    sk: string = uuidv4();
    sceneId: string;
    type: SettingType;
    setting: string;
    value: string | boolean | number;

    constructor(options: Setting) {
      this.sk = options.sk || this.sk;
      this.type = options.type;
      this.sceneId = options.sceneId;
    }
  }

  export enum SettingType {
    LOCALIZATION,
    MODERATION,
    INTEROPERABILITY,
  }
}
