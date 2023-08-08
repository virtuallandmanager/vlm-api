export type Parcel = {
  coord: string; // Partition Key
  tokenId: number; // LSI
  owner: string; // LSI
  operators: Array<string>;
  x: number;
  y: number;
};
