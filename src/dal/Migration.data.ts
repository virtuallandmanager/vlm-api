import { docClient } from "./common.data";
import DynamoDB from "aws-sdk/clients/dynamodb";

export abstract class MigrationDbManager {
  static moveDataInBatches: CallableFunction = async (pk: string, sourceTableName: string, destinationTableName: string, batchSize: number): Promise<void> => {
    let lastEvaluatedKey: DynamoDB.DocumentClient.Key | undefined;
    let shouldContinue = true;

    while (shouldContinue) {
      const queryParams: DynamoDB.DocumentClient.QueryInput = {
        TableName: sourceTableName,
        KeyConditionExpression: '#pk = :pkVal',
        ExpressionAttributeNames: {
          '#pk': "pk"
        },
        ExpressionAttributeValues: {
          ':pkVal': pk
        },
        Limit: batchSize,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const queryResult = await docClient.query(queryParams).promise();
      const items = queryResult.Items;

      if (items?.length) {
        const transformedItems = items.map((item) => {
          if (item.action) {
            switch (item.action) {
              case "create":
                item.action = "created";
                break;
              case "update":
                item.action = "updated";
                break;
              case "delete":
                item.action = "deleted";
                break;
            }
          }
          return item;
        });

        const batchWriteParams: DynamoDB.DocumentClient.BatchWriteItemInput = {
          RequestItems: {
            [destinationTableName]: transformedItems.map((item) => ({
              PutRequest: {
                Item: item,
              },
            })),
          },
        };
        await docClient.batchWrite(batchWriteParams).promise();
      }

      lastEvaluatedKey = queryResult.LastEvaluatedKey;
      shouldContinue = !!lastEvaluatedKey;
    }

    console.log("Data migration completed.");
  };


}