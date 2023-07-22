import { v4 as uuidv4 } from "uuid";
import { docClient, vlmLogTable } from "./common.data";
import { Log } from "../models/Log.model";
import { DateTime } from "luxon";

enum ELogType {
  INFO,
  WARNING,
  ERROR,
  FATAL,
}

export abstract class AdminLogDbManager {
  static retries: { [retryId: string]: number } = {};

  static addLogToDb = async (message: unknown, metadata: Log.MetadataConfig, type: Log.Type, retryId?: string) => {
    const ts = DateTime.now().toUnixInteger(),
      sk = retryId || uuidv4(),
      environment = process.env.NODE_ENV;
    let newLog;

    if (!metadata) {
      metadata = {};
    }

    switch (type) {
      case Log.Type.INFO:
        newLog = new Log.AdminLogInfo({ sk, type, message, metadata, environment, ts });
        break;
      case Log.Type.WARNING:
        newLog = new Log.AdminLogWarning({ sk, type, message, metadata, environment, ts });
        break;
      case Log.Type.ERROR:
        newLog = new Log.AdminLogError({ sk, type, message, metadata, environment, ts });
        break;
      case Log.Type.FATAL:
        newLog = new Log.AdminLogFatal({ sk, type, message, metadata, environment, ts });
        break;
    }

    const params = {
      TableName: vlmLogTable,
      Item: newLog,
    };
    try {
      console.log(`${ELogType[type]} logged${metadata.from ? ` from ${metadata.from}` : ""}:`, metadata, message);
      await docClient.put(params).promise();
      if (this.retries[sk]) {
        delete this.retries[sk];
      }
      return sk;
    } catch (error) {
      if (this.retries[sk] && this.retries[sk] > 5) {
        delete this.retries[sk];
        return sk;
      }
      this.retries.id++;
      await this.addLogToDb(message, metadata, type, sk);
      console.log(error);
      return { error: JSON.stringify(error), metadata };
    }
  };
}
