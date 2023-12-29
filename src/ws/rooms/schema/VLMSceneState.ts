import { Schema, ArraySchema, MapSchema, type } from '@colyseus/schema'
import { Scene } from '../../../models/Scene.model'

export class SceneStream extends Schema {
  @type('string')
  sk: string

  @type('string')
  url: string

  @type('string')
  presetId: string

  @type('boolean')
  status: boolean
}

export class VLMSceneState extends Schema {
  @type('string')
  name: string
  @type('string')
  sceneId: string
  @type([SceneStream])
  streams = new ArraySchema<SceneStream>()
  @type('number')
  streamIndex = 0
  @type('number')
  skipped = 0
  @type('number')
  batchSize = 1
  @type(['string'])
  needsUpdate: string[] = []

  constructor(scene: Scene.Config) {
    super()
    this.name = scene.name
    this.sceneId = scene.sk
  }
}
