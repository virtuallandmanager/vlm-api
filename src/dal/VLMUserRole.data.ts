import { docClient, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { User } from "../models/User.model";
import { DateTime } from "luxon";

export abstract class VLMUserRoleDbManager {
  static get = async (id: number | string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: User.Role.pk,
        sk: String(id),
      },
    };

    try {
      const VLMUserRoleRecord = await docClient.get(params).promise();
      return VLMUserRoleRecord.Item as User.Role;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "VLMUserRole.data/get",
      });
    }
  };

  static put = async (vlmUserRole: User.Role) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...vlmUserRole,
        ts: DateTime.now().toUnixInteger(),
      },
    };

    try {
      await docClient.put(params).promise();
      return vlmUserRole;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "VLMUserRole.data/put",
        vlmUserRole,
      });
    }
  };
}
