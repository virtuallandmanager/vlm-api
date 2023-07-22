import { AdminDbManager } from "../dal/Admin.data";

export abstract class AdminManager {
  static getAdminPanelKeys: CallableFunction = async () => {
    const users = await AdminManager.getUsers(),
      organizations = await AdminManager.getOrganizations(),
      scenes = await AdminManager.getScenes(),
      events = await AdminManager.getEvents(),
      analyticsSessions = await AdminManager.getAnalyticsSessions(),
      userSessions = await AdminManager.getUserSessions();

    return { users, organizations, scenes, events, analyticsSessions, userSessions };
  };
  static getEvents: CallableFunction = async(pageSize?: number, lastEvaluated?: string) => {
    return (await AdminDbManager.getEvents(pageSize, lastEvaluated)) || [];
  };
  static getOrganizations: CallableFunction = async (pageSize?: number, lastEvaluated?: string)=> {
    return (await AdminDbManager.getOrganizations(pageSize, lastEvaluated)) || [];
  };
  static getScenes: CallableFunction = async (pageSize?: number, lastEvaluated?: string) => {
    return (await AdminDbManager.getScenes(pageSize, lastEvaluated)) || [];
  };
  static getUsers: CallableFunction = async (pageSize?: number, lastEvaluated?: string) => {
    return (await AdminDbManager.getUsers(pageSize, lastEvaluated)) || [];
  };
  static getUserSessions: CallableFunction = async (pageSize?: number, lastEvaluated?: string) => {
    return (await AdminDbManager.getUserSessions(pageSize, lastEvaluated)) || [];
  };
  static getAnalyticsSessions: CallableFunction = async (pageSize?: number, lastEvaluated?: string) => {
    return (await AdminDbManager.getAnalyticsSessions(pageSize, lastEvaluated)) || [];
  };
}
