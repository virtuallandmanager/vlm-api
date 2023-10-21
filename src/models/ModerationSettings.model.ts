import { NFT } from "./NFT.model";

export type ModerationSettings = {
  allowCertainWearables?: boolean;
  banCertainWearables?: boolean;
  allowCertainUsers?: boolean;
  banCertainUsers?: boolean;
  allowWeb3Only?: boolean;
  allowedWearables?: NFT[];
  bannedWearables?: NFT[];
  bannedUsers?: { displayName: string; connectedWallet: string }[];
  allowedUsers?: { displayName: string; connectedWallet: string }[];
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
