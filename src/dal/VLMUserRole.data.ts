import { docClient, vlmMainTable } from "./common";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { VLMUserRole } from "../models/UserRole.model";

export abstract class VLMUserRoleDbManager {
  static get = async (id: number | string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: VLMUserRole.pk,
        sk: String(id),
      },
    };

    try {
      const VLMUserRoleRecord = await docClient.get(params).promise();
      return VLMUserRoleRecord.Item as VLMUserRole;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "VLMUserRole.data/get",
      });
    }
  };

  static put = async (vlmUserRole: VLMUserRole) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...vlmUserRole,
        ts: Date.now(),
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
