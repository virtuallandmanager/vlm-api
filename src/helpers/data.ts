import AWS from "aws-sdk";
import config from "../../config/config.js";

AWS.config.update(config.aws_remote_config);
const docClient = new AWS.DynamoDB.DocumentClient();

export const largeQuery: any = async (params: any, allData: any) => {
  // console.log("Querying Table");

  if (!allData) {
    allData = [];
  }

  let data = await docClient.query(params).promise();

  if (data["Items"].length > 0) {
    allData = [...allData, ...data["Items"]];
  }

  if (!params.Limit && data.LastEvaluatedKey) {
    params.ExclusiveStartKey = data.LastEvaluatedKey;
    return await largeQuery(params, allData);
  } else {
    let finalData = allData;
    return finalData;
  }
};

export const largeScan: any = async (params: any, allData: any) => {
  // console.log("Scanning Table");

  if (!allData) {
    allData = [];
  }

  let data = await docClient.scan(params).promise();

  if (data["Items"].length > 0) {
    allData = [...allData, ...data["Items"]];
  }

  if (!params.Limit && data.LastEvaluatedKey) {
    params.ExclusiveStartKey = data.LastEvaluatedKey;
    return await largeScan(params, allData);
  } else {
    let finalData = allData;
    return finalData;
  }
};
