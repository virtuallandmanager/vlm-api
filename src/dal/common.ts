import { Alchemy } from "alchemy-sdk";
import AWS from "aws-sdk";
import DAX from "amazon-dax-client";
import { DynamoDB } from "aws-sdk";
import config from "../../config/config.js";

AWS.config.update(config.aws_remote_config);

const dynamodb = new AWS.DynamoDB(config.aws_remote_config);
if (process.env.NODE_ENV == "production") {
  const dax = new DAX(config.aws_dax_config);
  var daxdb = new AWS.DynamoDB({
    ...config.aws_dax_config.endpoints,
    service: dax,
  } as DynamoDB.ClientConfiguration);
}
export const docClient = new AWS.DynamoDB.DocumentClient({
  service: dynamodb,
});
export const daxClient =
  process.env.NODE_ENV == "production"
    ? docClient
    : new AWS.DynamoDB.DocumentClient({
        service: daxdb,
      });
export const alchemyEth = new Alchemy(config.alchemy_eth);
export const alchemyPoly = new Alchemy(config.alchemy_polygon);
export const vlmMainTable = process.env.NODE_ENV == "production" ? "VLM_Main" : `VLM_Main${process.env.DEV_TABLE_EXT}`;

export const vlmLogTable = process.env.NODE_ENV == "production" ? "VLM_Logs" : `VLM_Logs${process.env.DEV_TABLE_EXT}`;

export const vlmLandLegacyTable = "vlm_land";

export const batchQuery: CallableFunction = async (params: AWS.DynamoDB.QueryInput, allData: any[]) => {
  console.log("Querying Table");

  if (!allData) {
    allData = [];
  }

  let data = await docClient.query(params).promise();

  if (data["Items"].length > 0) {
    allData = [...allData, ...data["Items"]];
  }

  if (!params.Limit && data.LastEvaluatedKey) {
    params.ExclusiveStartKey = data.LastEvaluatedKey;
    return await batchQuery(params, allData);
  } else {
    let finalData = allData;
    return finalData;
  }
};

export interface IDbItem {
  pk?: string;
  sk?: string;
}
