import { NFT } from "./NFT.model";
import { v4 as uuidv4 } from "uuid";
import { TransformConstructorArgs } from "./Transform.model";

export class NFTFrame {
  pk?: string = "dcl:scene:nftframe"; // Partition Key
  sk: string = uuidv4(); // Sort Key
  customId?: string;
  parent?: string;
  instances?: NFTFrameInstance[];
  chain?: number | string;
  contractAddress?: string;
  itemId?: number | string;
  tokenId?: number | string;
  style?: number;
  show?: boolean;
  color?: string;
  withCollisions?: boolean;
  [key: string]: any;

  constructor(config: NFTFrame) {
    Object.keys(config).forEach((key: string) => {
      this[key] = config[key];
    });
  }
}

export class NFTFrameInstance {
  static pk: string = "dcl:scene:nftframe:instance"; // Partition Key
  pk?: string = NFTFrameInstance.pk; // Partition Key
  sk: string = uuidv4(); // Sort Key  customId?: string;
  customRendering?: boolean;
  name: string;
  parent?: string;
  position: TransformConstructorArgs;
  rotation: TransformConstructorArgs;
  scale: TransformConstructorArgs;
  show: boolean;
  withCollisions: boolean;
  constructor() {}
}
