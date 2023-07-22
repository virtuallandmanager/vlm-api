"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.BaseUser = void 0;
const uuid_1 = require("uuid");
const Session_model_1 = require("./Session.model");
const luxon_1 = require("luxon");
var BaseUser;
(function (BaseUser) {
    class Account {
        constructor(config) {
            this.sk = (0, uuid_1.v4)();
            this.createdAt = luxon_1.DateTime.now().toUnixInteger();
            this.sk = config.sk || this.sk;
            this.connectedWallet = config.connectedWallet;
            this.displayName = config.displayName;
            this.lastIp = config.lastIp || config.clientIp;
            this.createdAt = config.createdAt || this.createdAt;
            this.ts = config.ts;
        }
    }
    BaseUser.Account = Account;
    class Wallet {
        constructor(config) {
            this.sk = config.address;
            this.currency = config.currency;
            this.userId = config.userId || this.userId;
            this.orgId = config.orgId || this.orgId;
        }
    }
    BaseUser.Wallet = Wallet;
})(BaseUser = exports.BaseUser || (exports.BaseUser = {}));
var User;
(function (User) {
    class Account extends BaseUser.Account {
        constructor(config) {
            super(config);
            this.pk = Account.pk;
            this.pk = Account.pk;
            this.displayName = config.displayName || `Anon#${config.connectedWallet.slice(config.connectedWallet.length - 4)}`;
            this.connectedWallet = config.connectedWallet;
            this.smsPhoneNumber = config.smsPhoneNumber;
            this.emailAddress = config.emailAddress;
            this.registeredAt = config.registeredAt;
            this.avatar = config.avatar;
            this.roles = config.roles;
            this.lastIp = config.clientIp || config.lastIp;
        }
    }
    Account.pk = `vlm:user:account`;
    User.Account = Account;
    let Roles;
    (function (Roles) {
        Roles[Roles["BASIC_USER"] = 0] = "BASIC_USER";
        Roles[Roles["EARLY_ACCESS"] = 1] = "EARLY_ACCESS";
        Roles[Roles["ADVANCED_USER"] = 2] = "ADVANCED_USER";
        Roles[Roles["LAND_ADMIN"] = 3] = "LAND_ADMIN";
        Roles[Roles["ORG_ADMIN"] = 4] = "ORG_ADMIN";
        Roles[Roles["VLM_CONTRACTOR"] = 5] = "VLM_CONTRACTOR";
        Roles[Roles["VLM_EMPLOYEE"] = 6] = "VLM_EMPLOYEE";
        Roles[Roles["VLM_ADMIN"] = 7] = "VLM_ADMIN";
        Roles[Roles["ROLE_8"] = 8] = "ROLE_8";
        Roles[Roles["ROLE_9"] = 9] = "ROLE_9";
        Roles[Roles["GOD_MODE"] = 10] = "GOD_MODE";
    })(Roles = User.Roles || (User.Roles = {}));
    class Aggregates {
        constructor(aggregates) {
            this.walletIds = [];
            this.sceneIds = [];
            this.transactionIds = [];
            this.balanceIds = [];
            this.walletIds = aggregates.walletIds;
            this.sceneIds = aggregates.sceneIds;
            this.transactionIds = aggregates.transactionIds;
            this.balanceIds = aggregates.balanceIds;
        }
    }
    User.Aggregates = Aggregates;
    class Balance {
        constructor(config) {
            this.pk = Balance.pk;
            this.sk = (0, uuid_1.v4)();
            this.sk = config.sk || this.sk;
            this.userId = config.userId;
            this.type = config.type;
            this.value = config.value;
        }
    }
    Balance.pk = "vlm:user:balance";
    User.Balance = Balance;
    class Wallet extends BaseUser.Wallet {
        constructor(config) {
            super(config);
            this.pk = Wallet.pk;
            this.userId = (0, uuid_1.v4)();
            this.currency = "ETH";
            this.sk = config.address;
            this.currency = config.currency;
            this.userId = config.userId || this.userId;
        }
    }
    Wallet.pk = "vlm:user:wallet";
    User.Wallet = Wallet;
    class Role {
        constructor(id, title, color, description) {
            this.pk = Role.pk;
            this.sk = String(id);
            this.title = title;
            this.color = color;
            this.description = description;
        }
    }
    Role.pk = "vlm:user:role";
    User.Role = Role;
    class SceneLink {
        constructor(user, scene) {
            this.pk = SceneLink.pk;
            this.sk = (0, uuid_1.v4)();
            this.userId = user.sk;
            this.sceneId = scene.sk;
        }
    }
    SceneLink.pk = "vlm:user:scene:link";
    User.SceneLink = SceneLink;
    let Session;
    (function (Session) {
        class Config extends Session_model_1.Session.Config {
            constructor(config) {
                super(config);
                this.pk = Config.pk;
                this.ttl = luxon_1.DateTime.now().plus({ hours: 12 }).toMillis();
            }
        }
        Config.pk = "vlm:user:session";
        Session.Config = Config;
    })(Session = User.Session || (User.Session = {}));
    User.InitialRoles = [
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
})(User = exports.User || (exports.User = {}));
