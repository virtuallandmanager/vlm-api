"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Organization = void 0;
const uuid_1 = require("uuid");
var Organization;
(function (Organization) {
    class Account {
        ;
        constructor(config) {
            this.pk = Account.pk;
            this.sk = (0, uuid_1.v4)();
            this.displayName = "AnonCo";
            this.legalName = "";
            this.createdAt = Date.now();
            Object.keys(config).forEach((key) => {
                this[key] = config[key];
            });
        }
    }
    Account.pk = "vlm:organization:account";
    Organization.Account = Account;
    class UserConnector {
        constructor(config) {
            this.pk = UserConnector.pk;
            this.sk = (0, uuid_1.v4)();
            this.orgId = config.account.sk;
            this.userId = config.user.sk;
            this.userRole = config.role;
        }
    }
    UserConnector.pk = "vlm:organization:user";
    Organization.UserConnector = UserConnector;
    class Balance {
        constructor(config) {
            this.pk = Balance.pk;
            this.sk = (0, uuid_1.v4)();
            Object.keys(config).forEach((key) => {
                this[key] = config[key];
            });
        }
    }
    Balance.pk = "vlm:organization:account:balance";
    Organization.Balance = Balance;
    class Status {
        constructor(config) {
            this.pk = Status.pk;
            this.sk = (0, uuid_1.v4)();
            this.adjust = (newValue) => {
                this.value += newValue;
            };
            Object.keys(config).forEach((key) => {
                this[key] = config[key];
            });
        }
    }
    Status.pk = "vlm:organization:account:status";
    Organization.Status = Status;
    class Role {
        constructor(id, name, description) {
            this.sk = String(id);
            this.name = name;
            this.description = description;
        }
    }
    Role.pk = "vlm:organization:role";
    Organization.Role = Role;
    let Roles;
    (function (Roles) {
        Roles[Roles["ORG_GUEST"] = 0] = "ORG_GUEST";
        Roles[Roles["ORG_EMPLOYEE"] = 1] = "ORG_EMPLOYEE";
        Roles[Roles["ORG_MANAGER"] = 2] = "ORG_MANAGER";
        Roles[Roles["ORG_DEVELOPER"] = 3] = "ORG_DEVELOPER";
        Roles[Roles["ORG_ADMIN"] = 4] = "ORG_ADMIN";
        Roles[Roles["ORG_OWNER"] = 5] = "ORG_OWNER";
    })(Roles = Organization.Roles || (Organization.Roles = {}));
})(Organization = exports.Organization || (exports.Organization = {}));
