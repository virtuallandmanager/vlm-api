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
type AnyObject = { [key: string]: any };

export function deepEqual(a: AnyObject, b: AnyObject): boolean {
  // Check if a and b are both objects and not null.
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    // Get the keys of both objects.
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Check if both objects have the same number of properties.
    if (keysA.length !== keysB.length) {
      return false;
    }

    // Check each key in the first object.
    for (const key of keysA) {
      // Check if the key exists in the second object and if the values of the key in both objects are the same.
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }

    // If the loop completes without returning false, the objects are deeply equal.
    return true;
  } else {
    // If a and b are not both objects, check if they are strictly equal.
    return a === b;
  }
}