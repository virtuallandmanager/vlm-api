import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import { BaseUser } from "./User.model";
import { BaseWallet, SupportedCurrencies } from "./Wallet.model";
import { Session as BaseSession } from "./Session.model";
import { Metaverse } from "./Metaverse.model";

export namespace Analytics {
  export namespace User {
    export class Account extends BaseUser.Account {
      static pk: string = `vlm:analytics:user`;
      pk?: string = Account.pk;
      hasConnectedWeb3?: boolean;
      world?: string;
      ttl?: number;

      constructor(config: Config) {
        super(config);
        if (config.hasConnectedWeb3 && !config.connectedWallet) {
          this.connectedWallet = config.publicKey;
        } else if (!config.hasConnectedWeb3) {
          this.ttl = DateTime.now().plus({ month: 1 }).toMillis();
        }
      }
    }

    export type Config = BaseUser.Config & {
      publicKey?: string;
      hasConnectedWeb3?: boolean;
    };

    export class Wallet extends BaseUser.Wallet {
      static pk: string = "vlm:analytics:user:wallet";
      pk: string = Wallet.pk;
      sk: string;
      userId: string = uuidv4();
      currency: SupportedCurrencies = "ETH";

      constructor(config: BaseWallet) {
        super(config);
        this.sk = config.sk || config.address;
        this.currency = config.currency;
        this.userId = config.userId || this.userId;
      }
    }
  }

  export namespace Session {
    export class Config extends BaseSession.Config {
      static pk: string = "vlm:analytics:session";
      pk?: string = Config.pk;
      device?: string;
      paths?: string[];
      location?: Metaverse.Location;
      environment?: string;
      serverAuthenticated?: boolean = false;
      peerAuthenticated?: boolean = false;
      ttl?: EpochTimeStamp;

      constructor(config: Config) {
        super(config);
        this.device = config.device;
        this.location = config.location;
        this.environment = config.environment;
        this.serverAuthenticated = config.serverAuthenticated;
        this.peerAuthenticated = config.peerAuthenticated;
        this.ttl = config.ttl;
      }
    }

    export class BotConfig extends BaseSession.Config {
      static pk: string = "vlm:analytics:session";
      pk?: string = Config.pk;
      device?: string;
      paths?: string[];
      location?: Metaverse.Location;
      ttl?: EpochTimeStamp;
      suspicious: boolean = true;

      constructor(config: Config) {
        super(config);
        this.device = config.device;
        this.location = config.location;
        this.ttl = config.ttl;
      }
    }

    export class Action {
      static pk: string = "vlm:analytics:session:action"; // Partition Key
      pk?: string = Action.pk;
      sk?: string = uuidv4(); // Sort Key
      name?: string = "Unknown Action";
      sessionId?: string;
      sceneId?: string;
      origin?: Metaverse.Location;
      pathPoint?: PathPoint;
      metadata?: unknown = {};

      ts?: EpochTimeStamp = Date.now();

      constructor(config: Action) {
        this.sk = config.sk || this.sk;
        this.name = config.name || this.name;
        this.sessionId = config.sessionId;
        this.sceneId = config.sceneId;
        this.origin = config.origin;
        this.pathPoint = config.pathPoint;
        this.metadata = config.metadata || this.metadata;
        this.ts = config.ts || this.ts;
      }
    }
  }

  export class Path {
    static pk: string = "vlm:analytics:path"; // Partition Key
    pk?: string = Path.pk;
    sk?: string = uuidv4(); // Sort Key
    segments?: PathSegment[] = [];

    constructor(config?: Path) {
      this.sk = config?.sk || this.sk;
      this.segments = config?.segments || this.segments;
    }
  }

  export class PathSegment {
    static pk: string = "vlm:analytics:path:segment"; // Partition Key
    pk?: string = PathSegment.pk;
    sk?: string = uuidv4(); // Sort Key
    pathId?: string;
    type?: SegmentType;
    path?: PathPoint[];

    constructor(config: PathSegment) {
      this.sk = config.sk || this.sk;
      this.pathId = config.pathId;
      this.type = config.type;
      this.path = config.path;
    }
  }

  export enum SegmentType {
    LOADING,
    IDLE,
    STATIONARY_DISENGAGED,
    STATIONARY_ENGAGED,
    RUNNING_DISENGAGED,
    WALKING_DISENGAGED,
    RUNNING_ENGAGED,
    WALKING_ENGAGED,
  }

  export const PathPointLegend: Record<number, string> = {
    0: "X-Position",
    1: "Y-Position",
    2: "Z-Position",
    3: "Timestamp",
    4: "X-Rotation",
    5: "Y-Rotation",
    6: "POV",
  };

  export type PathPoint = [number, number, number, number, number, number, number, -1 | 0 | 1 | 2];

  // Action Locations and Path Points are arrays of primitives for data efficiency.

  ///////////////////////////////////////////////////////////////////////////////////

  // Action Point: [W, B]

  ////////////////////// LEGEND //////////////////////
  // W [0] = metaverse world
  // B [1] = player's segmented position in world, if relevant, such as a DCL parcel

  ///////////////////////////////////////////////////////////////////////////////////

  // Path Point: [O, Px, Py, Pz, Rx, Ry, V]

  ////////////////////// LEGEND //////////////////////
  // O [0] = offset from startTime - tracked in seconds
  // P [1,2,3] = player's relative position in scene
  // R [4,5] = camera rotation
  // V [6] = pov
}
