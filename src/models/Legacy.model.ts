import { ClickEvent } from "./ClickEvent.model";
import { ESceneWidgetType } from "./SceneWidget.model";
import { EVideoSourceTypes } from "./SceneVideo.model";

export type LegacySceneConfig = {
  tokenId: string; // Partition Key
  baseParcel: string; // Sort Key
  propertyName: string;
  events: LegacyEventConfig[];
  sceneData: {
    dialogs: LegacyDialogConfig[];
    customizations: LegacyCustomizationConfig[];
    images: LegacyImageConfig[];
    moderation: {};
    videoScreens: LegacyVideoScreenConfig[];
  };
};

export type LegacyEventConfig = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  claimBufferStart: number;
  claimBufferEnd: number;
  giveaway: boolean;
  giveawayItems: {
    tokenId: number;
    claimAction: string;
    contractAddress: string;
    creditAccount: string;
    limit: number;
  }[];
};

export type LegacyVideoScreenConfig = {
  id: string;
  customId?: string;
  customRendering?: boolean;
  clickEvent?: ClickEvent;
  emission: number;
  enableLiveStream: boolean;
  instances: LegacyVideoInstanceConfig[];
  liveLink?: string;
  name: string;
  offType: EVideoSourceTypes;
  offImageLink: string;
  parent?: string;
  playlist: string[];
  show: boolean;
  volume: number;
  withCollisions: boolean;
};

export type LegacyVideoInstanceConfig = {
  id: string;
  customId?: string;
  customRendering?: boolean;
  parent?: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  show: boolean;
  withCollisions: boolean;
};

export type LegacyDialogConfig = {
  dialogType: number;
  enabled: boolean;
  messages: string[];
};

export type LegacyImageConfig = {
  id: string;
  customId: string;
  emission: number;
  height: number;
  imageLink: string;
  isTransparent: boolean;
  name: string;
  show: boolean;
  width: number;
  withCollisions: boolean;
  instances: LegacyImageInstanceConfig[];
};

export type LegacyImageInstanceConfig = {
  clickEvent: ClickEvent;
  customId: null;
  id: string;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
  show: boolean;
  withCollisions: boolean;
};

export type LegacyCustomizationConfig = {
  id: string;
  type?: ESceneWidgetType;
  value?: string | boolean;
};