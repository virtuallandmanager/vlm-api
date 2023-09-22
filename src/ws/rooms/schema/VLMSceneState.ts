import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";

export class SceneStream extends Schema {
  @type("string")
  sk: string;

  @type("string")
  url: string;

  @type("string")
  presetId: string;

  @type("string")
  sceneId: string;

  @type("boolean")
  status: boolean;
}

export class VLMSceneState extends Schema {
  @type([SceneStream])
  streams = new ArraySchema<SceneStream>();
  @type({ map: "string" })
  emotes = new MapSchema<string>();
  @type("number")
  streamIndex = 0;
  @type("number")
  skipped = 0;
  @type("number")
  batchSize = 1;

  constructor() {
    super();
  }
}
