import { RedisPresence, RedisDriver } from 'colyseus'
import { Server } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { VLMScene } from './ws/rooms/VLMScene'
import * as dotenv from 'dotenv'
import * as net from 'net'
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
  console.log(`//////////////////////////////////////////////////////////////////////`)

  if (process.env.NODE_ENV !== 'development') {
    console.log(`/////////////////////////////// - PRESENCE SERVER - /////////////////////////////`)
    console.log(`///////////////////// Connected to ${process.env.PRESENCE_SERVER_HOST}:${process.env.PRESENCE_SERVER_PORT} ///////////////////`)
    console.log(`///////////////////////////////////////////////////////////////////////`)
  }
  console.log('///////////////////////// Press CTRL-C to stop //////////////////////')
})

let gameServer: Server

if (process.env.NODE_ENV !== 'production') {
  gameServer = new Server({
    transport: new WebSocketTransport({
      server,
      maxPayload: 10 * 1024 * 1024, // 10 MB
    }),
  })
} else {
  const presenceServer = { host: process.env.PRESENCE_SERVER_HOST, port: Number(process.env.PRESENCE_SERVER_PORT) }
  gameServer = new Server({
    transport: new WebSocketTransport({
      server,
      maxPayload: 10 * 1024 * 1024, // 10 MB
    }),
    presence: new RedisPresence(presenceServer),
    driver: new RedisDriver(presenceServer),
    publicAddress: process.env.PUBLIC_IP,
  })
}

gameServer.define('vlm_scene', VLMScene).filterBy(['sceneId'])
