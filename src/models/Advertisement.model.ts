import { v4 as uuidv4 } from "uuid";

export class Advertisement {
  static pk: string = "vlm:advertisement";
  pk: string = Advertisement.pk;
  sk: string = uuidv4();
  campaignId: string;
  type: EAdvertisementType;
  contentUrl: string;
  [key: string]: any;
  constructor(config: Advertisement) {
    Object.keys(config).forEach((key: string) => {
      this[key] = config[key];
    });
  }
}

export type TAdvertisementConfig = {
  pk: string;
  sk: string;
  campaignId: string;
  type: EAdvertisementType;
  contentUrl: string;
  [key: string]: any;
};

export enum EAdvertisementType {
  IMAGE,
  VIDEO,
}
