import { v4 as uuidv4 } from 'uuid'
import { BalanceType } from './Balance.model'
import { SupportedCurrencies, WalletConfig, WalletType } from './Wallet.model'
import { Session as BaseSession } from './Session.model'
import { DateTime } from 'luxon'
import { Scene as BaseScene } from './Scene.model'
import { VLMMedia } from './VLM.model'

export namespace User {
  export class Account {
    static pk: string = `vlm:user:account`
    pk?: string = Account.pk
    sk?: string = uuidv4()
    displayName?: string
    avatar?: string = `https://vlm.gg/media/avatar/default.png`
    smsPhoneNumber?: SMSPhoneNumber
    emailAddress?: string
    aggregates?: Aggregates
    registeredAt?: number
    hideDemoScene?: boolean = false
    roles?: Roles[]
    hasConnectedWeb3?: boolean = false
    connectedWallet?: string
    lastIp?: string
    activeSessionId?: string
    createdAt?: number = DateTime.now().toMillis()
    ts?: EpochTimeStamp = DateTime.now().toMillis()

    constructor(config: Account & ExternalUserConfigs = {}) {
      this.sk = config?.sk || this.sk
      this.displayName = config.displayName || `Anon#${config.connectedWallet.slice(config.connectedWallet.length - 4)}`
      this.connectedWallet = config.connectedWallet
      this.smsPhoneNumber = config.smsPhoneNumber
      this.emailAddress = config.emailAddress
      this.registeredAt = config.registeredAt
      this.hideDemoScene = config.hideDemoScene
      this.avatar = config.avatar || this.avatar
      this.roles = config.roles
      this.lastIp = config.clientIp || config.lastIp
      this.hasConnectedWeb3 = config.hasConnectedWeb3
    }
  }

  export type ExternalUserConfigs = {
    clientIp?: string
    publicKey?: string
  }

  export enum Roles {
    BASIC_USER,
    EARLY_ACCESS,
    ADVANCED_USER,
    SCENE_ADMIN,
    ORG_ADMIN,
    VLM_CONTRACTOR,
    VLM_EMPLOYEE,
    VLM_ADMIN,
    ROLE_8, // placeholder
    ROLE_9, // placeholder
    GOD_MODE,
  }

  export class Aggregates {
    walletIds: string[] = []
    sceneIds: string[] = []
    transactionIds: string[] = []
    balanceIds: string[] = []

    constructor(aggregates?: AggregatesConfig) {
      this.walletIds = aggregates.walletIds
      this.sceneIds = aggregates.sceneIds
      this.transactionIds = aggregates.transactionIds
      this.balanceIds = aggregates.balanceIds
    }
  }

  export class Balance {
    static pk: string = 'vlm:user:balance'
    pk?: string = Balance.pk
    sk?: string
    userId?: string
    type?: BalanceType
    value?: number = 0
    ts?: EpochTimeStamp = DateTime.now().toMillis()

    constructor(config: Balance) {
      this.sk = `${config?.userId}:${config?.type}`
      this.userId = config?.userId
      this.type = config?.type
      this.value = config?.value || this.value
      this.ts = config?.ts || this.ts
    }
  }

  export class Wallet {
    static pk: string = 'vlm:user:wallet'
    pk: string = Wallet.pk
    sk: string
    userId: string = uuidv4()
    currency: SupportedCurrencies = 'ETH'
    type: WalletType = WalletType.USER
    ttl?: EpochTimeStamp

    constructor(config: WalletConfig) {
      this.sk = config.sk || config.address
      this.currency = config.currency
      this.userId = config.userId || this.userId
      this.type = config.type || this.type
      this.ttl = config.ttl || this.ttl
    }
  }

  export class Role {
    static pk: string = 'vlm:user:role'
    pk?: string = Role.pk
    sk: string
    title: string
    color: string
    description: string
    constructor(id: number, title: string, color: string, description: string) {
      this.sk = String(id)
      this.title = title
      this.color = color
      this.description = description
    }
  }

  export type AggregatesConfig = {
    walletIds?: string[]
    sceneIds?: string[]
    transactionIds?: string[]
    balanceIds?: string[]
  }

  export type SMSPhoneNumber = {
    formattedNumber: string
    number: { input: string; international: string; national: string; e164: string; rfc3966: string; significant: string }
    valid: boolean
    country: { name: string; code: string }
  }

  export class SceneLink {
    static pk: string = 'vlm:user:scene:link'
    pk: string = SceneLink.pk
    sk: string = uuidv4()
    userId: string
    sceneId: string

    constructor(user: Account, scene: BaseScene.Config) {
      this.userId = user.sk
      this.sceneId = scene.sk
    }
  }

  export class MediaLink {
    static pk: string = 'vlm:user:media:link'
    pk: string = MediaLink.pk
    sk: string = uuidv4()
    userId: string
    mediaId: string
    mediaType: VLMMedia.Type

    constructor(user: Account, media: { sk: string; mediaType: VLMMedia.Type }) {
      this.userId = user.sk
      this.mediaId = media.sk
      this.mediaType = media.mediaType
    }
  }

  export namespace Session {
    export class Config extends BaseSession.Config {
      static pk: string = 'vlm:user:session'
      pk: string = Config.pk
      ttl?: EpochTimeStamp = DateTime.now().plus({ hours: 12 }).toMillis()

      constructor(config: Partial<Config>) {
        super(config)
        this.ttl = config?.ttl || this.ttl
      }
    }
  }

  export const InitialRoles = [
    new Role(Roles.BASIC_USER, 'Basic User', '#60AFFF', 'Basic access assigned to all users.'),
    new Role(Roles.EARLY_ACCESS, 'Early Access', '#963484', 'Joined VLM in the first 6 months of development.'),
    new Role(Roles.ADVANCED_USER, 'Advanced User', '#2AF5FF', 'Has access to advanced development features that can only be used in the SDK.'),
    new Role(Roles.SCENE_ADMIN, 'Scene Admin', '#60AFFF', 'Can manage the scenes they create and deploy.'),
    new Role(Roles.ORG_ADMIN, 'Organization Admin', '#3066BE', 'Can manage the scenes of any user in an organization.'),
    new Role(
      Roles.VLM_CONTRACTOR,
      'VLM Contractor',
      '#963484',
      'Can assign Organization Admin roles and be invited into scenes for troubleshooting.'
    ),
    new Role(Roles.VLM_EMPLOYEE, 'VLM Employee', '#963484', 'Can assign Organization Admin roles and be invited into scenes for troubleshooting.'),
    new Role(Roles.VLM_ADMIN, 'VLM Admin', '#963484', 'Can assign VLM admin roles and be invited into scenes for troubleshooting.'),
    new Role(Roles.ROLE_8, 'Placholder Role', '#963484', 'Has access to advanced development features that can only be used in the SDK.'),
    new Role(Roles.ROLE_9, 'Placholder Role', '#963484', 'Has access to advanced development features that can only be used in the SDK.'),
    new Role(Roles.GOD_MODE, 'God Mode', '#963484', 'A power only designated to Unknower himself.'),
  ]
}
