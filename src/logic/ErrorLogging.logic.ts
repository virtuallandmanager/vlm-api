import { AdminLogDbManager } from "../dal/ErrorLogging.data";

enum ELogType {
  INFO,
  WARNING,
  ERROR,
  FATAL,
}

export abstract class AdminLogManager {
  static retries: { [retryId: string]: number } = {};

  static logInfo = async (log: unknown, metadata: any) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, ELogType.INFO);
    } catch (error: any) {
      this.logError(error.error, metadata);
    }
  };
  static logWarning = async (log: unknown, metadata: any) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, ELogType.WARNING);
    } catch (error: any) {
      this.logError(error.error, metadata);
    }
  };
  static logError = async (log: unknown, metadata: any) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, ELogType.ERROR);
    } catch (error: any) {
      this.logError(error.error, metadata);
    }
  };
  static logFatal = async (log: unknown, metadata: any) => {
    try {
      await AdminLogDbManager.addLogToDb(log, metadata, ELogType.FATAL);
    } catch (error: any) {
      this.logError(error.error, metadata);
    }
  };
}
