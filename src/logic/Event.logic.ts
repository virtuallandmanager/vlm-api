import { Event } from '../models/Event.model'
import { EventDbManager } from '../dal/Event.data'
import { User } from '../models/User.model'
import { DateTime } from 'luxon'

export abstract class EventManager {
  static create: CallableFunction = async (eventConfig?: Event.Config) => {
    const event = new Event.Config(eventConfig)
    event.createdAt = DateTime.now().toMillis()
    return await EventDbManager.put(event)
  }

  static add: CallableFunction = async (event: Event) => {
    return await EventDbManager.put(event)
  }

  static get: CallableFunction = async (eventConfig?: Event.Config) => {
    const event = new Event.Config(eventConfig)
    return await EventDbManager.get(event)
  }

  static update: CallableFunction = async (eventConfig?: Event.Config) => {
    const event = new Event.Config(eventConfig)
    return await EventDbManager.put(event)
  }

  static linkScenes: CallableFunction = async (eventId: string, sceneIds: string[]) => {
    const existingLinks = await EventDbManager.getLinkedScenesById(eventId)
    const linksToAdd = sceneIds.map((sceneId: string) => new Event.SceneLink({ eventId, sceneId }))
    const linksToRemove = existingLinks.filter((link: Event.SceneLink) => !sceneIds.includes(link.sceneId))
    return await EventDbManager.updateSceneLinks(eventId, linksToAdd, linksToRemove)
  }

  static linkScene: CallableFunction = async (eventId: string, sceneId: string) => {
    // check if the scene is already linked to this event
    const existingLinks = await EventDbManager.getLinkedScenesById(eventId)
    const existingLink = existingLinks.find((link: Event.SceneLink) => link.sceneId === sceneId)
    if (existingLink) {
      return existingLink
    }
    const link = new Event.SceneLink({ eventId, sceneId })
    return await EventDbManager.linkScene(link)
  }

  static unlinkScene: CallableFunction = async (eventId: string, sceneId: string) => {
    const existingLinks = await EventDbManager.getLinkedScenesById(eventId)
    const filteredLink = existingLinks.find((link: Event.SceneLink) => link.sceneId === sceneId)
    await EventDbManager.unlinkScene(filteredLink.sk)
    return filteredLink.sk
  }

  static linkGiveaways: CallableFunction = async (eventId: string, giveawayIds: string[]) => {
    const existingLinks = await EventDbManager.getLinkedGiveawaysById(eventId)
    const linkedGiveawayIds = existingLinks.map((link: Event.GiveawayLink) => link.giveawayId)

    const linksToAdd = giveawayIds
      .map((giveawayId: string) => {
        if (linkedGiveawayIds.includes(giveawayId)) {
          return
        }
        return new Event.GiveawayLink({ eventId, giveawayId })
      })
      .filter((x) => x)
    const linksToRemove = existingLinks.filter((link: Event.GiveawayLink) => !giveawayIds.includes(link.giveawayId))
    return await EventDbManager.updateGiveawayLinks(eventId, linksToAdd, linksToRemove)
  }

  static linkGiveaway: CallableFunction = async (eventId: string, giveawayId: string) => {
    // check if the giveaway is already linked to this event
    const existingLinks = await EventDbManager.getLinkedGiveawaysById(eventId)
    const existingLink = existingLinks.find((link: Event.GiveawayLink) => link.giveawayId === giveawayId)
    if (existingLink) {
      return existingLink
    }
    const link = new Event.GiveawayLink({ eventId, giveawayId })
    return await EventDbManager.linkGiveaway(link)
  }

  static unlinkGiveaway: CallableFunction = async (eventId: string, giveawayId: string) => {
    const existingLinks = await EventDbManager.getLinkedGiveawaysById(eventId)
    const filteredLink = existingLinks.find((link: Event.GiveawayLink) => link.giveawayId === giveawayId)
    await EventDbManager.unlinkGiveaway(filteredLink.sk)
    return filteredLink.sk
  }

  static getById: CallableFunction = async (eventId: string) => {
    return await EventDbManager.getById(eventId)
  }

  static getByIds: CallableFunction = async (eventIds: string[]) => {
    return await EventDbManager.getByIds(eventIds)
  }

  static getLinkedScenes: CallableFunction = async (sks: string[] | Event.Config[]) => {
    const eventIds: string[] = []
    //convert full event objects into sks
    sks.forEach((event: Event.Config | string, index: number) => {
      if (typeof event !== 'string') {
        eventIds.push(event.sk)
      }
    })
    return await EventDbManager.getLinkedScenesByIds(eventIds)
  }

  static getLinkedEventsBySceneId: CallableFunction = async (sceneId: string) => {
    return await EventDbManager.getLinkedEventsBySceneId(sceneId)
  }

  static getOngoingEventsBySceneId: CallableFunction = async (sceneId: string) => {
    const events = await EventDbManager.getLinkedEventsBySceneId(sceneId)
    if (events.length === 0) {
      return events
    }
    const ongoingEvents = events.filter((event: Event.Config) => {
      const now = DateTime.now().toMillis()
      return event.eventStart <= now && (!event.eventEnd || event.eventEnd >= now)
    })
    return ongoingEvents
  }

  static getLinkedGiveaways: CallableFunction = async (sks: string[] | Event.Config[]) => {
    const eventIds: string[] = []
    //convert full event objects into sks
    sks.forEach((event: Event.Config | string, index: number) => {
      if (typeof event !== 'string') {
        eventIds.push(event.sk)
      }
    })
    return await EventDbManager.getLinkedGiveawaysByIds(eventIds)
  }

  static getEventsForUser: CallableFunction = async (vlmUser: User.Account) => {
    return await EventDbManager.getAllForUser(vlmUser)
  }

  static getGiveawaysForEvent: CallableFunction = async (eventConfig?: Event.Config) => {
    return await EventDbManager.getGiveawaysForEvent(eventConfig)
  }
}
