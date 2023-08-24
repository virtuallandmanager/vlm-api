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

  export type Location = { world: Metaverse.Worlds; location: string; coordinates: number[] | string[]; parcels: string[], url?: string, realm: RealmData };

  export type RealmData = {
    serverName?: string;
    layer?: string;
    displayName?: string;
    domain?: string;
    layerId?: string;
    serverURL?: string;
    usersCount?: number;
    capacity?: number;
    maxUsers?: number;
    usersParcels?: string[];
    usersCountByLayer?: { [key: string]: number };
    usersParcelsByLayer?: { [key: string]: string[] };
  };

  export type Worlds = "decentraland" | "hyperfy";
}
