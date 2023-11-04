import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";

export class SceneStream extends Schema {
  @type("string")
  sk: string;

  @type("string")
  url: string;

  @type("string")
  presetId: string;

  @type("boolean")
  status: boolean;
}

export class VLMSceneState extends Schema {
  @type("string")
  sceneId: string;
  @type([SceneStream])
  streams = new ArraySchema<SceneStream>();
  @type("number")
  streamIndex = 0;
  @type("number")
  skipped = 0;
  @type("number")
  batchSize = 1;
  @type(["string"])
  needsUpdate: string[] = [];

  constructor(sceneId: string) {
    super();
    this.sceneId = sceneId;
  }
}
