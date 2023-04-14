export type BalanceConfig = {
  id: string;
  userId: string;
  type: BalanceType;
  value: number;
};

export enum BalanceType {
  GIFT,
  ANALYTICS,
  AIRDROP,
  ATTENDANCE_TOKEN,
}

export const PromoBalances = {
  user: [{ type: BalanceType.AIRDROP, value: 1000 }],
  organization: [{ type: BalanceType.AIRDROP, value: 1000 }],
};
