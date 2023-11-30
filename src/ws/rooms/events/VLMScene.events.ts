import { Client, Room } from 'colyseus'
import { VLMScene } from '../VLMScene'
import { SessionManager } from '../../../logic/Session.logic'
import { SceneManager } from '../../../logic/Scene.logic'
import { Scene } from '../../../models/Scene.model'
import { Analytics } from '../../../models/Analytics.model'
import { User } from '../../../models/User.model'
import { ScenePresetManager } from '../../../logic/ScenePreset.logic'
import { SceneElementManager } from '../../../logic/SceneElement.logic'
import { analyticsAuthMiddleware } from '../../../middlewares/security/auth'
import { AdminLogManager } from '../../../logic/ErrorLogging.logic'
import { SceneStream, VLMSceneState } from '../schema/VLMSceneState'
import { HistoryManager } from '../../../logic/History.logic'
import { Metaverse } from '../../../models/Metaverse.model'
import { deepEqual } from '../../../helpers/data'
import { AnalyticsManager } from '../../../logic/Analytics.logic'
import { SceneSettingsManager } from '../../../logic/SceneSettings.logic'
import { GiveawayManager } from '../../../logic/Giveaway.logic'
import { Giveaway } from '../../../models/Giveaway.model'
import { DateTime } from 'luxon'

type ElementName = 'image' | 'video' | 'nft' | 'model' | 'sound' | 'widget' | 'claimpoint'
type Action = 'init' | 'create' | 'update' | 'delete' | 'trigger'
type Settings = 'moderation' | 'localization' | 'access' | 'interoperability'
type Property =
  | 'enabled'
  | 'liveSrc'
  | 'imageSrc'
  | 'enableLiveStream'
  | 'playlist'
  | 'volume'
  | 'emission'
  | 'offType'
  | 'offImage'
  | 'transform'
  | 'collider'
  | 'parent'
  | 'customId'
  | 'clickEvent'
  | 'transparency'
  | 'contactAddres'
  | 'tokenId'
export type VLMSceneElement = Scene.Image.Config | Scene.NFT.Config | Scene.Sound.Config | Scene.Video.Config
export type VLMSceneElementInstance = Scene.Image.Instance & Scene.NFT.Instance & Scene.Sound.Instance & Scene.Video.Instance

export class VLMSceneMessage {
  action: Action
  property?: Property
  id?: string
  element: ElementName
  instance: boolean
  setting: Settings
  elementData?: VLMSceneElement & { [key: string]: any }
  instanceData?: VLMSceneElementInstance
  settingData?: Scene.Setting
  scenePreset: Scene.Preset
  sceneData: Scene.Config
  user: User.Account
  isLive: boolean
  stage: 'pre' | 'post'

  constructor(message: VLMSceneMessage) {
    this.action = message.action
    this.property = message.property
    this.id = message.id
    this.element = message.element
    this.instance = message.instance
    this.setting = message.setting
    this.elementData = message.elementData
    this.instanceData = message.instanceData
    this.settingData = message.settingData
    this.scenePreset = message.scenePreset
    this.sceneData = message.sceneData
    this.user = message.user
    this.isLive = message.isLive
  }
}

export function bindEvents(room: VLMScene) {
  type EventHandler = (client: Client, message: any, room: VLMScene) => Promise<boolean> | boolean

  const eventHandlers: Record<string, EventHandler> = {
    session_start: handleSessionStart,
    session_action: handleSessionAction,
    session_end: handleSessionEnd,

    host_joined: handleHostJoined,
    host_left: handleHostLeft,

    analytics_user_joined: handleAnalyticsUserJoined,

    user_message: handleUserMessage,
    get_user_state: handleGetUserState,
    set_user_state: handleSetUserState,

    path_start: handlePathStart,
    path_segments_add: handlePathAddSegments,
    path_end: handlePathEnd,

    scene_create: handleSceneCreate,
    scene_load_request: handleSceneLoadRequest,
    scene_add_preset_request: handleSceneAddPresetRequest,
    scene_change_preset: handleSceneChangePreset,
    scene_clone_preset_request: handleSceneClonePresetRequest,
    scene_delete_preset_request: handleSceneDeletePresetRequest,
    scene_delete: handleSceneDelete,

    scene_moderator_message: handleModeratorMessage,
    scene_moderator_crash: handleModeratorCrash,

    scene_preset_update: handlePresetUpdate,
    scene_setting_update: handleSettingUpdate,
    scene_video_update: handleSceneVideoUpdate,
    scene_sound_locator: handleToggleSoundLocators,

    send_active_users: handleSendActiveUsers,

    giveaway_claim: handleGiveawayClaim,

    request_player_position: handleRequestPlayerPosition,
    send_player_position: handleSendPlayerPosition,

    setAdminAccess: handleAdminAccessSetting,
  }

  Object.keys(eventHandlers).forEach((eventType) => {
    room.onMessage(eventType, async (client: Client, message: any) => {
      if (eventHandlers.hasOwnProperty(eventType)) {
        const handler = eventHandlers[eventType]
        const broadcast = await handler(client, message, room)
        const { sceneId } = client.auth.session
        if (broadcast && sceneId) {
          room.clients.forEach((roomClient) => {
            if (roomClient.auth.session.sceneId === sceneId) {
              roomClient.send(eventType, message)
            }
          })
        }
      } else {
        // Handle unrecognized message types
      }
    })
  })
}

// THE TRUE OR FALSE IN THESE EVENT HANDLERS DETERMINES WHETHER THE MESSAGE GETS BROADCAST TO THE REST OF THE ROOM
// IF FALSE THEN IT IS ONLY ACTED UPON BY THE SERVER
export async function handleSessionStart(client: Client, sessionConfig: Analytics.Session.Config, room: VLMScene) {
  try {
    const { sessionToken, sceneId } = sessionConfig

    await analyticsAuthMiddleware(client, { sessionToken, sceneId }, async ({ session, user }) => {
      client.auth = { session, user: user || {} }
      let dbSession = await SessionManager.startAnalyticsSession({
          ...sessionConfig,
          sk: client.auth.sessionId,
        }),
        userLocation = session.location,
        scene = await SceneManager.obtainScene(new Scene.Config({ sk: sceneId, locations: [userLocation] })),
        scenePreset,
        sceneSettings

      const existingSceneLocations = scene.locations.filter((location: Metaverse.Location) => {
        const equal =
          deepEqual(location, userLocation) ||
          (location.world === userLocation.world &&
            location.location === userLocation.location &&
            location.coordinates[0] === userLocation.coordinates[0] &&
            location.coordinates[1] === userLocation.coordinates[1] &&
            location?.parcels?.length == userLocation?.parcels?.length)
        return equal
      })

      const worldHasBeenAdded = existingSceneLocations?.length,
        locationWithUpdatedVersion = existingSceneLocations.findIndex((location: Metaverse.Location) =>
          deepEqual(location.integrationData, userLocation.integrationData)
        )

      if (scene && !worldHasBeenAdded) {
        // add new location
        await SceneManager.updateSceneProperty({ scene, prop: 'locations', val: [...scene.locations, userLocation] })
      } else if (scene && worldHasBeenAdded && locationWithUpdatedVersion > -1) {
        // replace existing location
        const locations = scene.locations.filter((location: Metaverse.Location, i: number) => {
          return i !== locationWithUpdatedVersion
        })
        await SceneManager.updateSceneProperty({ scene, prop: 'locations', val: [...locations, userLocation] })
      } else if (scene.locations.length < 1) {
        // add first location
        await SceneManager.updateSceneProperty({ scene, prop: 'locations', val: [userLocation] })
      } else if (!scene || !worldHasBeenAdded) {
        AdminLogManager.logError('Unexpected location/version condition', { scene, userLocation })
      }

      client.send('session_started', { session: dbSession, user })

      if (scene?.scenePreset) {
        scenePreset = await ScenePresetManager.getScenePresetById(scene.scenePreset)
        scenePreset = await ScenePresetManager.buildScenePreset(scenePreset)

        for (let i = 0; i < scenePreset.videos.length; i++) {
          const video = scenePreset.videos[i]
          const cachedStream = room.state.streams.find((stream) => stream.sk == video.sk)
          if (cachedStream) {
            video.isLive = cachedStream.status
            continue
          } else if (video.liveSrc) {
            const status = await room.isStreamLive(video.liveSrc),
              stream = new SceneStream({ sk: video.sk, url: video.liveSrc, status, sceneId })
            room.state.streams.push(stream)
            video.isLive = status
          }
        }

        sceneSettings = await SceneSettingsManager.getSceneSettingsByIds(scene.settings)
        sceneSettings = { moderation: sceneSettings.find((setting: Scene.Setting) => setting.type === Scene.SettingType.MODERATION) }
      }

      client.send('scene_preset_update', { action: 'init', scenePreset, sceneSettings })
    })
    return false
  } catch (error) {
    return false
  }
}

async function handleSessionAction(
  client: Client,
  message: { action: string; metadata: any; pathPoint: Analytics.PathPoint; sessionToken: string },
  room: VLMScene
) {
  try {
    const timestamp = DateTime.now().toUnixInteger(),
      { action, metadata, pathPoint } = message,
      { session, user } = client.auth,
      { displayName } = user

    // if (client.auth.session.environment !== "prod") { return false };
    // await analyticsAuthMiddleware(client, { sessionToken, sceneId }, async () => {
    const response = await SessionManager.logAnalyticsAction({
      name: action,
      metadata,
      pathPoint,
      sessionId: session.sk,
      sceneId: session.sceneId,
      userId: session.userId,
      timestamp,
    })
    if (!response) {
      AdminLogManager.logError('Failed to log analytics action', { ...message, ...client.auth })
    } else {
      const hosts = room.clients.filter((c) => c?.auth?.session?.pk === User.Session.Config.pk)
      hosts.forEach((host) => {
        host.send('add_session_action', { action, metadata, pathPoint, displayName, timestamp })
      })
    }
    // });
    return false
  } catch (error) {
    AdminLogManager.logError('Failed to log analytics action - UNAUTHENTICATED', { ...message, ...client.auth })
    return false
  }
}

export async function handleSessionEnd(client: Client, message?: any, room?: VLMScene) {
  // Logic for session_end message
  try {
    const session = client.auth.session

    if (session.pk == Analytics.Session.Config) {
      await SessionManager.endAnalyticsSession(session)
    } else if (session.pk == User.Session.Config.pk) {
      await SessionManager.endVLMSession(session)
    }

    // check for other clients with the same sceneId and remove the scene's videos from the cache if there are none
    const sceneClients = room.clients.filter((c) => c.auth.session.sceneId == session.sceneId && c.auth.user.sk != client.auth.user.sk)
    console.log(`sceneClients remaining for ${session.sceneId} - `, sceneClients)
    if (sceneClients.length < 1) {
      room.state.streams = room.state.streams.filter((stream) => room.state.sceneId != session.sceneId)
    }

    return false
  } catch (error) {
    return false
  }
}

export async function handleHostJoined(client: Client, message: any, room: VLMScene) {
  // Logic for host_joined message
  try {
    const { user, session } = message,
      { displayName } = user,
      { connectedWallet } = session

    console.log('Host User Joined: ', user?.displayName, user?.connectedWallet)

    // Iterate over all clients and send the message to each client except the triggering client
    room.broadcast('host_joined', { displayName, connectedWallet })

    HistoryManager.addUpdate(message.user, message.session.sceneId, { action: 'accessed scene in VLM' })

    return false
  } catch (error) {
    console.log(error)
    return false
  }
}

export function handleHostLeft(client: Client, message: any, room: VLMScene) {
  // Logic for host_left message
  try {
    HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: 'left scene in VLM' })
    return false
  } catch (error) {
    return false
  }
}

export async function handleAnalyticsUserJoined(client: Client, message: any, room: VLMScene) {
  // Logic for analytics_user_joined message
  try {
    const { user } = message
    room.state.needsUpdate.push(user.sk)
    console.log('Analytics User Joined: ', user.displayName, user.connectedWallet)
    return true
  } catch (error) {
    return false
  }
}

export function handleSendActiveUsers(client: Client, message: any, room: VLMScene) {
  // Logic for send_active_users message
  try {
    const { user, session } = message

    let activeUsers = room.clients.map((c) => {
      if (c.auth) {
        const { displayName } = c.auth.user,
          { connectedWallet } = c.auth.session,
          host = c.auth.session.host || c.auth.session.pk === User.Session.Config.pk
        return { displayName, connectedWallet, host }
      } else if (c.sessionId === client.sessionId) {
        const { displayName } = user,
          { connectedWallet } = session,
          host = session.host || session.pk === User.Session.Config.pk
        if (!user.hasConnectedWeb3) {
          session.connectedWallet = 'Guest'
        }
        return { displayName, connectedWallet, host }
      } else {
        return { displayName: 'Unauthenticated User', connectedWallet: 'N/A', host: false }
      }
    })

    if (message.clientLeftScene) {
      activeUsers = activeUsers.filter((activeUser) => activeUser.connectedWallet !== user.connectedWallet)
    }

    room.clients.forEach((roomClient) => {
      if (roomClient.auth.session.pk === User.Session.Config.pk) {
        roomClient.send('send_active_users', { activeUsers })
      }
    })
    return false
  } catch (error) {
    return false
  }
}

export async function handleUserMessage(client: Client, message: any, room: VLMScene) {
  try {
    const { sessionToken } = message
    const { sceneId } = client.auth.session
    let { user } = client.auth.user
    if (!user) {
      user = await AnalyticsManager.getUserById(client.auth.session.userId)
    }
    console.log(`Received message from ${JSON.stringify(user?.displayName)} in ${sceneId} - ${message.id} - ${message.data}`)
    await analyticsAuthMiddleware(client, { sessionToken, sceneId }, async ({ session, user }) => {
      message.from = session.connectedWallet
      message.fromDisplayName = user?.displayName
      const sterileMessage = { from: session.connectedWallet, fromDisplayName: user?.displayName, id: message.id, data: message.data }
      room.clients.forEach((c) => {
        if (c.auth.sceneId === sceneId || client.auth.session.sceneId === sceneId) c.send('user_message', sterileMessage)
      })
      return true
    })
  } catch (error) {
    return false
  }
}

export async function handleGetUserState(client: Client, message: any, room: VLMScene) {
  try {
    const { sessionToken } = message
    const { sceneId } = client.auth.session
    let { user } = client.auth.user
    if (!user) {
      user = await AnalyticsManager.getUserById(client.auth.session.userId)
    }
    console.log(`Received message from ${JSON.stringify(user?.displayName)} in ${sceneId} - ${message.id} - ${message.data}`)
    await analyticsAuthMiddleware(client, { sessionToken, sceneId }, async (session) => {
      const userState = await SceneManager.getUserStateByScene(sceneId, message.key)
      room.clients.forEach((c) => {
        if (c.auth.sceneId === sceneId || client.auth.session.sceneId === sceneId) c.send('get_user_state_response', userState)
      })
      return false
    })
  } catch (error) {
    return false
  }
}

export async function handleSetUserState(client: Client, message: any, room: VLMScene) {
  try {
    const { sessionToken } = message
    const { sceneId } = client.auth.session
    let { user } = client.auth.user
    if (!user) {
      user = await AnalyticsManager.getUserById(client.auth.session.userId)
    }
    console.log(`Received message from ${JSON.stringify(user?.displayName)} in ${sceneId} - ${message.id} - ${message.data}`)
    await analyticsAuthMiddleware(client, { sessionToken, sceneId }, async (session) => {
      const userState = await SceneManager.setUserStateByScene(sceneId, message.key, message.value)
      room.clients.forEach((c) => {
        if (c.auth.sceneId === sceneId || client.auth.session.sceneId === sceneId) c.send('set_user_state_response', userState)
      })
      return false
    })
  } catch (error) {
    return false
  }
}

export async function handlePathStart(client: Client, message: any, room: VLMScene) {
  try {
    const path = await SessionManager.createSessionPath(message.session)
    client.send('path_started', { action: 'path_started', pathId: path.sk })
    return false
  } catch (error) {
    return false
  }
}

export async function handlePathAddSegments(client: Client, message: { pathId: string; pathSegments: Analytics.PathSegment[] }, room: VLMScene) {
  try {
    if (client.auth.session.environment !== 'prod') {
      return false
    }
    const { added, total } = await SessionManager.extendPath(message.pathId, message.pathSegments)
    client.send('path_segments_added', { action: 'path_segments_added', pathId: message.pathId, added, total })
    return false
  } catch (error) {
    return false
  }
}

export function handlePathUpdate(client: Client, message: any, room: VLMScene) {
  // Logic for path_update message
  try {
    return false
  } catch (error) {
    return false
  }
}

export function handlePathResume(client: Client, message: any, room: VLMScene) {
  // Logic for path_resume message
  try {
    return false
  } catch (error) {
    return false
  }
}

export function handlePathIdle(client: Client, message: any, room: VLMScene) {
  // Logic for path_idle message
  try {
    return false
  } catch (error) {
    return false
  }
}

export function handlePathEnd(client: Client, message: any, room: VLMScene) {
  // Logic for path_end message
  try {
    return false
  } catch (error) {
    return false
  }
}

export function handleSceneCreate(client: Client, message: any, room: VLMScene) {
  // Logic for scene_create message
  try {
    return false
  } catch (error) {
    return false
  }
}

export async function handleSceneElementUpdate(client: Client, message: any, room: VLMScene) {
  // Logic for scene_element_update message
  try {
    await SceneElementManager.quickUpdateSceneElement(message)
    return true
  } catch (error) {
    return false
  }
}

export async function handleSceneLoadRequest(client: Client, message: { sceneId: string; scene?: Scene.Config }, room: VLMScene) {
  // Logic for scene_load message
  try {
    let dbScene = await SceneManager.loadScene(message.sceneId),
      activePreset

    if (!dbScene) {
      console.log('Scene not found: ', message.sceneId)
    } else {
      activePreset = dbScene.presets.find((preset: Scene.Preset) => preset.sk === dbScene.scenePreset)
    }
    if (!activePreset) {
      client.send('scene_load_response', { ...message.scene, ...dbScene, error: 'No active preset.' })
      return
    }

    client.send('scene_load_response', { ...message.scene, ...dbScene })
    return false
  } catch (error) {
    return false
  }
}

export async function handleSceneAddPresetRequest(client: Client, message: { scene?: Scene.Config }, room: Room) {
  // Logic for scene_add_preset_request message
  try {
    const { user } = client.auth
    const { scene, preset } = await ScenePresetManager.addPresetToScene(message.scene)
    HistoryManager.addUpdate(client.auth.user, client.auth.sceneId, { action: 'created', element: 'scene', property: 'preset' }, message.scene)
    client.send('scene_add_preset_response', { user, scene, preset })
    return false
  } catch (error) {
    return false
  }
}

export async function handleSceneClonePresetRequest(client: Client, message: { presetId: string; scene?: Scene.Config }, room: Room) {
  // Logic for scene_clone_preset_request message
  try {
    const { user } = client.auth
    const { scene, preset } = await ScenePresetManager.clonePreset(message.scene, message.presetId)
    HistoryManager.addUpdate(
      client.auth.user,
      client.auth.session.sceneId,
      { action: 'cloned', element: 'scene', property: 'preset', id: message.presetId },
      message.scene
    )
    client.send('scene_clone_preset_response', { user, scene, preset, presetId: message.presetId })
    return false
  } catch (error) {
    return false
  }
}

export async function handleSceneChangePreset(client: Client, message: VLMSceneMessage, room: Room) {
  // Logic for scene_change_preset message
  try {
    const { user } = client.auth
    const existingScene = await SceneManager.getSceneById(message.sceneData.sk)
    const scene = await SceneManager.changeScenePreset(message.sceneData, message.id)
    let preset = existingScene.presets.find((scenePreset: Scene.Preset | string) => {
      if (typeof scenePreset === 'string') {
        return scenePreset === message.id
      } else {
        return scenePreset.sk === message.id
      }
    })
    if (typeof preset === 'string') {
      preset = await ScenePresetManager.getScenePresetById(preset)
    }
    HistoryManager.addUpdate(
      client.auth.user,
      client.auth.session.sceneId,
      { action: 'updated', element: 'scene', property: 'preset', from: message.sceneData.scenePreset, to: preset.sk },
      scene
    )
    room.broadcast('scene_change_preset', { user, scene, preset })
    return false
  } catch (error) {
    return false
  }
}

export async function handleSceneDeletePresetRequest(client: Client, message: { sceneId?: string; presetId: string }, room: Room) {
  // Logic for scene_delete_preset_request message
  try {
    const { user } = client.auth
    const scene = await ScenePresetManager.deleteScenePreset(message.sceneId, message.presetId)
    HistoryManager.addUpdate(
      client.auth.user,
      client.auth.session.sceneId,
      { action: 'deleted', element: 'scene', property: 'preset', id: message.presetId },
      scene
    )
    client.send('scene_delete_preset_response', { user, scene: scene, presetId: message.presetId })
    return false
  } catch (error) {
    return false
  }
}

export async function handlePresetUpdate(client: Client, message: VLMSceneMessage, room: VLMScene) {
  // Logic for scene_preset_update message
  try {
    let presetResponse
    if (message.instance) {
      switch (message.action) {
        case 'create':
          presetResponse = await SceneElementManager.addInstanceToElement(message)
          break
        case 'update':
          presetResponse = await SceneElementManager.updateInstance(message)
          break
        case 'delete':
          presetResponse = await SceneElementManager.removeInstanceFromElement(message)
          break
      }
    } else {
      switch (message.action) {
        case 'create':
          presetResponse = await SceneElementManager.createSceneElement(message)
          break
        case 'update':
          presetResponse = await SceneElementManager.updateSceneElement(message)
          break
        case 'delete':
          presetResponse = await SceneElementManager.removeSceneElement(message)
          break
      }
    }
    if (presetResponse) {
      message.scenePreset = await ScenePresetManager.buildScenePreset(presetResponse.scenePreset)
    }

    if (message.element === 'video' && message.elementData.instances.length > 0) {
      const filteredPresetVideos = room.state.streams.filter((stream: SceneStream) => stream.presetId !== message.scenePreset.sk)
      const presetVideos = message.scenePreset.videos as Scene.Video.Config[]
      room.state.streams.length = 0
      room.state.streams.push(...filteredPresetVideos)

      const videoPromises = presetVideos.map(async (video: Scene.Video.Config) => {
        if (!video.liveSrc || !video.enableLiveStream || !video.enabled) return null
        message.elementData = new Scene.Video.Config(message.elementData)
        video.isLive = await room.isStreamLive(video.liveSrc)
        message.elementData.isLive = video.isLive
        const stream = new SceneStream({ sk: video.sk, url: video.liveSrc, status: video.isLive, presetId: message.scenePreset.sk })
        room.state.streams.push(stream)
      })

      await Promise.all(videoPromises)
    }

    message.user = (({ displayName, sk, connectedWallet }) => ({ displayName, sk, connectedWallet }))({ ...client.auth.session, ...client.auth.user })
    const historyAction = message.action === 'create' ? 'created' : message.action === 'update' ? 'updated' : 'deleted'
    const historyElement = message.instance ? `${message.element} instance` : message.element

    HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, {
      action: historyAction,
      element: historyElement || 'preset',
      id: message.id,
    })
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

export async function handleSettingUpdate(client: Client, message: VLMSceneMessage, room: Room) {
  // Logic for scene_setting_update message
  try {
    let type
    switch (message.setting) {
      case 'moderation':
        type = Scene.SettingType.MODERATION
        break
      case 'access':
        type = Scene.SettingType.ACCESS
        break
      case 'interoperability':
        type = Scene.SettingType.INTEROPERABILITY
        break
      case 'localization':
        type = Scene.SettingType.LOCALIZATION
        break
    }
    const sceneSetting = new Scene.Setting({ sceneId: message.sceneData.sk, type, ...message.settingData })
    const scene = await SceneManager.getSceneById(message.sceneData.sk)
    if (scene.settings.includes(sceneSetting.sk)) {
      await SceneSettingsManager.updateSceneSetting(scene, sceneSetting)
      HistoryManager.addUpdate(
        client.auth.user,
        client.auth.session.sceneId,
        { action: 'updated', element: 'scene', property: `${message.setting} setting`, id: message.id },
        message.sceneData
      )
    } else {
      await SceneSettingsManager.addSettingsToScene(scene, [sceneSetting])
      HistoryManager.addUpdate(
        client.auth.user,
        client.auth.session.sceneId,
        { action: 'updated', element: 'scene', property: `${message.setting} setting`, id: message.id },
        message.sceneData
      )
    }
    message.user = (({ displayName, sk, connectedWallet }) => ({ displayName, sk, connectedWallet }))({ ...client.auth.session, ...client.auth.user })
    return true
  } catch (error) {
    return false
  }
}

export function handleSceneDelete(client: Client, message: any, room: Room) {
  // Logic for scene_delete message
  HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: 'deleted', element: 'scene', id: message.id })
  try {
    return false
  } catch (error) {
    return false
  }
}

export function handleModeratorMessage(client: Client, message: any, room: Room) {
  try {
    // Logic for scene_moderator_message message
    console.log('Moderator Message: ', message)
    HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: 'sent', element: 'moderator message', message })
    return true
  } catch (error) {
    return false
  }
}

export function handleModeratorCrash(client: Client, message: { connectedWallet: string; displayName: string }, room: Room) {
  // Logic for scene_moderator_crash message
  let property
  if (message.connectedWallet && message.displayName) {
    property = `${message.displayName}(${message.connectedWallet})`
  } else if (message.displayName) {
    property = message.displayName
  } else if (message.connectedWallet) {
    property = message.connectedWallet
  }

  HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: 'nuked', element: 'user', property, message })
  try {
    return true
  } catch (error) {
    return false
  }
}

export function handleSceneVideoUpdate(client: Client, message: any, room: VLMScene) {
  // Logic for scene_video_update message
  try {
    if (message.reason == 'url_changed') {
      room.state.streams = room.state.streams.filter((stream: SceneStream) => stream.sk !== message.instanceData.sk)
    }
    return false
  } catch (error) {
    return false
  }
}

export async function handleToggleSoundLocators(client: Client, message: any, room: VLMScene) {
  // Logic for scene_video_update message
  const wallet = client.auth.user.connectedWallet || client.auth.session.connectedWallet
  const analyticsUser = await AnalyticsManager.obtainUserByWallet({ address: wallet }, client.auth.user)
  message.user = analyticsUser
  try {
    return true
  } catch (error) {
    return false
  }
}

export async function handleGiveawayClaim(
  client: Client,
  message: { sk: string; giveawayId: string; sceneId: string; sessionToken: string },
  room: VLMScene
) {
  // Logic for giveaway_claim message
  try {
    await analyticsAuthMiddleware(client, { sessionToken: message.sessionToken, sceneId: message.sceneId }, async ({ session, user }) => {
      if (!session || !user) {
        client.send('giveaway_claim_response', { responseType: Giveaway.ClaimResponseType.CLAIM_DENIED, reason: Giveaway.ClaimRejection.INAUTHENTIC })
        return false
      }

      const { responseType, reason } = await GiveawayManager.claimGiveawayItem({
        session,
        user,
        sceneId: client.auth.session.sceneId,
        giveawayId: message.giveawayId,
      })
      client.send('giveaway_claim_response', { responseType, reason, giveawayId: message.giveawayId, sk: message.sk })
    })
    return false
  } catch (error) {
    client.send('giveaway_claim_response', {
      responseType: Giveaway.ClaimResponseType.CLAIM_SERVER_ERROR,
      error,
      giveawayId: message.giveawayId,
      sk: message.sk,
    })

    return false
  }
}

export async function handleRequestPlayerPosition(client: Client, message: { userId?: string; connectedWallet?: string }, room: VLMScene) {
  // Logic for request_player_position message
  try {
    const inWorldUser = room.clients.find((c) => c.auth.session.pk == Analytics.Session.Config.pk)
    // const inWorldUser = room.clients.find((c) => c.auth.session.pk === Analytics.Session.Config.pk && c.auth.user.sk === message.userId || c.auth.user.connectedWallet === message.connectedWallet);
    if (inWorldUser) {
      inWorldUser.send('request_player_position', message)
    } else {
      client.send('send_player_position', null)
    }
    return false
  } catch (error) {
    return false
  }
}

export async function handleSendPlayerPosition(client: Client, message: { userId?: string; connectedWallet?: string }, room: VLMScene) {
  // Logic for send_player_position message
  try {
    room.clients.forEach((c) => {
      c.send('send_player_position', message)
    })
    room.clients
      .find(
        (c) =>
          (c.auth.session.pk === User.Session.Config.pk && c.auth.user.sk === message.userId) ||
          c.auth.user.connectedWallet === message.connectedWallet
      )
      ?.send('send_player_position')
    return false
  } catch (error) {
    return false
  }
}

export async function handleAdminAccessSetting(
  client: Client,
  message: { userId?: string; connectedWallet?: string; sceneId: string; adminAccess: boolean },
  room: VLMScene
) {
  // Logic for set_admin_access message
  try {
    const { userId, connectedWallet, sceneId, adminAccess } = message
    const scene = await SceneManager.getSceneById(sceneId),
      sceneSettings = await SceneSettingsManager.getSceneSettingsByIds(scene.settings),
      accessSetting = sceneSettings.find((setting: Scene.Setting) => setting.type === Scene.SettingType.ACCESS)

    if (!accessSetting) {
      //create access setting
      const newAccessSetting = new Scene.Setting({
        type: Scene.SettingType.ACCESS,
        sceneId,
        settingName: 'VLM Admin Access',
        settingValue: adminAccess,
      })
      await SceneSettingsManager.addSettingsToScene(scene, newAccessSetting)
    } else {
      //update access setting
      accessSetting.settingValue = adminAccess
      await SceneSettingsManager.updateSceneSetting(scene, accessSetting)
    }

    const inWorldUser = room.clients.find(
      (c) => (c.auth.session.pk === User.Session.Config.pk && c.auth.user.sk === userId) || c.auth.user.connectedWallet === connectedWallet
    )
    if (inWorldUser) {
      inWorldUser.send('set_admin_access', { sceneId, adminAccess })
    }

    return false
  } catch (error) {
    return false
  }
}
