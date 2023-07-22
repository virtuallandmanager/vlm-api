import { Alchemy } from "alchemy-sdk";
import AWS, { DynamoDB } from "aws-sdk";
import DAX from "amazon-dax-client";
import config from "../../config/config";

export let docClient: AWS.DynamoDB.DocumentClient;
export let daxClient: AWS.DynamoDB.DocumentClient;
export let s3: AWS.S3;
export let alchemyEth: Alchemy;
export let alchemyPoly: Alchemy;
let secretsManager: AWS.SecretsManager;
let ssm = new AWS.SSM();

export async function initDbClients() {
  if (process.env.NODE_ENV === "production") {
    const presence = await getRedisServer();
    config.presence_server = JSON.parse(presence);
  }

  if (process.env.NODE_ENV !== "development") {
    // For non-development environments, the environment already has the necessary permissions from the EC2 IAM role.
    // So just create the AWS service clients.
    AWS.config.update({
      region: process.env.AWS_REGION,
    });

    config.aws_dax_config.endpoints = [await getDaxEndpoint()];

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
    await natasha();
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
  // Secrets Manager and S3 are the same for all environments
  secretsManager = new AWS.SecretsManager();
  s3 = new AWS.S3();

  return config.presence_server;
}

function getDaxEndpoint(retries: number = 5, delay: number = 3000): Promise<string> {
  const param = {
    Name: "/config/dax-endpoint",
    WithDecryption: true,
  };

  return new Promise((resolve, reject) => {
    const attempt = async (retries: number) => {
      try {
        const response = await ssm.getParameter(param).promise();
        resolve(response.Parameter?.Value);
      } catch (error) {
        if (retries === 0) {
          reject(error);
        } else {
          setTimeout(attempt, delay, retries - 1);
        }
      }
    };

    attempt(retries);
  });
}

export function getRedisServer(retries: number = 5, delay: number = 3000): Promise<string> {
  const param = {
    Name: "/config/vlm-presence-server",
    WithDecryption: true,
  };

  return new Promise((resolve, reject) => {
    const attempt = async (retries: number) => {
      try {
        const response = await ssm.getParameter(param).promise();
        resolve(response.Parameter?.Value);
      } catch (error) {
        if (retries === 0) {
          reject(error);
        } else {
          setTimeout(attempt, delay, retries - 1);
        }
      }
    };

    attempt(retries);
  });
}

async function natasha() {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: `${process.env.NODE_ENV}/vlm-api` }).promise();

    if (data.SecretString) {
      const newData = JSON.parse(data.SecretString);
      config.alchemy_eth.apiKey = newData.vlm_alchemy_api_key;
      config.alchemy_polygon.apiKey = newData.vlm_alchemy_polygon_api_key;
      config.vpn_api.apiKey = newData.vlm_vpn_api_key;
      return config;
    } else {
      let buff = Buffer.from(data.SecretBinary as string, "base64");
      return buff.toString("ascii");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

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
