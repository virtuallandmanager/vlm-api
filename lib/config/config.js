"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const alchemy_sdk_1 = require("alchemy-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
// config.logger = console;
dotenv_1.default.config();
exports.default = {
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
        network: alchemy_sdk_1.Network.MATIC_MAINNET,
    },
    alchemy_eth: {
        apiKey: process.env.ALCHEMY_API_KEY,
        network: alchemy_sdk_1.Network.ETH_MAINNET,
    },
    s3_bucket: process.env.S3_BUCKET
};
