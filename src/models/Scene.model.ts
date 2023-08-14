import { v4 as uuidv4 } from "uuid";
import { Metaverse } from "./Metaverse.model";
import { TransformConstructorArgs } from "./Transform.model";
import { ClickEvent } from "./ClickEvent.model";
import { ModerationSettings } from "./ModerationSettings.model";
import { DateTime } from "luxon";

export namespace Scene {
  export class Config {
    static pk: string = "vlm:scene";
    pk?: string = Config.pk;
    sk?: string = uuidv4();
    name?: string = "New Scene";
    imageSrc?: string = "";
    locations?: Metaverse.Location[] = [];
    scenePreset?: string | Preset;
    presets?: Array<string | Preset> = [];
    settings?: Array<string | Setting> = [];
    createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
    ts?: EpochTimeStamp = Date.now();

    constructor(config?: Config) {
      this.sk = config.sk || this.sk;
      this.name = config.name || this.name;
      this.imageSrc = config.imageSrc || this.imageSrc;
      this.locations = config.locations || this.locations;
      this.scenePreset = config.scenePreset;
      this.presets = config.presets || this.presets;
      this.settings = config.settings || this.settings;
      this.createdAt = config.createdAt || this.createdAt;
      this.ts = config.ts || this.ts;
    }
  }

  export class Preset {
    static pk: string = "vlm:scene:preset";
    pk?: string = Preset.pk;
    sk?: string = uuidv4();
    name?: string = "New Preset";
    videos?: string[] | Video.Config[] = [];
    images?: string[] | Image.Config[] = [];
    nfts?: string[] | NFT.Config[] = [];
    sounds?: string[] | Sound.Config[] = [];
    widgets?: string[] | Widget.Config[] = [];
    locale?: string = "en-US";
    createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
    ts?: EpochTimeStamp;

    constructor(config?: Preset, clone: boolean = false) {
      if (!clone && config) {
        this.sk = config.sk || this.sk;
      }
      this.name = config?.name || this.name;
      this.videos = config?.videos || this.videos;
      this.images = config?.images || this.images;
      this.nfts = config?.nfts || this.nfts;
      this.sounds = config?.sounds || this.sounds;
      this.widgets = config?.widgets || this.widgets;
      this.locale = config?.locale || this.locale;
      this.createdAt = config?.createdAt || this.createdAt;
      this.ts = config.ts || this.ts;
    }
  }

  export class Setting {
    static pk: string = "vlm:scene:setting";
    pk?: string = Setting.pk;
    sk?: string = uuidv4();
    sceneId?: string;
    type?: SettingType;
    settingName?: string;
    settingValue?: unknown;
    ts?: EpochTimeStamp;

    constructor(config: Setting) {
      this.sk = config.sk || this.sk;
      this.sceneId = config.sceneId;
      this.type = config.type;
      this.settingName = config.settingName;
      this.settingValue = config.settingValue;
      this.ts = config.ts || this.ts;
    }
  }

  export class WorldLink {
    static pk: string = "vlm:scene:world:link";
    pk: string = WorldLink.pk;
    sk: string = uuidv4();
    worldId: string;
    sceneId: string;

    constructor(world: Metaverse.World, scene: Scene.Config) {
      this.worldId = world.sk;
      this.sceneId = scene.sk;
    }
  }

  export abstract class Element {
    pk?: string;
    sk?: string = uuidv4();
    name?: string;
    ts?: EpochTimeStamp;
  }

  export class DefaultSettings {
    settings: Setting[];
    constructor(scene: Config, locale?: string) {
      const sceneId = scene.sk;
      this.settings = [
        new Setting({ sceneId, type: SettingType.LOCALIZATION, settingName: "Main Locale", settingValue: locale || "en-US" }),
        new Setting({ sceneId, type: SettingType.MODERATION, settingName: "Banned Wearables", settingValue: [] }),
        new Setting({ sceneId, type: SettingType.MODERATION, settingName: "Banned Users", settingValue: [] }),
        new Setting({ sceneId, type: SettingType.MODERATION, settingName: "Allowed Wearables", settingValue: [] }),
        new Setting({ sceneId, type: SettingType.MODERATION, settingName: "Allowed Users", settingValue: [] }),
      ];
    }
  }

  export class Invite {
    static pk: string = "vlm:scene:invite";
    pk?: string = Config.pk;
    sk?: string = uuidv4();
    userId?: string;
    sceneId?: string;
    startTime?: EpochTimeStamp;
    endTime?: EpochTimeStamp;
    permissions?: Permissions;
    ts?: EpochTimeStamp;

    constructor(config?: Invite) {
      if (!config) {
        return;
      }
      this.sk = config.sk || this.sk;
      this.userId = config.userId;
      this.sceneId = config.sceneId;
      this.startTime = config.startTime;
      this.endTime = config.endTime;
      this.permissions = config.permissions;
      this.ts = config.ts || this.ts;
    }
  }

  export enum SettingType {
    LOCALIZATION,
    MODERATION,
    INTEROPERABILITY,
  }

  export class Permissions {
    static CREATE_PRESET?: number = 1;
    static LOAD_PRESET?: number = 2;
    static SAVE_PRESET?: number = 3;
    static DELETE_PRESET?: number = 9;
    static ADD_VIDEO?: number = 10;
    static EDIT_VIDEO?: number = 11;
    static DELETE_VIDEO?: number = 19;
    static ADD_IMAGE?: number = 21;
    static EDIT_IMAGE?: number = 22;
    static DELETE_IMAGE?: number = 29;
    static ADD_AUDIO?: number = 30;
  }

  export namespace Video {
    export class Config extends Element {
      static pk: string = "vlm:scene:video"; // Partition Key
      pk?: string = Config.pk; // Partition Key
      sk?: string = uuidv4(); // Sort Key
      customId?: string;
      customRendering?: boolean = false;
      name?: string = "New Video Screen";
      clickEvent?: ClickEvent;
      emission?: number = 1;
      enableLiveStream?: boolean = false;
      instances?: string[] | Instance[] = [];
      liveSrc?: string = "";
      offType?: SourceType = SourceType.NONE;
      offImageSrc?: string = "";
      parent?: string = "";
      playlist?: string[] = [];
      enabled?: boolean = true;
      volume?: number = 1;
      withCollisions?: boolean = true;
      createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
      ts?: EpochTimeStamp;

      constructor(config: Config = {}) {
        super();
        this.sk = config.sk || this.sk; // Sort Key
        this.customId = config.customId || this.customId;
        this.customRendering = config.customRendering;
        this.name = config.name;
        this.clickEvent = config.clickEvent;
        this.emission = config.emission;
        this.enableLiveStream = config.enableLiveStream;
        this.instances = config.instances;
        this.liveSrc = config.liveSrc;
        this.offType = config.offType;
        this.offImageSrc = config.offImageSrc;
        this.parent = config.parent;
        this.playlist = config.playlist;
        this.enabled = config.enabled;
        this.volume = config.volume;
        this.withCollisions = config.withCollisions;
        this.createdAt = config.createdAt;
        this.ts = config.ts;
      }
    }

    export class Instance {
      static pk: string = "vlm:scene:video:instance"; // Partition Key
      pk?: string = Instance.pk; // Partition Key
      sk?: string; // Sort Key
      customId?: string;
      name?: string;
      enabled?: boolean;
      position?: TransformConstructorArgs;
      rotation?: TransformConstructorArgs;
      scale?: TransformConstructorArgs;
      withCollisions?: boolean;
      parent?: string;
      customRendering?: boolean;
      createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
      ts?: EpochTimeStamp;

      constructor(config: Instance = {}) {
        this.sk = config.sk || this.sk; // Sort Key
        this.customId = config.customId || this.customId;
        this.name = config.name;
        this.enabled = config.enabled;
        this.position = config.position;
        this.rotation = config.rotation;
        this.scale = config.scale;
        this.withCollisions = config.withCollisions;
        this.parent = config.parent;
        this.customRendering = config.customRendering;
        this.createdAt = config.createdAt;
        this.ts = config.ts;
      }
    }

    export enum SourceType {
      NONE,
      IMAGE,
      PLAYLIST,
      LIVE,
    }
  }

  export namespace Image {
    export class Config extends Element {
      static pk?: string = "vlm:scene:image"; // Partition Key
      pk?: string = Config.pk; // Partition Key
      sk?: string = uuidv4();
      customId?: string;
      customRendering?: boolean;
      externalUrl?: boolean;
      name?: string;
      clickEvent?: ClickEvent;
      emission?: number;
      imageSrc?: string;
      thumbnailSrc?: string;
      textureSrc?: string;
      height?: number | string;
      width?: number | string;
      density?: number | string;
      instances?: string[] | Instance[] = [];
      parent?: string;
      enabled?: boolean;
      isTransparent?: boolean;
      withCollisions?: boolean;
      createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
      ts?: EpochTimeStamp;

      constructor(config: Config = {}) {
        super();
        this.sk = config.sk || this.sk; // Sort Key
        this.customId = config.customId || this.customId;
        this.customRendering = config.customRendering;
        this.externalUrl = config.externalUrl;
        this.name = config.name;
        this.clickEvent = config.clickEvent;
        this.emission = config.emission;
        this.instances = config.instances;
        this.imageSrc = config.imageSrc;
        this.thumbnailSrc = config.thumbnailSrc;
        this.textureSrc = config.textureSrc;
        this.height = config.height;
        this.width = config.width;
        this.density = config.density;
        this.parent = config.parent;
        this.enabled = config.enabled;
        this.withCollisions = config.withCollisions;
        this.createdAt = config.createdAt;
        this.ts = config.ts;
      }
    }

    export class Instance {
      static pk: string = "vlm:scene:image:instance"; // Partition Key
      pk?: string = Instance.pk; // Partition Key
      sk?: string; // Sort Key
      customId?: string;
      name?: string;
      enabled?: boolean;
      position?: TransformConstructorArgs;
      rotation?: TransformConstructorArgs;
      scale?: TransformConstructorArgs;
      withCollisions?: boolean;
      parent?: string;
      customRendering?: boolean;
      createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
      ts?: EpochTimeStamp;

      constructor(config: Instance = {}) {
        this.sk = config.sk || this.sk; // Sort Key
        this.customId = config.customId || this.customId;
        this.name = config.name;
        this.enabled = config.enabled;
        this.position = config.position;
        this.rotation = config.rotation;
        this.scale = config.scale;
        this.withCollisions = config.withCollisions;
        this.parent = config.parent;
        this.customRendering = config.customRendering;
        this.createdAt = config.createdAt;
        this.ts = config.ts;
      }
    }
  }

  export namespace NFT {
    export class Config extends Element {
      static pk?: string = "vlm:scene:nft"; // Partition Key
      pk?: string = Config.pk; // Partition Key
      sk?: string = uuidv4();
      customId?: string;
      customRendering?: boolean;
      name?: string;
      clickEvent?: ClickEvent;
      emission?: number;
      imageSrc?: string;
      contractAddress?: string;
      tokenId?: string | number;
      instances?: string[] | Instance[] = [];
      parent?: string;
      enabled?: boolean;
      isTransparent?: boolean;
      withCollisions?: boolean;
      createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
      ts?: EpochTimeStamp;

      constructor(config: Config = {}) {
        super();
        this.sk = config.sk || this.sk; // Sort Key
        this.customId = config.customId || this.customId;
        this.customRendering = config.customRendering;
        this.name = config.name;
        this.clickEvent = config.clickEvent;
        this.emission = config.emission;
        this.imageSrc = config.imageSrc;
        this.contractAddress = config.contractAddress;
        this.tokenId = config.tokenId;
        this.instances = config.instances;
        this.parent = config.parent;
        this.enabled = config.enabled;
        this.withCollisions = config.withCollisions;
        this.createdAt = config.createdAt || this.createdAt;
        this.ts = config.ts;
      }
    }

    export class Instance {
      static pk: string = "vlm:scene:nft:instance"; // Partition Key
      pk?: string = Instance.pk; // Partition Key
      sk?: string = uuidv4();
      customId?: string;
      name?: string;
      enabled?: boolean;
      position?: TransformConstructorArgs;
      rotation?: TransformConstructorArgs;
      scale?: TransformConstructorArgs;
      withCollisions?: boolean;
      parent?: string;
      customRendering?: boolean;
      createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
      ts?: EpochTimeStamp;

      constructor(config: Instance = {}) {
        this.sk = config.sk || this.sk; // Sort Key
        this.customId = config.customId || this.customId;
        this.name = config.name;
        this.enabled = config.enabled;
        this.position = config.position;
        this.rotation = config.rotation;
        this.scale = config.scale;
        this.withCollisions = config.withCollisions;
        this.parent = config.parent;
        this.customRendering = config.customRendering;
        this.createdAt = config.createdAt;
        this.ts = config.ts;
      }
    }
  }

  export namespace Sound {
    export enum SourceType {
      CLIP,
      LOOP,
      PLAYLIST,
      STREAM,
    }
    export class Config extends Element {
      static pk?: string = "vlm:scene:sound"; // Partition Key
      pk?: string = Config.pk; // Partition Key
      sk?: string = uuidv4();
      customId?: string;
      customRendering?: boolean;
      name?: string;
      audioPath?: string;
      instances?: string[] | Instance[] = [];
      parent?: string;
      sourceType?: SourceType = SourceType.CLIP;
      loop?: boolean;
      enabled?: boolean;
      isTransparent?: boolean;
      withCollisions?: boolean;
      createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
      ts?: EpochTimeStamp;

      constructor(config: Config = {}) {
        super();
        this.sk = config.sk || this.sk; // Sort Key
        this.customId = config.customId || this.customId;
        this.customRendering = config.customRendering;
        this.name = config.name;
        this.instances = config.instances;
        this.parent = config.parent;
        this.sourceType = config.sourceType || this.sourceType;
        this.loop = config.loop;
        this.enabled = config.enabled;
        this.withCollisions = config.withCollisions;
        this.createdAt = config.createdAt;
        this.ts = config.ts;
      }
    }

    export class Instance {
      static pk: string = "vlm:scene:sound:instance"; // Partition Key
      pk?: string = Instance.pk; // Partition Key
      sk?: string = uuidv4();
      customId?: string;
      name?: string;
      enabled?: boolean;
      position?: TransformConstructorArgs;
      rotation?: TransformConstructorArgs;
      scale?: TransformConstructorArgs;
      offset?: number;
      withCollisions?: boolean;
      parent?: string;
      customRendering?: boolean;
      createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
      ts?: EpochTimeStamp;

      constructor(config: Instance = {}) {
        this.sk = config.sk || this.sk; // Sort Key
        this.customId = config.customId || this.customId;
        this.name = config.name;
        this.enabled = config.enabled;
        this.position = config.position;
        this.rotation = config.rotation;
        this.scale = config.scale;
        this.offset = config.offset;
        this.withCollisions = config.withCollisions;
        this.parent = config.parent;
        this.customRendering = config.customRendering;
        this.createdAt = config.createdAt;
        this.ts = config.ts;
      }
    }
  }

  export namespace Widget {
    export class Config extends Element {
      static pk: string = "vlm:scene:widget";
      pk?: string = Config.pk;
      sk?: string = uuidv4(); //used by vlm to identify the record
      id?: string; //used by users/programmers to identify their widget in code
      name?: string;
      type?: ControlType;
      selections?: WidgetSelection[];
      value?: number | string | Object | Array<unknown> | boolean;
      range?: [number, number];
      createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();
      ts?: EpochTimeStamp;

      constructor(config: Config = {}) {
        super();
        this.sk = config.sk || this.sk;
        this.id = config.id;
        this.name = config.name;
        this.range = config.range;
        this.type = config.type;
        this.value = config.value;
        this.selections = config.selections;
        this.createdAt = config.createdAt;
        this.ts = config.ts;
      }
    }

    export enum ControlType {
      NONE,
      TOGGLE,
      TEXT,
      SELECTOR,
      DATETIME,
      TRIGGER,
      SLIDER,
    }

    export type WidgetSelection = {
      text: string;
      value: string;
    };
  }

  export type Instance = Video.Instance | Image.Instance | NFT.Instance | Sound.Instance;
  export type ElementName = "image" | "video" | "nft" | "sound" | "widget";
  export type Action = "init" | "create" | "update" | "delete" | "trigger";
  export type Settings = "moderation";
  export type Property = "enabled" | "liveSrc" | "imageSrc" | "nftData" | "enableLiveStream" | "playlist" | "volume" | "emission" | "offType" | "offImage" | "transform" | "collider" | "parent" | "customId" | "clickEvent" | "transparency";

  export class ColyseusMessage {
    action: Action;
    element: ElementName;
    instance: boolean;
    settings: Settings;
    property?: Property;
    id?: string;
    elementData?: Element;
    instanceData?: Instance;
    settingsData?: ModerationSettings;
    scenePreset: string | Preset;
    value?: unknown;

    constructor(message: ColyseusMessage) {
      this.action = message.action;
      this.property = message.property;
      this.id = message.id;
      this.element = message.element;
      this.instance = message.instance;
      this.settings = message.settings;
      this.elementData = message.elementData;
      this.instanceData = message.instanceData;
      this.settingsData = message.settingsData;
      this.scenePreset = message.scenePreset;
      this.value = message.value;
    }
  }
  export const DemoSceneId = "00000000-0000-0000-0000-000000000000";
}
