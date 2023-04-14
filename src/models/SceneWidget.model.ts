import { v4 as uuidv4 } from "uuid";

export class SceneWidget {
  static pk: string = "vlm:scene:widget";
  pk?: string = SceneWidget.pk;
  sk: string = uuidv4();
  type?: ESceneWidgetType;
  value?: string | boolean;
  constructor(config: SceneWidgetConfig) {
    if (config.sk) {
      this.sk = config.sk;
    }
    this.type = config.type;
    this.value = config.value;
  }
}

export type SceneWidgetConfig = {
  [key: string]: any;
  pk?: string;
  sk?: string;
  type?: ESceneWidgetType;
  value?: string | boolean;
};

export enum ESceneWidgetType {
  TOGGLE,
  TEXT,
  SELECTOR,
  DATETIME,
  TRIGGERS,
}
