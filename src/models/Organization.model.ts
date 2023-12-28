import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import { BalanceType } from "./Balance.model";
import { User } from "./User.model";
import { Scene } from "./Scene.model";

export namespace Organization {
  export class Account {
    static pk: string = "vlm:organization:account";
    pk: string = Account.pk;
    sk: string = uuidv4();
    displayName: string = "AnonCo";
    legalName: string = "";
    emailAddress?: string;
    discordChannel?: string;
    createdAt?: EpochTimeStamp = DateTime.now().toUnixInteger();;
    [key: string]: any;

    constructor(config: Organization.Config) {
      Object.keys(config).forEach((key: string) => {
        this[key] = config[key];
      });
    }
  }

  export class UserConnector {
    static pk: string = "vlm:organization:user";
    pk: string = UserConnector.pk;
    sk: string = uuidv4();
    orgId: string;
    userId: string;
    userRole: string | number;

    constructor(config: { account: Organization.Account; user: User.Account; role: Organization.Roles }) {
      this.orgId = config.account.sk;
      this.userId = config.user.sk;
      this.userRole = config.role;
    }
  }

  export class Invite {
    static pk: string = "vlm:scene:invite";
    pk?: string = Invite.pk;
    sk?: string = uuidv4();
    userId?: string;
    orgId?: string;
    startTime?: EpochTimeStamp;
    endTime?: EpochTimeStamp;
    permissions?: Permissions;
    ts?: EpochTimeStamp = DateTime.now().toMillis();

    constructor(config?: Invite) {
      if (!config) {
        return;
      }
      this.sk = config.sk || this.sk;
      this.userId = config.userId;
      this.orgId = config.orgId;
      this.startTime = config.startTime;
      this.endTime = config.endTime;
      this.permissions = config.permissions;
      this.ts = config.ts || this.ts;
    }
  }

  export class Balance {
    static pk: string = "vlm:organization:account:balance";
    pk?: string = Balance.pk;
    sk?: string = uuidv4();
    orgId?: string;
    type?: BalanceType;
    value?: number;
    ts?: EpochTimeStamp = DateTime.now().toMillis();


    constructor(config: Balance) {
      this.sk = config?.sk || this.sk;
      this.orgId = config?.orgId;
      this.type = config?.type;
      this.value = config?.value;
      this.ts = config?.ts || this.ts;
    }
  }

  export class Status {
    static pk: string = "vlm:organization:account:status";
    pk: string = Status.pk;
    sk: string = uuidv4();
    orgId: string;
    type: BalanceType;
    value: number;
    ts?: EpochTimeStamp = DateTime.now().toMillis();

    constructor(config: Balance) {
      this.sk = config?.sk || this.sk;
      this.orgId = config?.orgId;
      this.type = config?.type;
      this.value = config?.value;
      this.ts = config?.ts || this.ts;
    }

    adjust: CallableFunction = (newValue: number) => {
      this.value += newValue;
    };
  }

  export class Role {
    static pk: string = "vlm:organization:role";
    pk: string;
    sk: string;
    name: string;
    description: string;
    constructor(id: number, name: string, description: string) {
      this.sk = String(id);
      this.name = name;
      this.description = description;
    }
  }

  export type Config = {
    pk?: string;
    sk?: string;
    connectedWallet?: string;
    publicKey?: string;
    hasConnectedWeb3?: boolean;
    name?: string;
    [key: string]: any;
  };

  export enum Roles {
    ORG_GUEST,
    ORG_EMPLOYEE,
    ORG_MANAGER,
    ORG_DEVELOPER,
    ORG_ADMIN,
    ORG_OWNER,
  }
}
