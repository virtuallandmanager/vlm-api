import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import { BalanceType } from "./Balance.model";
import { User } from "./User.model";

export namespace Organization {
  export class Account {
    static pk: string = "vlm:organization:account";
    pk: string = Account.pk;
    sk: string = uuidv4();
    displayName: string = "AnonCo";
    legalName: string = "";
    emailAddress?: string;
    discordChannel?: string;
    createdAt?: EpochTimeStamp = Date.now();;
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

  export class Balance {
    static pk: string = "vlm:organization:account:balance";
    pk?: string = Balance.pk;
    sk?: string = uuidv4();
    orgId: string;
    type: BalanceType;
    value: number;
    [key: string]: any;

    constructor(config: Balance) {
      Object.keys(config).forEach((key: string) => {
        this[key] = config[key];
      });
    }
  }

  export class Status {
    static pk: string = "vlm:organization:account:status";
    pk: string = Status.pk;
    sk: string = uuidv4();
    orgId: string;
    type: BalanceType;
    value: number;
    [key: string]: any;

    constructor(config: Balance) {
      Object.keys(config).forEach((key: string) => {
        this[key] = config[key];
      });
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
