import { v4 as uuidv4 } from "uuid";
import { Giveaway } from "./Giveaway.model";
import { Metaverse } from "./Metaverse.model";
import { Scene as BaseScene } from "./Scene.model";

export namespace Event {
  export class Config {
    static pk: string = "vlm:event"; // Partition Key
    pk?: string = Config.pk; // Partition Key
    sk?: string = uuidv4(); // Sort Key
    name: string;
    startTime: number;
    endTime: number;
    claimLimits?: Giveaway.ClaimLimits; // caps total number of giveaway claims allowed
    giveaways?: string[];
    poaTokens?: string[];
    constructor(config: Event.Config) {
      this.sk = config.sk || this.sk;
      this.startTime = config.startTime || this.startTime;
      this.endTime = config.endTime || this.endTime;
      this.claimLimits = config.claimLimits;
      this.giveaways = config.giveaways;
      this.poaTokens = config.poaTokens;
    }
  }

  export class SceneLink {
    static pk: string = "vlm:event:scene:link";
    pk: string = SceneLink.pk;
    sk: string = uuidv4();
    eventId: string;
    sceneId: string;
    world: Metaverse.Worlds;

    constructor(event: Config, scene: BaseScene.Config) {
      this.eventId = event.sk;
      this.sceneId = scene.sk;
      this.world = scene.world;
    }
  }

  export type TConfig = {
    pk?: string; // Partition Key
    sk?: string; // Sort Key
    name?: string;
    startTime?: number;
    endTime?: number;
    totalClaimLimit?: number;
    giveaways?: string[];
    poaTokens?: string[];
  };
}
