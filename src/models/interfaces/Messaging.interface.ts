import { Metaverse } from "../Metaverse.model";
import { User } from "../User.model";

export interface IsReadable {
  seen?: boolean;
  read?: boolean;
}

export interface IsDeliverable {
  delivered?: boolean;
  receiverId?: string;
}

export interface IsTriggerable {
  origin?: Metaverse.Location;
}

export interface IsSendable {
  senderId?: string;
  senderName?: string;
}

export interface IsTextable {
  smsNumber: User.SMSPhoneNumber;
}
