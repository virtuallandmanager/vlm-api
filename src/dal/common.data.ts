import { Alchemy, Network } from "alchemy-sdk";
import AWS, { DynamoDB } from "aws-sdk";
import DAX from "amazon-dax-client";
import config from "../../config/config";

export let docClient: AWS.DynamoDB.DocumentClient;
export let daxClient: AWS.DynamoDB.DocumentClient;
export let alchemyEth: Alchemy = new Alchemy({ apiKey: process.env.ALCHEMY_API_KEY, network: Network.ETH_MAINNET });
export let alchemyPoly: Alchemy = new Alchemy({ apiKey: process.env.ALCHEMY_POLY_API_KEY, network: Network.MATIC_MAINNET });

if (process.env.NODE_ENV !== "development") {
  try {
    // For non-development environments, the environment already has the necessary permissions from the EC2 IAM role.
    // So just create the AWS service clients.
    AWS.config.update({
      region: process.env.AWS_REGION,
    });

    const dax = new DAX(config.aws_dax_config);
    var daxdb = new AWS.DynamoDB({
      ...config.aws_dax_config.endpoints,
      service: dax,
    } as DynamoDB.ClientConfiguration);

    let dynamodb = new AWS.DynamoDB(config.aws_config);

    docClient = new AWS.DynamoDB.DocumentClient({
      service: dynamodb,
    });

    daxClient = new AWS.DynamoDB.DocumentClient({
      service: daxdb,
    });
  } catch (error) {
    console.log("Error creating AWS service clients:", error);
  }
} else {
  // Load environment variables from developer's .env file
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
  });

  // Create AWS service clients
  docClient = new AWS.DynamoDB.DocumentClient();
  daxClient = docClient;
}

export let s3 = new AWS.S3({ region: process.env.AWS_REGION });
export const vlmMainTable = process.env.NODE_ENV == "production" ? "vlm_main" : `vlm_main${process.env.DEV_TABLE_EXT}`;
export const vlmAnalyticsTable = process.env.NODE_ENV == "production" ? "vlm_analytics" : `vlm_analytics${process.env.DEV_TABLE_EXT}`;
export const vlmLogTable = process.env.NODE_ENV == "production" ? "vlm_logs" : `vlm_logs${process.env.DEV_TABLE_EXT}`;
export const vlmUpdatesTable = process.env.NODE_ENV == "production" ? "vlm_updates" : `vlm_updates${process.env.DEV_TABLE_EXT}`;
export const vlmLandLegacyTable = "vlm_land";

export const batchQuery: CallableFunction = async (params: AWS.DynamoDB.QueryInput, allData: any[]) => {
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
  [key: string]: any;
}
