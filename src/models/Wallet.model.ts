export type BaseWallet = {
  sk: string;
  currency: SupportedCurrencies;
  address: string;
  userId?: string;
  orgId?: string;
  type?: WalletType;
  ttl?: number;
};

export type SupportedCurrencies = "BTC" | "ETH" | "MANA" | "MATIC" | "LTC" | "SOL" | "DOGE";

export enum WalletType {
  USER,
  ORGANIZATION,
  VLM_SERVICE,
  VLM_REVENUE,
}
