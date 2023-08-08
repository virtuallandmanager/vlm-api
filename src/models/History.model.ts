import { v4 as uuidv4 } from "uuid";

export namespace History {
  export class Config {
    static pk: string = "vlm:history";
    pk?: string = Config.pk;
    sk?: string = uuidv4(); //shares SK with whatever it's storing a history for
    updates?: string[] | Update[] = [];
    ts?: number = Date.now();

    constructor(config: Config) {
      this.sk = config.sk || this.sk;
      this.updates = config.updates || this.updates;
      this.ts = config.ts || this.ts;
    }
  }

  export class Root {
    static pk: string = "vlm:history:root";
    pk?: string = Root.pk;
    sk?: string = uuidv4();
    historyId?: string;
    root?: Object;
    ts?: number = Date.now();

    constructor(config: Root) {
      this.sk = config.sk || this.sk;
      this.historyId = config.historyId;
      this.root = config.root;
      this.ts = config.ts || this.ts;
    }
  }

  export class Update implements IUpdateDescriptors {
    static pk: string = "vlm:history:update";
    pk?: string = Update.pk;
    sk?: string = uuidv4();
    historyId?: string;
    userId?: string;
    displayName?: string;
    action?: string;
    element?: string;
    id?: string;
    property?: string;
    from?: unknown;
    to?: unknown;
    ts?: number = Date.now();

    constructor(config: Update) {
      this.sk = config?.sk || this.sk;
      this.userId = config.userId;
      this.displayName = config.displayName;
      this.action = config.action;
      this.element = config.element;
      this.id = config.id;
      this.property = config.property;
      this.from = config.from;
      this.to = config.to;
      this.ts = config.ts;
    }
  }

  export interface IUpdateDescriptors {
    action?: string;
    element?: string;
    id?: string;
    property?: string;
    from?: unknown;
    to?: unknown;
  }
}
