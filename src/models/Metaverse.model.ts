import { v4 as uuidv4 } from "uuid";

export namespace Metaverse {
  export abstract class Config {
    static pk: string = "metaverse:config";
    pk?: string = Config.pk;
    sk?: string = uuidv4();
    displayName?: string = "The Metaverse";
    worlds: World[] = [];

    constructor(config: Config) {
      this.worlds = [...this.worlds, ...config.worlds];
    }
  }

  export abstract class World {
    static pk: string = "metaverse:world";
    pk?: string = World.pk;
    sk?: string = uuidv4();
    displayName?: string = "New World";
  }

  export enum Worlds {
    DECENTRALAND,
    HYPERFY,
    SANDBOX,
    MONAVERSE,
    SPATIAL,
    READYPLAYERME,
  }
}
