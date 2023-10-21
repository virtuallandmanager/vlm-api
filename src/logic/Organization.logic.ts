import { OrganizationDbManager } from "../dal/Organization.data";
import { InitialBalances } from "../models/Balance.model";
import { Organization } from "../models/Organization.model";
import { User } from "../models/User.model";

export abstract class OrganizationManager {
  static create: CallableFunction = async (userConfig: User.Config, orgConfig?: Organization.Config) => {
    const user = new User.Account(userConfig),
      org = new Organization.Account(orgConfig),
      orgUserCon = OrganizationManager.addOrgMember(org, user, Organization.Roles.ORG_OWNER),
      orgBalances = OrganizationManager.initBalances(org),
      userOrgs = await OrganizationManager.getUserOrgs(user.sk),
      ownedOrgs = userOrgs.filter((org: Organization.Account) => {
        return org.userRole == Organization.Roles.ORG_OWNER;
      });
    if (userOrgs && ownedOrgs.length) {
      return;
    }
    return await OrganizationDbManager.init(org, orgUserCon, orgBalances);
  };

  static update: CallableFunction = async (orgConfig?: Organization.Config) => {
    const org = new Organization.Account(orgConfig);
    return await OrganizationDbManager.update(org);
  };

  static get: CallableFunction = async (orgConfig: Organization.Config) => {
    const org = new Organization.Account(orgConfig);
    return await OrganizationDbManager.get(org);
  };

  static getById: CallableFunction = async (id: string) => {
    return await OrganizationDbManager.getById(id);
  };

  static getUserOrgs: CallableFunction = async (userId: string, roleFilter?: Organization.Roles) => {
    const userOrgCons = await OrganizationDbManager.getUserConsByUserId(userId, roleFilter);
    if (!userOrgCons.length) {
      return [];
    }
    const userOrgIds = userOrgCons.map((userOrgCon: Organization.UserConnector) => userOrgCon.orgId);
    const userOrgs = await OrganizationDbManager.getByIds(userOrgIds);
    return userOrgs;
  };

  static addMember: CallableFunction = async (orgConfig?: Organization.Config, userConfig?: User.Config) => {
    const user = new User.Account(userConfig);
    const org = new Organization.Account(orgConfig);

    return await OrganizationDbManager.update(org);
  };

  static addOrgMember: CallableFunction = (account: Organization.Account, user: User.Account, role: Organization.Roles) => {
    return new Organization.UserConnector({ account, user, role });
  };

  static initBalances: CallableFunction = (organization: Organization.Account) => {
    return InitialBalances.organization.map((balanceConfig) => new Organization.Balance({ orgId: organization.sk, ...balanceConfig }));
  };
}
