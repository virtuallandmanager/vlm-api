import { NFT } from "./NFT.model";

export type ModerationSettings = {
  allowCertainWearables?: boolean;
  banCertainWearables?: boolean;
  allowCertainUsers?: boolean;
  banCertainUsers?: boolean;
  allowWeb3Only?: boolean;
  allowedWearables?: NFT[];
  bannedWearables?: NFT[];
  bannedUsers?: { name: string; connectedWallet: string }[];
  allowedUsers?: { name: string; connectedWallet: string }[];
  banActions?: EBanActions[];
  allowActions?: EAllowActions[];
  banWallType?: EBanWallType;
};

export enum EBanActions {
  WALL,
  BLACKOUT,
}

export enum EBanWallType {
  BLACK,
  INVISIBLE,
  MIRROR,
}

export enum EAllowActions {
  MOVE,
}
