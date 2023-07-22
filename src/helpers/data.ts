import { DocumentClient } from "aws-sdk/clients/dynamodb.js";
import { daxClient, docClient } from "../dal/common.data";

export const largeQuery: CallableFunction = async (params: DocumentClient.QueryInput, options: { cache: boolean } = { cache: false }, allData?: DocumentClient.AttributeMap[]) => {
  if (!allData) {
    allData = [];
  }

  if (options.cache) {
    var data = await daxClient.query(params).promise();
  } else {
    var data = await docClient.query(params).promise();
  }

  if (data["Items"].length > 0) {
    allData = [...allData, ...data["Items"]];
  }

  if (!params.Limit && data.LastEvaluatedKey) {
    params.ExclusiveStartKey = data.LastEvaluatedKey;
    return await largeQuery(params, options, allData);
  } else {
    let finalData = allData;
    return finalData;
  }
};

export const largeScan: CallableFunction = async (params: DocumentClient.QueryInput, chunkCb?: CallableFunction, allData?: DocumentClient.AttributeMap[]) => {
  if (!allData) {
    allData = [];
  }

  let data = await docClient.scan(params).promise();
  if (data["Items"].length > 0) {
    allData = [...allData, ...data["Items"]];
    await chunkCb(data["Items"]);
  }
  if (!params.Limit && data.LastEvaluatedKey) {
    params.ExclusiveStartKey = data.LastEvaluatedKey;
    return await largeScan(params, chunkCb, allData);
  } else {
    let finalData = allData;
    return finalData;
  }
};
