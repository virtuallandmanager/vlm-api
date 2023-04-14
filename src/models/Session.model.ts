import { Ipv4Address } from "aws-sdk/clients/inspector";
import { v4 as uuidv4 } from "uuid";
import { IPData } from "./IPData.model";
import { Metaverse } from "./Metaverse.model";

export namespace Session {
  export class Config {
    static pk: string = "vlm:session:config"; // Partition Key
    pk?: string; // Partition Key
    sk?: string = uuidv4(); // Sort Key
    userId?: string; // LSI
    connectedWallet?: string; // LSI
    clientIp?: Ipv4Address; // LSI
    sessionStart?: EpochTimeStamp = Date.now();
    sessionEnd?: EpochTimeStamp;
    ipData?: IPData;
    signatureToken?: string; // Granted for 3 minutes to allow for cryptographically signed login
    sessionToken?: string; // Stored by client to allow login for 12h
    expires?: EpochTimeStamp;
    sceneId?: string;
    world?: Metaverse.Worlds;
    ts?: EpochTimeStamp = Date.now();

    constructor(config: Config) {
      this.sk = config.sk || this.sk;
      this.userId = config.userId;
      this.connectedWallet = config.connectedWallet;
      this.clientIp = config.clientIp;
      this.sessionStart = config.sessionStart;
      this.sessionEnd = config.sessionEnd;
      this.ipData = config.ipData;
      this.signatureToken = config.signatureToken;
      this.sessionToken = config.sessionToken;
      this.expires = config.expires;
      this.sceneId = config.sceneId;
      this.ts = config.ts || this.ts;
    }

    start?: CallableFunction = () => {
      this.sessionStart = Date.now();
    };

    end?: CallableFunction = () => {
      this.sessionEnd = Date.now();
    };
  }
}
