import { v4 as uuidv4 } from "uuid";

export class Advertisement {
  static pk: string = "vlm:advertisement";
  pk: string = Advertisement.pk;
  sk: string = uuidv4();
  title: string;
  campaignId: string;
  type: EAdvertisementType;
  contentUrl: string;
  constructor(config: Advertisement) {
    this.sk = config.sk || this.sk;
    this.campaignId = config.campaignId;
    this.title = config.title;
    this.type = config.type;
    this.contentUrl = config.contentUrl;
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
