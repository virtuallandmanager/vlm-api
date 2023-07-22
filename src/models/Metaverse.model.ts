import { v4 as uuidv4 } from "uuid";

export namespace Metaverse {
  export abstract class Config {
    static pk: string = "metaverse:config";
    pk?: string = Config.pk;
    sk?: string = uuidv4();
    name?: string = "The Metaverse";
    worlds: World[] = [];

    constructor(config: Config) {
      this.worlds = [...this.worlds, ...config.worlds];
    }
  }

  export abstract class World {
    static pk: string = "metaverse:world";
    pk?: string = World.pk;
    sk?: string = uuidv4();
    name?: string = "New World";
  }

  export type Location = { world: Metaverse.Worlds; location: string; coordinates: number[] | string[]; url?: string };

  export type Worlds = "decentraland" | "hyperfy";
}
