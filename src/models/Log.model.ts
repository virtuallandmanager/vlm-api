import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import { User } from "./User.model";

export namespace Log {
  export enum Type {
    INFO,
    WARNING,
    ERROR,
    WAT,
    FATAL,
  }

  export abstract class AdminLog {
    static pk: string = "vlm:admin:log";
    pk?: string;
    sk?: string = uuidv4();
    message: unknown;
    type: Type;
    metadata: MetadataConfig;
    environment: string;
    userInfo?: User.Account;
    ts?: number = DateTime.now().toUnixInteger();
    constructor(log: AdminLog) {
      this.pk = log.pk;
      this.sk = log.sk || this.sk;
      this.message = log?.message;
      this.type = log?.type;
      this.metadata = log?.metadata;
      this.environment = log?.environment;
      this.userInfo = log?.userInfo;
      this.ts = log?.ts || this.ts;
    }
  }

  export class AdminLogInfo extends AdminLog {
    static pk: string = "vlm:admin:log:info";
    pk?: string = AdminLogInfo.pk;
    constructor(log: AdminLogInfo) {
      super(log);
    }
  }

  export class AdminLogWarning extends AdminLog {
    static pk: string = "vlm:admin:log:warning";
    pk?: string = AdminLogWarning.pk;
    constructor(log: AdminLogWarning) {
      super(log);
    }
  }

  export class AdminLogError extends AdminLog {
    static pk: string = "vlm:admin:log:error";
    pk?: string = AdminLogError.pk;
    constructor(log: AdminLogError) {
      super(log);
    }
  }

  export class AdminLogWAT extends AdminLog {
    static pk: string = "vlm:admin:log:wat";
    pk?: string = AdminLogError.pk;
    constructor(log: AdminLogWAT) {
      super(log);
    }
  }

  export class AdminLogFatal extends AdminLog {
    static pk: string = "vlm:admin:log:fatal";
    pk?: string = AdminLogFatal.pk;
    constructor(log: AdminLogFatal) {
      super(log);
    }
  }

  export type MetadataConfig = {
    [key: string]: unknown;
  };
}
