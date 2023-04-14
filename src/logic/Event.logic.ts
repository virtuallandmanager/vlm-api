import { Event, EventConfig } from "../models/Event.model";
import { EventDbManager } from "../dal/Event.data";
import { VLMUser } from "../models/User.model";

export abstract class EventManager {
  static createEvent: CallableFunction = async (eventConfig?: EventConfig) => {
    const event = new Event(eventConfig);
    return await EventDbManager.put(event);
  };

  static addEvent: CallableFunction = async (event: Event) => {
    return await EventDbManager.put(event);
  };

  static getEvent: CallableFunction = async (eventConfig?: EventConfig) => {
    const event = new Event(eventConfig);
    return await EventDbManager.get(event);
  };

  static getLegacyEvent: CallableFunction = async (baseParcel: string) => {
    return await EventDbManager.getLegacy(baseParcel);
  };

  static getEventsForUser: CallableFunction = async (vlmUser?: VLMUser) => {
    return await EventDbManager.getAllForUser(vlmUser);
  };
}
