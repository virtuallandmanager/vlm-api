import { Client, Room } from "colyseus";
import { VLMScene } from "../VLMScene";
import { SessionManager } from "../../../logic/Session.logic";
import { SceneManager } from "../../../logic/Scene.logic";
import { Scene } from "../../../models/Scene.model";
import { Analytics } from "../../../models/Analytics.model";
import { User } from "../../../models/User.model";
import { ScenePresetManager } from "../../../logic/ScenePreset.logic";
import { SceneElementManager } from "../../../logic/SceneElement.logic";
import { analyticsAuthMiddleware } from "../../../middlewares/security/auth";
import { AdminLogManager } from "../../../logic/ErrorLogging.logic";
import { SceneStream } from "../schema/VLMSceneState";
import { HistoryManager } from "../../../logic/History.logic";
import { Metaverse } from "../../../models/Metaverse.model";

type ElementName = "image" | "video" | "nft" | "sound" | "widget";
type Action = "init" | "create" | "update" | "delete" | "trigger";
type Settings = "moderation";
type Property = "enabled" | "liveLink" | "imageSrc" | "enableLiveStream" | "playlist" | "volume" | "emission" | "offType" | "offImage" | "transform" | "collider" | "parent" | "customId" | "clickEvent" | "transparency" | "contactAddres" | "tokenId";
export type VLMSceneElement = Scene.Image.Config | Scene.NFT.Config | Scene.Sound.Config | Scene.Video.Config;
export type VLMSceneElementInstance = Scene.Image.Instance & Scene.NFT.Instance & Scene.Sound.Instance & Scene.Video.Instance;

export class VLMSceneMessage {
  action: Action;
  property?: Property;
  id?: string;
  element: ElementName;
  instance: boolean;
  setting: Settings;
  elementData?: VLMSceneElement;
  instanceData?: VLMSceneElementInstance;
  settingData?: Scene.Setting;
  scenePreset: Scene.Preset;
  sceneData: Scene.Config;
  user: User.Account;
  stage: "pre" | "post";

  constructor(message: VLMSceneMessage) {
    this.action = message.action;
    this.property = message.property;
    this.id = message.id;
    this.element = message.element;
    this.instance = message.instance;
    this.setting = message.setting;
    this.elementData = message.elementData;
    this.instanceData = message.instanceData;
    this.settingData = message.settingData;
    this.scenePreset = message.scenePreset;
  }
}

export function bindEvents(room: VLMScene) {
  type EventHandler = (client: Client, message: any, room: VLMScene) => Promise<boolean> | boolean;

  const eventHandlers: Record<string, EventHandler> = {
    session_start: handleSessionStart,
    session_action: handleSessionAction,
    session_end: handleSessionEnd,

    host_joined: handleHostJoined,
    host_left: handleHostLeft,

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

    scene_preset_update: handlePresetUpdate,
    scene_video_update: handleSceneVideoUpdate,
    scene_sound_locator: handleToggleSoundLocators,
  };

  Object.keys(eventHandlers).forEach((eventType) => {
    room.onMessage(eventType, async (client: Client, message: any) => {
      if (eventHandlers.hasOwnProperty(eventType)) {
        const handler = eventHandlers[eventType];
        const broadcast = await handler(client, message, room);
        if (broadcast) {
          const { sceneId } = client.auth;
          room.clients.forEach((roomClient) => {
            if (roomClient.auth.sceneId == sceneId) {
              roomClient.send(eventType, message);
            }
          });
        }
      } else {
        // Handle unrecognized message types
      }
    });
  });
}

// THE TRUE OR FALSE IN THESE EVENT HANDLERS DETERMINES WHETHER THE MESSAGE GETS BROADCAST TO THE REST OF THE ROOM
// IF FALSE THEN IT IS ONLY ACTED UPON BY THE SERVER
async function handleSessionStart(client: Client, sessionConfig: Analytics.Session.Config, room: VLMScene) {
  try {
    const { sessionToken, sceneId } = sessionConfig;

    await analyticsAuthMiddleware(client, { sessionToken, sceneId }, async (session) => {
      client.auth = { session, user: {} };
      let dbSession = await SessionManager.startAnalyticsSession({
          ...sessionConfig,
          sk: client.auth.sessionId,
        }),
        worldLocation = session.worldLocation,
        scene = await SceneManager.obtainScene(new Scene.Config({ sk: sceneId, locations: [worldLocation] })),
        scenePreset;

      const worldHasBeenAdded = scene?.locations && scene.locations.indexOf((location: Metaverse.Location) => location == worldLocation) > -1;

      if (scene && !worldHasBeenAdded) {
        await SceneManager.updateSceneProperty({ scene, prop: "locations", val: [...scene.locations, worldLocation] });
      } else if (scene && (!scene.locations || scene.locations.length == 0)) {
        await SceneManager.updateSceneProperty({ scene, prop: "locations", val: [worldLocation] });
      }

      client.send("session_started", { session: dbSession });

      if (scene?.scenePreset) {
        scenePreset = await ScenePresetManager.getScenePresetById(scene.scenePreset);
        scenePreset = await ScenePresetManager.buildScenePreset(scenePreset, { skToId: true });

        client.send("scene_preset_update", { action: "init", scenePreset });

        for (let i = 0; i < scenePreset.videos.length; i++) {
          const video = scenePreset.videos[i];
          if (room.state.streams.find((stream) => stream.sk == video.sk)) {
            return;
          } else {
            const status = await room.isStreamLive(video.liveLink),
              stream = new SceneStream({ sk: video.sk, url: video.liveLink, status, sceneId });
            client.send("scene_video_status", stream);
            room.state.streams.push(stream);
          }
        }
      }
    });
    return false;
  } catch (error) {
    return false;
  }
}

async function handleSessionAction(client: Client, message: { action: string; metadata: any; pathPoint: Analytics.PathPoint; sessionToken: string }, room: VLMScene) {
  try {
    const { action, metadata, pathPoint, sessionToken } = message,
      { session } = client.auth,
      { sceneId } = session;

    await analyticsAuthMiddleware(client, { sessionToken, sceneId }, async () => {
      const response = await SessionManager.logAnalyticsAction({ action, metadata, pathPoint, sessionId: session.sk });
      if (!response) {
        AdminLogManager.logError("Failed to log analytics action", { ...message, ...client.auth });
      }
    });
    return false;
  } catch (error) {
    AdminLogManager.logError("Failed to log analytics action - UNAUTHENTICATED", { ...message, ...client.auth });
    return false;
  }
}

export async function handleSessionEnd(client: Client, message?: any, room?: VLMScene) {
  // Logic for session_end message
  try {
    const session = client.auth.session || message.session;

    if (session.pk == Analytics.Session.Config) {
      await SessionManager.endAnalyticsSession(session);
    } else if (session.pk == User.Session.Config.pk) {
      await SessionManager.endVLMSession(session);
    }

    // check for other clients with the same sceneId and remove the scene's videos from the cache if there are none
    const sceneClients = room.clients.filter((c) => c.auth.session.sceneId == session.sceneId && c.auth.user.sk != client.auth.user.sk);

    if (sceneClients.length < 1) {
      room.state.streams = room.state.streams.filter((stream) => stream.sceneId != session.sceneId);
    }

    return false;
  } catch (error) {
    return false;
  }
}

export function handleHostJoined(client: Client, message: any, room: VLMScene) {
  // Logic for host_joined message
  try {
    const { user } = client.auth;
    // Find the client who triggered the message
    const triggeringClient = room.clients.find((c) => c.sessionId === client.sessionId);

    // Iterate over all clients and send the message to each client except the triggering client
    room.clients.forEach((c) => {
      if (c !== triggeringClient) {
        c.send("host_joined");
      }
      HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "accessed scene in VLM" });
      console.log("Host User Joined: ", user.displayName, user.connectedWallet);
    });

    return false;
  } catch (error) {
    return false;
  }
}

export function handleHostLeft(client: Client, message: any, room: VLMScene) {
  // Logic for host_left message
  try {
    HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "left scene in VLM" });
    return false;
  } catch (error) {
    return false;
  }
}

export async function handlePathStart(client: Client, message: any, room: VLMScene) {
  try {
    const path = await SessionManager.createSessionPath(message.session);
    client.send("path_started", { pathId: path.sk });
    return false;
  } catch (error) {
    return false;
  }
}

export async function handlePathAddSegments(client: Client, message: { pathId: string; pathSegments: Analytics.PathSegment[] }, room: VLMScene) {
  try {
    const { added, total } = await SessionManager.extendPath(message.pathId, message.pathSegments);
    client.send("path_segments_added", { action: "path_segments_added", pathId: message.pathId, added, total });
    return false;
  } catch (error) {
    return false;
  }
}

export function handlePathUpdate(client: Client, message: any, room: VLMScene) {
  // Logic for path_update message
  try {
    return false;
  } catch (error) {
    return false;
  }
}

export function handlePathResume(client: Client, message: any, room: VLMScene) {
  // Logic for path_resume message
  try {
    return false;
  } catch (error) {
    return false;
  }
}

export function handlePathIdle(client: Client, message: any, room: VLMScene) {
  // Logic for path_idle message
  try {
    return false;
  } catch (error) {
    return false;
  }
}

export function handlePathEnd(client: Client, message: any, room: VLMScene) {
  // Logic for path_end message
  try {
    return false;
  } catch (error) {
    return false;
  }
}

export function handleSceneCreate(client: Client, message: any, room: VLMScene) {
  // Logic for scene_create message
  try {
    return false;
  } catch (error) {
    return false;
  }
}

export async function handleSceneLoadRequest(client: Client, message: { sceneId: string; scene?: Scene.Config }, room: VLMScene) {
  // Logic for scene_load message
  try {
    let dbScene = await SceneManager.loadScene(message.sceneId),
      activePreset;

    if (!dbScene) {
      console.log("Scene not found: ", message.sceneId);
    } else {
      activePreset = dbScene.presets.find((preset: Scene.Preset) => preset.sk === dbScene.scenePreset);
    }
    if (!activePreset) {
      client.send("scene_load_response", { ...message.scene, ...dbScene, error: "No active preset." });
      return;
    }

    client.send("scene_load_response", { ...message.scene, ...dbScene });
    return false;
  } catch (error) {
    return false;
  }
}

export async function handleSceneAddPresetRequest(client: Client, message: { scene?: Scene.Config }, room: Room) {
  // Logic for scene_add_preset_request message
  try {
    const { user } = client.auth;
    const { scene, preset } = await ScenePresetManager.addPresetToScene(message.scene);
    HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "create", element: "scene", property: "preset" }, message.scene);
    client.send("scene_add_preset_response", { user, scene, preset });
    return false;
  } catch (error) {
    return false;
  }
}

export async function handleSceneClonePresetRequest(client: Client, message: { presetId: string; scene?: Scene.Config }, room: Room) {
  // Logic for scene_clone_preset_request message
  try {
    const { user } = client.auth;
    const { scene, preset } = await ScenePresetManager.clonePreset(message.scene, message.presetId);
    HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "clone", element: "scene", property: "preset", id: message.presetId }, message.scene);
    client.send("scene_clone_preset_response", { user, scene, preset, presetId: message.presetId });
    return false;
  } catch (error) {
    return false;
  }
}

export async function handleSceneChangePreset(client: Client, message: VLMSceneMessage, room: Room) {
  // Logic for scene_change_preset message
  try {
    const { user } = client.auth;
    const scene = await SceneManager.changeScenePreset(message),
      preset = scene.presets.find((scenePreset: Scene.Preset) => scenePreset.sk == scene.scenePreset);
    HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "update", element: "scene", property: "preset", from: message.sceneData.scenePreset, to: preset.sk }, scene);
    room.broadcast("scene_change_preset", { user, scene, preset });
    return false;
  } catch (error) {
    return false;
  }
}

export async function handleSceneDeletePresetRequest(client: Client, message: { sceneId?: string; presetId: string }, room: Room) {
  // Logic for scene_delete_preset_request message
  try {
    const { user } = client.auth;
    const scene = await ScenePresetManager.deleteScenePreset(message.sceneId, message.presetId);
    HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "deleted", element: "scene", property: "preset", id: message.presetId }, scene);
    client.send("scene_delete_preset_response", { user, scene: scene, presetId: message.presetId });
    return false;
  } catch (error) {
    return false;
  }
}

export async function handlePresetUpdate(client: Client, message: VLMSceneMessage, room: Room) {
  // Logic for scene_preset_update message
  try {
    let presetResponse;
    if (message.instance) {
      switch (message.action) {
        case "create":
          presetResponse = await SceneElementManager.addInstanceToElement(message);
          break;
        case "update":
          presetResponse = await SceneElementManager.updateInstance(message);
          break;
        case "delete":
          presetResponse = await SceneElementManager.removeInstanceFromElement(message);
          break;
      }
    } else {
      switch (message.action) {
        case "create":
          presetResponse = await SceneElementManager.createSceneElement(message);
          break;
        case "update":
          presetResponse = await SceneElementManager.updateSceneElement(message);
          break;
        case "delete":
          presetResponse = await SceneElementManager.removeSceneElement(message);
          break;
      }
    }
    if (presetResponse) {
      message.scenePreset = await ScenePresetManager.buildScenePreset(presetResponse.scenePreset);
    }

    if (message.element === "video" && message.elementData.instances.length > 0) {
      room.state.streams = room.state.streams.filter((stream: SceneStream) => stream.sceneId !== message.sceneData.sk);
      const presetVideos = message.scenePreset.videos;

      presetVideos.forEach((video: Scene.Video.Config) => {
        const stream = new SceneStream({ sk: video.sk, url: video.liveLink, status: null, sceneId: client.auth.session.sceneId });
        room.state.streams.push(stream);
      });
    }

    message.user = (({ displayName, sk }) => ({ displayName, sk }))(client.auth.user);
    message.stage = "post";
    HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: message.action, element: message.element, property: message.property || "preset", id: message.id });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export function handleSceneDelete(client: Client, message: any, room: Room) {
  // Logic for scene_delete message
  HistoryManager.addUpdate(client.auth.user, client.auth.session.sceneId, { action: "delete", element: "scene", id: message.id });
  try {
    return false;
  } catch (error) {
    return false;
  }
}

export function handleSceneVideoUpdate(client: Client, message: any, room: VLMScene) {
  // Logic for scene_video_update message
  try {
    if (message.reason == "url_changed") {
      room.state.streams = room.state.streams.filter((stream: SceneStream) => stream.sk !== message.instanceData.sk);
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function handleToggleSoundLocators(client: Client, message: any, room: VLMScene) {
  // Logic for scene_video_update message
  try {
    return true;
  } catch (error) {
    return false;
  }
}
