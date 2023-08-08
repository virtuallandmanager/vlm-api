import axios from "axios";
import { AdminLogDbManager } from "../dal/ErrorLogging.data";
import config from "../../config/config";
import { Log } from "../models/Log.model";
import { User } from "../models/User.model";

export abstract class AdminLogManager {
  static retries: { [retryId: string]: number } = {};

  static logInfo = async (log: unknown, metadata: any, userInfo?: User.Account) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.INFO);
    } catch (error: any) {
      this.logError(error, { from: "AdminLogManager.logInfo", metadata });
    }
  };
  static logWarning = async (log: unknown, metadata: any, userInfo?: User.Account) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.WARNING);
    } catch (error: any) {
      this.logError(error, { from: "AdminLogManager.logWarning", metadata });
    }
  };
  static logError = async (log: unknown, metadata: any, userInfo?: User.Account, noCatch?: boolean) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.ERROR);
    } catch (error: any) {
      if (noCatch) {
        return;
      }
      this.logError(error, { from: "AdminLogManager.logError", metadata, failedOnce: true }, userInfo, true);
    }
  };
  static logFatal = async (log: unknown, metadata: any, userInfo: User.Account) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.FATAL);
    } catch (error: any) {
      this.logError(error, { from: "AdminLogManager.logFatal", metadata });
    }
  };
  static logWAT = async (log: unknown, metadata: any, userInfo?: User.Account) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.WAT);
    } catch (error: any) {
      this.logError(error, { from: "AdminLogManager.logWAT", metadata });
    }
  };
  static logExternalError = async (log: unknown, metadata: any, userInfo?: User.Account) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, userInfo, Log.Type.ERROR);
      this.logErrorToDiscord(`
      :rotating_light: -- ${userInfo ? "USER-REPORTED " : ""}ERROR LOGGED FROM ${config.environment.toUpperCase()} -- :rotating_light:\n
      <@&1041552453918801973>\n
      TIME:\n
      **${new Date().toLocaleString()}**\n\n
      ERROR:\n
      \`\`\`json\n${JSON.stringify(log, null, 2)}\n\`\`\`\n
      METADATA:\n
      \`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\`\n
      ${
        userInfo
          ? `AFFECTED USER:\n
      \`\`\`json\n${JSON.stringify(userInfo, null, 2)}\n\`\`\`\n`
          : ""
      }
      :rotating_light: -- END ERROR -- :rotating_light:\n
      `);
    } catch (error: any) {
      this.logError(error, { from: "AdminLogManager.logExternalError", metadata });
    }
  };

  static logErrorToDiscord = async (content: string, wat: boolean = false): Promise<void> => {
    try {
      const webhook = wat ? process.env.DISCORD_WAT_WEBHOOK : process.env.DISCORD_ERROR_WEBHOOK;
      await axios.post(webhook, {
        content,
      });
    } catch (error: any) {
      throw `Failed to send Discord message: ${error}`;
    }
  };
}
