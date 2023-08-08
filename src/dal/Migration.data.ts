import { User } from "../models/User.model";
import { daxClient, docClient, vlmLandLegacyTable, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import DynamoDB, { AttributeMap, DocumentClient } from "aws-sdk/clients/dynamodb";
import { largeQuery } from "../helpers/data";
import { Scene } from "../models/Scene.model";

export abstract class MigrationDbManager {
  static moveDataInBatches: CallableFunction = async (sourceTableName: string, destinationTableName: string, batchSize: number): Promise<void> => {
    let lastEvaluatedKey: DynamoDB.DocumentClient.Key | undefined;
    let shouldContinue = true;

    while (shouldContinue) {
      const scanParams: DynamoDB.DocumentClient.ScanInput = {
        TableName: sourceTableName,
        Limit: batchSize,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const scanResult = await docClient.scan(scanParams).promise();
      const items = scanResult.Items;

      const batchWriteParams: DynamoDB.DocumentClient.BatchWriteItemInput = {
        RequestItems: {
          [destinationTableName]: items.map((item) => ({
            PutRequest: { 
              Item: item,
            },
          })),
        },
      };

      await docClient.batchWrite(batchWriteParams).promise();

      lastEvaluatedKey = scanResult.LastEvaluatedKey;
      shouldContinue = !!lastEvaluatedKey;
    }

    console.log("Data migration completed.");
  };
}
