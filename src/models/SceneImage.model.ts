import { v4 as uuidv4 } from "uuid";
import { ClickEvent } from "./ClickEvent.model";
import { TransformConstructorArgs } from "./Transform.model";

export class SceneImage {
  static pk?: string = "vlm:scene:image"; // Partition Key
  pk?: string = SceneImage.pk; // Partition Key
  sk: string = uuidv4();
  customId?: string;
  customRendering: boolean;
  displayName: string;
  clickEvent?: ClickEvent;
  emission: number;
  imageLink: string;
  instanceIds?: string[];
  parent?: string;
  show: boolean;
  isTransparent: boolean;
  withCollisions: boolean;

  constructor(config: SceneImageConfig) {
    this.sk = config.sk || this.sk; // Sort Key  customId?: string;
    this.customId = config.customId || this.customId;
    this.customRendering = config.customRendering;
    this.displayName = config.displayName;
    this.clickEvent = config.clickEvent;
    this.emission = config.emission;
    this.instanceIds = config.instanceIds;
    this.parent = config.parent;
    this.show = config.show;
    this.withCollisions = config.withCollisions;
  }
}

export class SceneImageInstance {
  static pk: string = "vlm:scene:image:instance"; // Partition Key
  pk?: string = SceneImageInstance.pk; // Partition Key
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

  constructor(config: SceneImageInstanceConfig) {
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

export type SceneImageConfig = {
  [key: string]: unknown;
  pk: string;
  sk: string;
  customId?: string;
  customRendering?: boolean;
  displayName?: string;
  clickEvent?: ClickEvent;
  emission: number;
  imageLink: string;
  instanceIds: string[];
  parent?: string;
  show: boolean;
  withCollisions: boolean;
  isTransparent: boolean;
};

export type SceneImageInstanceConfig = {
  [key: string]: unknown;
  pk: string;
  sk: string;
  customId?: string;
  customRendering?: boolean;
  clickEvent?: ClickEvent;
  displayName: string;
  parent?: string;
  position: TransformConstructorArgs;
  rotation: TransformConstructorArgs;
  scale: TransformConstructorArgs;
  show: boolean;
  withCollisions: boolean;
};
