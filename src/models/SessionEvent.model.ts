import { v4 as uuidv4 } from "uuid";

export class SessionEvent {
  pk: string = "dcl:user:session:event"; // Partition Key
  sk: string = uuidv4(); // Partition Key
  data: TAnalyticsData;
}

export type TAnalyticsData = [
  TAnalyticsTimestamp,
  TUserId,
  TEventType,
  TEventMetadata,
  TPositionX,
  TPositionY,
  TPositionZ
];

type TAnalyticsTimestamp = number;
type TUserId = string;
type TEventType = string;
type TEventMetadata = { [id: string]: any };
type TPositionX = number;
type TPositionY = number;
type TPositionZ = number;
