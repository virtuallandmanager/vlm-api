import { Network } from "alchemy-sdk";
import { DynamoDB } from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

export default {
  aws_local_config: {
    //Provide details for local configuration
  },
  aws_remote_config: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
  },
  aws_dax_config: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    endpoints: [process.env.AWS_DAX_ENDPOINT],
    region: process.env.AWS_REGION,
  },
  alchemy_polygon: {
    apiKey: process.env.ALCHEMY_POLYGON_API_KEY,
    network: Network.MATIC_MAINNET,
  },
  alchemy_eth: {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  },
};
