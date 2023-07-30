import { v4 as uuidv4 } from "uuid";
import { BalanceType } from "./Balance.model";
import { BaseWallet, SupportedCurrencies } from "./Wallet.model";
import { Session as BaseSession } from "./Session.model";
import { DateTime } from "luxon";
import { Metaverse } from "./Metaverse.model";
import { Scene as BaseScene } from "./Scene.model";
import { VLMMedia } from "./VLM.model";

export namespace BaseUser {
  export abstract class Account {
    pk?: string;
    sk?: string = uuidv4();
    displayName?: string;
    connectedWallet?: string;
    lastIp?: string;
    activeSessionId?: string;
    createdAt?: number = DateTime.now().toUnixInteger();
    ts?: EpochTimeStamp;
    constructor(config: Config) {
      this.sk = config.sk || this.sk;
      this.connectedWallet = config.connectedWallet;
      this.displayName = config.displayName;
      this.lastIp = config.lastIp || config.clientIp;
      this.createdAt = config.createdAt || this.createdAt;
      this.ts = config.ts;
    }
  }

  export type Config = {
    pk?: string;
    sk?: string;
    connectedWallet?: string;
    displayName?: string;
    clientIp?: string;
    lastIp?: string;
    createdAt?: number;
    ts?: number;
  };

  export abstract class Wallet {
    pk?: string;
    sk?: string;
    userId?: string;
    orgId?: string;
    currency: SupportedCurrencies;

    constructor(config: BaseWallet) {
      this.sk = config.address;
      this.currency = config.currency;
      this.userId = config.userId || this.userId;
      this.orgId = config.orgId || this.orgId;
    }
  }
}

export namespace User {
  export class Account extends BaseUser.Account {
    static pk: string = `vlm:user:account`;
    pk?: string = Account.pk;
    avatar?: string;
    smsPhoneNumber?: SMSPhoneNumber;
    emailAddress?: string;
    aggregates?: Aggregates;
    registeredAt?: number;
    hideDemoScene?: boolean = false;
    roles?: Roles[];

    constructor(config: Config) {
      super(config);
      this.pk = Account.pk;
      this.displayName = config.displayName || `Anon#${config.connectedWallet.slice(config.connectedWallet.length - 4)}`;
      this.connectedWallet = config.connectedWallet;
      this.smsPhoneNumber = config.smsPhoneNumber;
      this.emailAddress = config.emailAddress;
      this.registeredAt = config.registeredAt;
      this.hideDemoScene = config.hideDemoScene;
      this.avatar = config.avatar;
      this.roles = config.roles;
      this.lastIp = config.clientIp || config.lastIp;
    }
  }

  export enum Roles {
    BASIC_USER,
    EARLY_ACCESS,
    ADVANCED_USER,
    LAND_ADMIN,
    ORG_ADMIN,
    VLM_CONTRACTOR,
    VLM_EMPLOYEE,
    VLM_ADMIN,
    ROLE_8, // placeholder
    ROLE_9, // placeholder
    GOD_MODE,
  }

  export class Aggregates {
    walletIds: string[] = [];
    sceneIds: string[] = [];
    transactionIds: string[] = [];
    balanceIds: string[] = [];

    constructor(aggregates?: AggregatesConfig) {
      this.walletIds = aggregates.walletIds;
      this.sceneIds = aggregates.sceneIds;
      this.transactionIds = aggregates.transactionIds;
      this.balanceIds = aggregates.balanceIds;
    }
  }

  export class Balance {
    static pk: string = "vlm:user:balance";
    pk?: string = Balance.pk;
    sk?: string = uuidv4();
    userId?: string;
    type?: BalanceType;
    value?: number;

    constructor(config: Balance) {
      this.sk = config.sk || this.sk;
      this.userId = config.userId;
      this.type = config.type;
      this.value = config.value;
    }
  }

  export class Wallet extends BaseUser.Wallet {
    static pk: string = "vlm:user:wallet";
    pk: string = Wallet.pk;
    sk: string;
    userId: string = uuidv4();
    currency: SupportedCurrencies = "ETH";

    constructor(config: BaseWallet) {
      super(config);
      this.sk = config.address;
      this.currency = config.currency;
      this.userId = config.userId || this.userId;
    }
  }

  export class Role {
    static pk: string = "vlm:user:role";
    pk?: string = Role.pk;
    sk: string;
    title: string;
    color: string;
    description: string;
    constructor(id: number, title: string, color: string, description: string) {
      this.sk = String(id);
      this.title = title;
      this.color = color;
      this.description = description;
    }
  }

  export type AggregatesConfig = {
    walletIds?: string[];
    sceneIds?: string[];
    transactionIds?: string[];
    balanceIds?: string[];
  };

  export type Config = BaseUser.Config & {
    smsPhoneNumber?: SMSPhoneNumber;
    emailAddress?: string;
    registeredAt?: number;
    hideDemoScene?: boolean;
    avatar?: string;
    roles?: Roles[];
  };

  export type SMSPhoneNumber = {
    formattedNumber: string;
    number: { input: string; international: string; national: string; e164: string; rfc3966: string; significant: string };
    valid: boolean;
    country: { name: string; code: string };
  };

  export class SceneLink {
    static pk: string = "vlm:user:scene:link";
    pk: string = SceneLink.pk;
    sk: string = uuidv4();
    userId: string;
    sceneId: string;

    constructor(user: Account, scene: BaseScene.Config) {
      this.userId = user.sk;
      this.sceneId = scene.sk;
    }
  }

  export class MediaLink {
    static pk: string = "vlm:user:media:link";
    pk: string = MediaLink.pk;
    sk: string = uuidv4();
    userId: string;
    mediaId: string;
    mediaType: VLMMedia.Type;

    constructor(user: Account, media: { sk: string; mediaType: VLMMedia.Type }) {
      this.userId = user.sk;
      this.mediaId = media.sk;
      this.mediaType = media.mediaType;
    }
  }

  export namespace Session {
    export class Config extends BaseSession.Config {
      static pk: string = "vlm:user:session";
      pk?: string = Config.pk;
      ttl?: number = DateTime.now().plus({ hours: 12 }).toMillis();

      constructor(config: Config) {
        super(config);
      }
    }
  }

  export const InitialRoles = [
    new Role(Roles.BASIC_USER, "Basic User", "#60AFFF", "Basic access assigned to all users."),
    new Role(Roles.EARLY_ACCESS, "Early Access", "#963484", "Joined VLM in the first 6 months of development."),
    new Role(Roles.ADVANCED_USER, "Advanced User", "#2AF5FF", "Has access to advanced development features that can only be used in the SDK."),
    new Role(Roles.LAND_ADMIN, "Land Admin", "#60AFFF", "Can manage the scenes they create and deploy."),
    new Role(Roles.ORG_ADMIN, "Organization Admin", "#3066BE", "Can manage the scenes of any user in an organization."),
    new Role(Roles.VLM_CONTRACTOR, "VLM Contractor", "#963484", "Can assign Organization Admin roles and be invited into scenes for troubleshooting."),
    new Role(Roles.VLM_EMPLOYEE, "VLM Employee", "#963484", "Can assign Organization Admin roles and be invited into scenes for troubleshooting."),
    new Role(Roles.VLM_ADMIN, "VLM Admin", "#963484", "Can assign VLM admin roles and be invited into scenes for troubleshooting."),
    new Role(Roles.ROLE_8, "Placholder Role", "#963484", "Has access to advanced development features that can only be used in the SDK."),
    new Role(Roles.ROLE_9, "Placholder Role", "#963484", "Has access to advanced development features that can only be used in the SDK."),
    new Role(Roles.GOD_MODE, "God Mode", "#963484", "A power only designated to Unknower himself."),
  ];
}
