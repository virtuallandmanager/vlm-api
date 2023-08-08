import { Network } from "alchemy-sdk";
import dotenv from "dotenv";
dotenv.config();

export default {
  environment: process.env.NODE_ENV,
  environment_short: process.env.NODE_ENV == "production" ? "prod" : "dev",
  aws_config: {
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
  vpn_api: {
    apiKey: process.env.VPN_API_KEY,
  },
  presence_server: {
    host: process.env.PRESENCE_SERVER_HOST,
    port: Number(process.env.PRESENCE_SERVER_PORT),
  },
  s3_bucket: process.env.S3_BUCKET,
};
