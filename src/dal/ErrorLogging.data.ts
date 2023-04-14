import { v4 as uuidv4 } from "uuid";
import { docClient } from "./common";

const logTable = "VLM_Logs";

enum ELogType {
  INFO,
  WARNING,
  ERROR,
  FATAL,
}

export abstract class AdminLogDbManager {
  static retries: { [retryId: string]: number } = {};

  static addLogToDb = async (
    message: unknown,
    metadata: any,
    type: ELogType,
    retryId?: string
  ) => {
    const timestamp = Date.now();

    const id = retryId || uuidv4(),
      environment = process.env.NODE_ENV;

    const params = {
      TableName: logTable,
      Item: {
        id,
        timestamp,
        type,
        message,
        metadata,
        environment,
      },
    };
    try {
      console.log(`${ELogType[type]} logged:`, message, metadata);
      await docClient.put(params).promise();
      if (this.retries[id]) {
        delete this.retries[id];
      }
      return id;
    } catch (error) {
      if (this.retries[id] && this.retries[id] > 5) {
        delete this.retries[id];
        return id;
      }
      this.retries.id++;
      this.addLogToDb(message, metadata, type);
      console.log(error);
      throw { error: JSON.stringify(error), metadata };
    }
  };
}
