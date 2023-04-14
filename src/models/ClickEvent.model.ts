import { TransformConstructorArgs } from "./Transform.model";

export enum EClickEventType {
    NONE,
    EXTERNAL,
    SOUND,
    STREAM,
    MOVE,
    TELEPORT
  }
  
  export type ClickEvent = {
    type: EClickEventType;
    showFeedback: boolean;
    hoverText?: string;
    externalLink?: string;
    sound?: string;
    moveTo?: { cameraTarget?: TransformConstructorArgs; position: TransformConstructorArgs };
    teleportTo?: string;
  };