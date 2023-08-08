"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scene = void 0;
const uuid_1 = require("uuid");
const luxon_1 = require("luxon");
var Scene;
(function (Scene) {
    class Config {
        constructor(config) {
            this.pk = Config.pk;
            this.sk = (0, uuid_1.v4)();
            this.name = "New Scene";
            this.imageSrc = "";
            this.locations = [];
            this.presets = [];
            this.settings = [];
            this.createdAt = luxon_1.DateTime.now().toUnixInteger();
            this.ts = Date.now();
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
    Config.pk = "vlm:scene";
    Scene.Config = Config;
    class Preset {
        constructor(config, clone = false) {
            this.pk = Preset.pk;
            this.sk = (0, uuid_1.v4)();
            this.name = "New Preset";
            this.videos = [];
            this.images = [];
            this.nfts = [];
            this.sounds = [];
            this.widgets = [];
            this.locale = "en-US";
            this.createdAt = luxon_1.DateTime.now().toUnixInteger();
            if (!clone && config) {
                this.sk = config.sk || this.sk;
            }
            this.name = (config === null || config === void 0 ? void 0 : config.name) || this.name;
            this.videos = (config === null || config === void 0 ? void 0 : config.videos) || this.videos;
            this.images = (config === null || config === void 0 ? void 0 : config.images) || this.images;
            this.nfts = (config === null || config === void 0 ? void 0 : config.nfts) || this.nfts;
            this.sounds = (config === null || config === void 0 ? void 0 : config.sounds) || this.sounds;
            this.widgets = (config === null || config === void 0 ? void 0 : config.widgets) || this.widgets;
            this.locale = (config === null || config === void 0 ? void 0 : config.locale) || this.locale;
            this.createdAt = (config === null || config === void 0 ? void 0 : config.createdAt) || this.createdAt;
            this.ts = config.ts || this.ts;
        }
    }
    Preset.pk = "vlm:scene:preset";
    Scene.Preset = Preset;
    class Setting {
        constructor(config) {
            this.pk = Setting.pk;
            this.sk = (0, uuid_1.v4)();
            this.sk = config.sk || this.sk;
            this.sceneId = config.sceneId;
            this.type = config.type;
            this.settingName = config.settingName;
            this.settingValue = config.settingValue;
            this.ts = config.ts || this.ts;
        }
    }
    Setting.pk = "vlm:scene:setting";
    Scene.Setting = Setting;
    class WorldLink {
        constructor(world, scene) {
            this.pk = WorldLink.pk;
            this.sk = (0, uuid_1.v4)();
            this.worldId = world.sk;
            this.sceneId = scene.sk;
        }
    }
    WorldLink.pk = "vlm:scene:world:link";
    Scene.WorldLink = WorldLink;
    class Element {
        constructor() {
            this.sk = (0, uuid_1.v4)();
        }
    }
    Scene.Element = Element;
    class DefaultSettings {
        constructor(scene, locale) {
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
    Scene.DefaultSettings = DefaultSettings;
    class Invite {
        constructor(config) {
            this.pk = Config.pk;
            this.sk = (0, uuid_1.v4)();
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
    Invite.pk = "vlm:scene:invite";
    Scene.Invite = Invite;
    let SettingType;
    (function (SettingType) {
        SettingType[SettingType["LOCALIZATION"] = 0] = "LOCALIZATION";
        SettingType[SettingType["MODERATION"] = 1] = "MODERATION";
        SettingType[SettingType["INTEROPERABILITY"] = 2] = "INTEROPERABILITY";
    })(SettingType = Scene.SettingType || (Scene.SettingType = {}));
    class Permissions {
    }
    Permissions.CREATE_PRESET = 1;
    Permissions.LOAD_PRESET = 2;
    Permissions.SAVE_PRESET = 3;
    Permissions.DELETE_PRESET = 9;
    Permissions.ADD_VIDEO = 10;
    Permissions.EDIT_VIDEO = 11;
    Permissions.DELETE_VIDEO = 19;
    Permissions.ADD_IMAGE = 21;
    Permissions.EDIT_IMAGE = 22;
    Permissions.DELETE_IMAGE = 29;
    Permissions.ADD_AUDIO = 30;
    Scene.Permissions = Permissions;
    let Video;
    (function (Video) {
        class Config extends Element {
            constructor(config = {}) {
                super();
                this.pk = Config.pk; // Partition Key
                this.sk = (0, uuid_1.v4)(); // Sort Key
                this.customRendering = false;
                this.name = "New Video Screen";
                this.emission = 1;
                this.enableLiveStream = false;
                this.instances = [];
                this.liveLink = "";
                this.offType = SourceType.NONE;
                this.offImageSrc = "";
                this.parent = "";
                this.playlist = [];
                this.enabled = true;
                this.volume = 1;
                this.withCollisions = true;
                this.createdAt = luxon_1.DateTime.now().toUnixInteger();
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
        Config.pk = "vlm:scene:video"; // Partition Key
        Video.Config = Config;
        class Instance {
            constructor(config = {}) {
                this.pk = Instance.pk; // Partition Key
                this.createdAt = luxon_1.DateTime.now().toUnixInteger();
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
        Instance.pk = "vlm:scene:video:instance"; // Partition Key
        Video.Instance = Instance;
        let SourceType;
        (function (SourceType) {
            SourceType[SourceType["NONE"] = 0] = "NONE";
            SourceType[SourceType["IMAGE"] = 1] = "IMAGE";
            SourceType[SourceType["PLAYLIST"] = 2] = "PLAYLIST";
            SourceType[SourceType["LIVE"] = 3] = "LIVE";
        })(SourceType = Video.SourceType || (Video.SourceType = {}));
    })(Video = Scene.Video || (Scene.Video = {}));
    let Image;
    (function (Image) {
        class Config extends Element {
            constructor(config = {}) {
                super();
                this.pk = Config.pk; // Partition Key
                this.sk = (0, uuid_1.v4)();
                this.instances = [];
                this.createdAt = luxon_1.DateTime.now().toUnixInteger();
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
        Config.pk = "vlm:scene:image"; // Partition Key
        Image.Config = Config;
        class Instance {
            constructor(config = {}) {
                this.pk = Instance.pk; // Partition Key
                this.createdAt = luxon_1.DateTime.now().toUnixInteger();
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
        Instance.pk = "vlm:scene:image:instance"; // Partition Key
        Image.Instance = Instance;
    })(Image = Scene.Image || (Scene.Image = {}));
    let NFT;
    (function (NFT) {
        class Config extends Element {
            constructor(config = {}) {
                super();
                this.pk = Config.pk; // Partition Key
                this.sk = (0, uuid_1.v4)();
                this.instances = [];
                this.createdAt = luxon_1.DateTime.now().toUnixInteger();
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
        Config.pk = "vlm:scene:nft"; // Partition Key
        NFT.Config = Config;
        class Instance {
            constructor(config = {}) {
                this.pk = Instance.pk; // Partition Key
                this.sk = (0, uuid_1.v4)();
                this.createdAt = luxon_1.DateTime.now().toUnixInteger();
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
        Instance.pk = "vlm:scene:nft:instance"; // Partition Key
        NFT.Instance = Instance;
    })(NFT = Scene.NFT || (Scene.NFT = {}));
    let Sound;
    (function (Sound) {
        let SourceType;
        (function (SourceType) {
            SourceType[SourceType["CLIP"] = 0] = "CLIP";
            SourceType[SourceType["LOOP"] = 1] = "LOOP";
            SourceType[SourceType["PLAYLIST"] = 2] = "PLAYLIST";
            SourceType[SourceType["STREAM"] = 3] = "STREAM";
        })(SourceType = Sound.SourceType || (Sound.SourceType = {}));
        class Config extends Element {
            constructor(config = {}) {
                super();
                this.pk = Config.pk; // Partition Key
                this.sk = (0, uuid_1.v4)();
                this.instances = [];
                this.sourceType = SourceType.CLIP;
                this.createdAt = luxon_1.DateTime.now().toUnixInteger();
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
        Config.pk = "vlm:scene:sound"; // Partition Key
        Sound.Config = Config;
        class Instance {
            constructor(config = {}) {
                this.pk = Instance.pk; // Partition Key
                this.sk = (0, uuid_1.v4)();
                this.createdAt = luxon_1.DateTime.now().toUnixInteger();
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
        Instance.pk = "vlm:scene:sound:instance"; // Partition Key
        Sound.Instance = Instance;
    })(Sound = Scene.Sound || (Scene.Sound = {}));
    let Widget;
    (function (Widget) {
        class Config extends Element {
            constructor(config = {}) {
                super();
                this.pk = Config.pk;
                this.sk = (0, uuid_1.v4)(); //used by vlm to identify the record
                this.createdAt = luxon_1.DateTime.now().toUnixInteger();
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
        Config.pk = "vlm:scene:widget";
        Widget.Config = Config;
        let ControlType;
        (function (ControlType) {
            ControlType[ControlType["NONE"] = 0] = "NONE";
            ControlType[ControlType["TOGGLE"] = 1] = "TOGGLE";
            ControlType[ControlType["TEXT"] = 2] = "TEXT";
            ControlType[ControlType["SELECTOR"] = 3] = "SELECTOR";
            ControlType[ControlType["DATETIME"] = 4] = "DATETIME";
            ControlType[ControlType["TRIGGER"] = 5] = "TRIGGER";
            ControlType[ControlType["SLIDER"] = 6] = "SLIDER";
        })(ControlType = Widget.ControlType || (Widget.ControlType = {}));
    })(Widget = Scene.Widget || (Scene.Widget = {}));
    class ColyseusMessage {
        constructor(message) {
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
    Scene.ColyseusMessage = ColyseusMessage;
    Scene.DemoSceneId = "00000000-0000-0000-0000-000000000000";
})(Scene = exports.Scene || (exports.Scene = {}));
