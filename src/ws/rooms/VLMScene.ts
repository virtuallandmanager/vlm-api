import { Client, Room } from 'colyseus'
import axios from 'axios'
import { SessionManager } from '../../logic/Session.logic'
import { Analytics } from '../../models/Analytics.model'
import { User } from '../../models/User.model'
import { UserManager } from '../../logic/User.logic'
import { analyticsAuthMiddleware, userAuthMiddleware } from '../../middlewares/security/auth'
import { bindEvents, handleAnalyticsUserJoined, handleHostJoined, handleSendActiveUsers, handleSessionEnd } from './events/VLMScene.events'
import { Session } from '../../models/Session.model'
import { SceneStream, VLMSceneState } from './schema/VLMSceneState'
import { ArraySchema } from '@colyseus/schema'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import https from 'https'
import { SceneManager } from '../../logic/Scene.logic'
import { Scene } from '../../models/Scene.model'

export class VLMScene extends Room<VLMSceneState> {
  async onCreate(options: any) {
    try {
      bindEvents(this)
      const scene: Scene.Config = await SceneManager.getSceneById(options.sceneId)
      this.setMetadata({ sceneId: scene.sk, name: scene.name, locations: [], worlds: [] })
      this.setState(new VLMSceneState(scene))
      this.setSimulationInterval((deltaTime) => this.checkStateOfStreams(), 1000)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'VLMScene.onCreate' })
    }
  }

  removeDuplicates(arr: ArraySchema<SceneStream>) {
    // Use a Set to store unique 'sk' values.
    const skSet = new Set()
    const result = new ArraySchema<SceneStream>()

    for (let obj of arr) {
      // If the 'sk' value is already in the Set, skip this object.
      if (skSet.has(obj.sk)) {
        continue
      }

      // Add the 'sk' value to the Set and push the object to the result array.
      skSet.add(obj.sk)
      result.push(obj)
    }

    return result
  }

  async checkStateOfStreams() {
    // Checks the status of the video streams, running once every second
    if (this.state.streams.length === 0) {
      return
    } else if (this.state.streams.length <= 4 && this.state.skipped >= 2) {
      // If there are 4 or fewer streams, and two checks have been skipped, check all streams
      this.state.batchSize = this.state.streams.length
      this.state.skipped = 0
    } else if (this.state.streams.length <= 4 && this.state.skipped < 2) {
      // If there are 4 or fewer streams and less than two checks have been skipped, skip this check
      // This limits stream status checks to once every 3 seconds.
      this.state.skipped += 1
      return
    } else if (this.state.streams.length <= 50) {
      // Gradually increase batch size from 1 to 10 as the number of streams goes from 5 to 50
      this.state.batchSize = Math.ceil((this.state.streams.length / (100 - 4)) * (20 - 1) + 1)
    } else {
      AdminLogManager.logErrorToDiscord(`There are more than 50 streams in scene ${this.state.sceneId}. Warn scene owner of performance issues.`)
      return
    }

    this.state.streams = this.removeDuplicates(this.state.streams)
    console.log(`--- Checking Streams ---`)
    console.log(`${this.state.streams.map((stream) => `${stream.url} - ${stream.status} - ${this.state.sceneId}`).join('\n ')}`)

    if (this.state.streamIndex >= this.state.streams.length) {
      this.state.streamIndex = 0
    }

    const streams = this.state.streams.slice(this.state.streamIndex, this.state.streamIndex + this.state.batchSize)

    for (const stream of streams) {
      const streamStatus = stream.status
      const status = await this.isStreamLive(stream.url)

      // If the status has changed, update it and notify all clients
      if (status !== streamStatus) {
        stream.status = status

        // Send a message to everyone in the room
        this.broadcast('scene_video_status', { sk: stream.sk, status, url: stream.url })
      } else if (this.state.needsUpdate.length <= 0) {
        return
      }

      // send updates to any clients that need an updated video status
      this.state.needsUpdate.forEach((id, i) => {
        const clientNeedingUpdate = this.clients.find((client) => client.auth?.user?.sk === id),
          userId = clientNeedingUpdate?.auth?.user?.sk,
          needsUpdate = this.state.needsUpdate.includes(userId)

        if (userId && needsUpdate) {
          clientNeedingUpdate.send('scene_video_status', { sk: stream.sk, status, url: stream.url })
        }

        this.state.needsUpdate.splice(i, 1)
      })
    }
    this.state.streamIndex += this.state.batchSize
  }

  async onAuth(client: Client, sessionConfig: Session.Config) {
    const { sessionToken, refreshToken, sceneId } = sessionConfig
    try {
      let auth: { session: Partial<Analytics.Session.Config | Session.Config>; user: Partial<User.Account> } = {
        session: sessionConfig,
        user: {},
      }

      if (sessionConfig.pk == Analytics.Session.Config.pk && sessionConfig.sceneId == this.metadata.sceneId) {
        await analyticsAuthMiddleware(client, { sessionToken, sceneId }, ({ session, user }) => {
          auth.session = session
          auth.user = user
          if (!auth.session || !auth.user) {
            AdminLogManager.logErrorToDiscord('Analytics user not found - client kicked' + JSON.stringify(client))
            client.leave()
            return
          }
        })
        const response = await this.connectAnalyticsUser(client, { ...auth.session, ...sessionConfig }, auth.user)
        auth.session = response.session
      } else if (sessionConfig.host) {
        await userAuthMiddleware(client, { sessionToken, refreshToken, sceneId }, ({ session, user }) => {
          auth.session = session
          auth.user = user
          if (!auth.session || !auth.user) {
            AdminLogManager.logErrorToDiscord('Host user not found - client kicked' + JSON.stringify(client))
            client.leave()
            return
          }
          auth.session.sceneId = sessionConfig.sceneId
        })
        const user = await this.connectHostUser(client, auth.session)
        if (user) {
          auth.user = user
        }
      } else {
        AdminLogManager.logError('Invalid session type detected', { sessionConfig })
      }
      client.auth = auth

      return auth
    } catch (error) {
      AdminLogManager.logError({ error, client }, { from: 'VLMScene.onAuth' })
    }
  }

  async onJoin(client: Client, sessionConfig: Session.Config, auth: { session: Session.Config; user: User.Account | User.Account; sceneId: string }) {
    handleSendActiveUsers(client, { user: auth?.user, session: auth?.session }, this)
    console.log(auth?.user?.displayName || 'Unknown User', 'joined!')
  }

  async connectAnalyticsUser(client: Client, sessionConfig: Partial<Analytics.Session.Config>, userConfig: Partial<User.Account>) {
    try {
      const session = await SessionManager.initAnalyticsSession(sessionConfig)
      console.log(
        `${userConfig?.displayName} joined in ${sessionConfig.location.world || 'world'} at ${sessionConfig.location.location} - ${client.sessionId}.`
      )
      await handleAnalyticsUserJoined(client, { session, user: userConfig }, this)
      return { session }
    } catch (error) {
      AdminLogManager.logError(error, { from: 'VLMScene.connectAnalyticsUser' })
    }
  }

  async connectHostUser(client: Client, session: Partial<User.Session.Config>) {
    if (session?.userId) {
      const user = await UserManager.getById(session.userId)
      await handleHostJoined(client, { session, user }, this)
      return user
    } else {
      AdminLogManager.logErrorToDiscord('Host user not found - client kicked' + JSON.stringify(client))
      client.leave()
    }
  }

  async getHlsContent(url: string): Promise<boolean> {
    try {
      if (!url) {
        return
      }
      const agent = new https.Agent({
        rejectUnauthorized: false,
      })
      const response = await axios.get(url, { httpsAgent: agent })
      if (response.status === 200) {
        return true
      } else {
        AdminLogManager.logInfo('Received non-200 success status', {
          url,
          streams: JSON.stringify(this.state.streams),
          totalClients: this.clients.length,
          clients: this.clients,
          response: JSON.stringify(response),
        })
        return false
      }
    } catch (error: any) {
      if (error.response && error.response.status == 403) {
        this.state.streams = this.state.streams.filter((stream) => stream.url !== url)
        const clientAuths = this.clients.map((client) => client.auth)
        try {
          const log = await AdminLogManager.logWarning('Received 403 Forbidden error from HLS stream.', {
            url,
            streams: JSON.stringify(this.state.streams),
            totalClients: this.clients.length,
            clients: clientAuths,
            error: JSON.stringify(error),
          })
          return false
        } catch (error) {
          return false
        }
      } else if (error.response && error.response.status === 404) {
        return false
      } else {
        return false
      }
    }
  }

  async isStreamLive(url: string): Promise<boolean> {
    try {
      const content = await this.getHlsContent(url)
      if (content) {
        return true
      } else {
        return false
      }
    } catch (error: any) {
      return false
    }
  }

  async onLeave(client: Client) {
    try {
      if (client?.auth && !client?.auth?.user) {
        client.auth.user = await UserManager.getById(client.auth.session.userId)
      }
      handleSendActiveUsers(client, { user: client.auth?.user, session: client.auth?.session, clientLeftScene: true }, this)
      console.log(client.auth?.user?.displayName || 'Unknown User', 'left!')
      await handleSessionEnd(client, null, this)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'VLMScene.onLeave' })
    }
  }
}
