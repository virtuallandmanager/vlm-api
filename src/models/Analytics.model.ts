import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import { BaseUser } from "./User.model";
import { BaseWallet, SupportedCurrencies } from "./Wallet.model";
import { Session as BaseSession } from "./Session.model";

export namespace Analytics {
  export namespace User {
    export class Account extends BaseUser.Account {
      static pk: string = `vlm:analytics:user`;
      pk: string = Account.pk;
      hasConnectedWeb3: boolean;
      world: string;
      ttl?: number;
      [key: string]: any;

      constructor(config: Config) {
        super(config);
        if (config.hasConnectedWeb3 && !config.connectedWallet) {
          this.connectedWallet = config.publicKey;
        } else if (!config.hasConnectedWeb3) {
          this.ttl = DateTime.now().plus({ month: 1 }).toUnixInteger();
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
      baseParcel?: string;

      constructor(config: Config) {
        super(config);
        this.baseParcel = config.baseParcel;
      }
    }

    export class Path {
      static pk: string = "vlm:analytics:session:path"; // Partition Key
      pk?: string = Path.pk;
      sk?: string = uuidv4(); // Sort Key
      path: PathPoint[] = [];

      constructor(config: Path) {
        this.sk = config.sk || this.sk;
        this.path = config.path;
      }
    }

    export class PathLink {
      static pk: string = "vlm:analytics:session:path:link"; // Partition Key
      pk?: string = PathLink.pk;
      sk?: string = uuidv4(); // Sort Key
      sessionId: string;
      pathId: string;

      constructor(config: PathLink) {
        this.sk = config.sk || this.sk;
        this.sessionId = config.sessionId;
        this.pathId = config.pathId;
      }
    }

    export type PathPoint = [number, number, number, number, number, number, number, -1 | 0 | 1 | 2];
  }

  // Path points are arrays of primitives for data efficiency.
  // [O, Px, Py, Pz, Rx, Ry, Rz, V]

  ////////////////////// LEGEND //////////////////////
  // O [0] = offset from startTime - tracked in seconds
  // P [1,2,3] = player's relative position in scene
  // R [4,5,6] = camera rotation
  // V [7] = pov
}
