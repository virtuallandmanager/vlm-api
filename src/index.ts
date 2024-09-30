import { RedisPresence, RedisDriver } from 'colyseus'
import { Server } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { VLMScene } from './ws/rooms/VLMScene'
import * as dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/.env' })
import app from './app'

const port = Number(process.env.PORT || 3010)
console.log(`
░█░█░▀█▀░█▀▄░▀█▀░█░█░█▀█░█░░░░░█░░░█▀█░█▀█░█▀▄░░░█▄█░█▀█░█▀█░█▀█░█▀▀░█▀▀░█▀▄
░▀▄▀░░█░░█▀▄░░█░░█░█░█▀█░█░░░░░█░░░█▀█░█░█░█░█░░░█░█░█▀█░█░█░█▀█░█░█░█▀▀░█▀▄
░░▀░░▀▀▀░▀░▀░░▀░░▀▀▀░▀░▀░▀▀▀░░░▀▀▀░▀░▀░▀░▀░▀▀░░░░▀░▀░▀░▀░▀░▀░▀░▀░▀▀▀░▀▀▀░▀░▀
`)
console.log(`------------------------------------------------------------------------------`)
console.log(`|                  Version 0.1.0 - Saturn Comes Back Around                   |`)
console.log(`------------------------------------------------------------------------------`)
console.log(`//////////////////////// STARTING API ON PORT ${port} ////////////////////////`)
console.log(`//////////////////////////// ${process.env.NODE_ENV.toUpperCase()} MODE ////////////////////////////`)

const server = app.listen(app.get('port'), () => {
  console.log(`/////////////////////////////////////////////////////////////////////////`)
  console.log('///////////////////////////// - HTTPS API - ////////////////////////////')
  console.log(`////////////////////////// Running on port ${port} ///////////////////////`)
  console.log(`////////////////////////// Public IP: ${process.env.PUBLIC_IP} ///////////////////////`)
  console.log(`//////////////////////////////////////////////////////////////////////`)

  if (process.env.NODE_ENV !== 'development') {
    console.log(`/////////////////////////////// - PRESENCE SERVER - /////////////////////////////`)
    console.log(`///////////////////// Connected to ${process.env.PRESENCE_SERVER_HOST}:${process.env.PRESENCE_SERVER_PORT} ///////////////////`)
    console.log(`///////////////////////////////////////////////////////////////////////`)
  }
  console.log('///////////////////////// Press CTRL-C to stop //////////////////////')
})

let gameServer: Server
const presenceServer = { host: process.env.PRESENCE_SERVER_HOST, port: Number(process.env.PRESENCE_SERVER_PORT) }

if (process.env.NODE_ENV !== 'production') {
  gameServer = new Server({
    transport: new WebSocketTransport({
      server,
      maxPayload: 100 * 1024 * 1024, // 10 MB
      pingMaxRetries: 10,
    }),
    presence: new RedisPresence(presenceServer),
    driver: new RedisDriver(presenceServer),
  })
} else {
  gameServer = new Server({
    transport: new WebSocketTransport({
      server,
      maxPayload: 100 * 1024 * 1024, // 100 MB
      pingMaxRetries: 10,
    }),
    presence: new RedisPresence(presenceServer),
    driver: new RedisDriver(presenceServer),
    publicAddress: process.env.PUBLIC_IP,
  })
}

gameServer.define('vlm_scene', VLMScene).filterBy(['sceneId'])
