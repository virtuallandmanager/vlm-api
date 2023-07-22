import { AdminLogDbManager } from "../dal/ErrorLogging.data";

enum Type {
  INFO,
  WARNING,
  ERROR,
  FATAL,
}

export abstract class AdminLogManager {
  static retries: { [retryId: string]: number } = {};

  static logInfo = async (log: unknown, metadata: any) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, Type.INFO);
    } catch (error: any) {
      this.logError(error, { from: "AdminLogManager.logInfo", metadata });
    }
  };
  static logWarning = async (log: unknown, metadata: any) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, Type.WARNING);
    } catch (error: any) {
      this.logError(error, { from: "AdminLogManager.logWarning", metadata });
    }
  };
  static logError = async (log: unknown, metadata: any, noCatch?: boolean) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, Type.ERROR);
    } catch (error: any) {
      if (noCatch) {
        return;
      }
      this.logError(error, { from: "AdminLogManager.logError", metadata });
    }
  };
  static logFatal = async (log: unknown, metadata: any) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, Type.FATAL);
    } catch (error: any) {
      this.logError(error, { from: "AdminLogManager.logFatal", metadata });
    }
  };
}
