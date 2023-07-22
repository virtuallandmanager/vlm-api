import { Event } from "../models/Event.model";
import { EventDbManager } from "../dal/Event.data";
import { User } from "../models/User.model";
import { DateTime } from "luxon";

export abstract class EventManager {
  static create: CallableFunction = async (eventConfig?: Event.Config) => {
    const event = new Event.Config(eventConfig);
    event.createdAt = DateTime.now().toUnixInteger();
    return await EventDbManager.put(event);
  };

  static add: CallableFunction = async (event: Event) => {
    return await EventDbManager.put(event);
  };

  static get: CallableFunction = async (eventConfig?: Event.Config) => {
    const event = new Event.Config(eventConfig);
    return await EventDbManager.get(event);
  };

  static getById: CallableFunction = async (eventId: string) => {
    return await EventDbManager.getById(eventId);
  };

  static getByIds: CallableFunction = async (eventIds: string[]) => {
    return await EventDbManager.getByIds(eventIds);
  };

  static getLegacyEvent: CallableFunction = async (baseParcel: string) => {
    return await EventDbManager.getLegacy(baseParcel);
  };

  static getEventsForUser: CallableFunction = async (vlmUser: User.Account) => {
    return await EventDbManager.getAllForUser(vlmUser);
  };

  static getGiveawaysForEvent: CallableFunction = async (eventConfig?: Event.Config) => {
    return await EventDbManager.getGiveawaysForEvent(eventConfig);
  };
}
