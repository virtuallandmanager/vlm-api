import { v4 as uuidv4 } from "uuid";
import { ClickEvent } from "./ClickEvent.model";

export class SceneVideo {
  static pk: string = "vlm:scene:video"; // Partition Key
  pk?: string = SceneVideo.pk; // Partition Key
  sk: string = uuidv4(); // Sort Key
  customId?: string;
  customRendering?: boolean;
  displayName: string;
  clickEvent?: ClickEvent;
  emission: number;
  enableLiveStream: boolean;
  instances: SceneVideoInstanceConfig[] = [];
  liveLink?: string;
  offType: EVideoSourceTypes;
  offImageLink: string;
  parent?: string;
  playlist: string[];
  show: boolean;
  volume: number;
  withCollisions: boolean;

  constructor(config: SceneVideoConfig) {
    this.sk = config.sk || this.sk; // Sort Key  customId?: string;
    this.customId = config.customId || this.customId;
    this.customRendering = config.customRendering;
    this.displayName = config.displayName;
    this.clickEvent = config.clickEvent;
    this.emission = config.emission;
    this.enableLiveStream = config.enableLiveStream;
    this.instances = config.instances;
    this.liveLink = config.liveLink;
    this.offType = config.offType;
    this.offImageLink = config.offImageLink;
    this.parent = config.parent;
    this.playlist = config.playlist;
    this.show = config.show;
    this.volume = config.volume;
    this.withCollisions = config.withCollisions;
  }
}

export class SceneVideoInstance {
  static pk: string = "vlm:scene:video:instance"; // Partition Key
  pk?: string = SceneVideoInstance.pk; // Partition Key
  sk: string; // Sort Key  customId?: string;
  customId?: string;
  displayName: string;
  show: boolean;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  withCollisions: boolean;
  parent?: string;
  customRendering?: boolean;

  constructor(config: SceneVideoInstanceConfig) {
    this.sk = config.sk || this.sk; // Sort Key  customId?: string;
    this.customId = config.customId || this.customId;
    this.displayName = config.displayName;
    this.show = config.show;
    this.position = config.position;
    this.rotation = config.rotation;
    this.scale = config.scale;
    this.withCollisions = config.withCollisions;
    this.parent = config.parent;
    this.customRendering = config.customRendering;
  }
}

export type SceneVideoConfig = {
  pk?: string; // Partition Key
  sk?: string; // Sort Key
  customId?: string;
  customRendering?: boolean;
  displayName?: string;
  clickEvent?: ClickEvent;
  emission?: number;
  enableLiveStream?: boolean;
  instances?: SceneVideoInstanceConfig[];
  liveLink?: string;
  offType?: EVideoSourceTypes;
  offImageLink?: string;
  parent?: string;
  playlist?: string[];
  show?: boolean;
  volume?: number;
  withCollisions?: boolean;
};

export type SceneVideoInstanceConfig = {
  pk?: string; // Partition Key
  sk?: string; // Sort Key
  customId?: string;
  customRendering?: boolean;
  parent?: string | null;
  displayName: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  show: boolean;
  withCollisions: boolean;
};

export enum EVideoSourceTypes {
  LIVE,
  PLAYLIST,
  IMAGE,
  NONE,
}
