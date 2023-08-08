"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchQuery = exports.vlmLandLegacyTable = exports.vlmUpdatesTable = exports.vlmLogTable = exports.vlmAnalyticsTable = exports.vlmMainTable = exports.s3 = exports.alchemyPoly = exports.alchemyEth = exports.daxClient = exports.docClient = void 0;
const alchemy_sdk_1 = require("alchemy-sdk");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const amazon_dax_client_1 = __importDefault(require("amazon-dax-client"));
const config_1 = __importDefault(require("../../config/config"));
exports.alchemyEth = new alchemy_sdk_1.Alchemy({ apiKey: process.env.ALCHEMY_API_KEY, network: alchemy_sdk_1.Network.ETH_MAINNET });
exports.alchemyPoly = new alchemy_sdk_1.Alchemy({ apiKey: process.env.ALCHEMY_POLY_API_KEY, network: alchemy_sdk_1.Network.MATIC_MAINNET });
if (process.env.NODE_ENV !== "development") {
    try {
        // For non-development environments, the environment already has the necessary permissions from the EC2 IAM role.
        // So just create the AWS service clients.
        aws_sdk_1.default.config.update({
            region: process.env.AWS_REGION,
        });
        const dax = new amazon_dax_client_1.default(config_1.default.aws_dax_config);
        var daxdb = new aws_sdk_1.default.DynamoDB(Object.assign(Object.assign({}, config_1.default.aws_dax_config.endpoints), { service: dax }));
        let dynamodb = new aws_sdk_1.default.DynamoDB(config_1.default.aws_config);
        exports.docClient = new aws_sdk_1.default.DynamoDB.DocumentClient({
            service: dynamodb,
        });
        exports.daxClient = new aws_sdk_1.default.DynamoDB.DocumentClient({
            service: daxdb,
        });
    }
    catch (error) {
        console.log("Error creating AWS service clients:", error);
    }
}
else {
    // Load environment variables from developer's .env file
    aws_sdk_1.default.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION,
    });
    // Create AWS service clients
    exports.docClient = new aws_sdk_1.default.DynamoDB.DocumentClient();
    exports.daxClient = exports.docClient;
}
exports.s3 = new aws_sdk_1.default.S3({ region: process.env.AWS_REGION });
exports.vlmMainTable = process.env.NODE_ENV == "production" ? "vlm_main" : `vlm_main${process.env.DEV_TABLE_EXT}`;
exports.vlmAnalyticsTable = process.env.NODE_ENV == "production" ? "vlm_analytics" : `vlm_analytics${process.env.DEV_TABLE_EXT}`;
exports.vlmLogTable = process.env.NODE_ENV == "production" ? "vlm_logs" : `vlm_logs${process.env.DEV_TABLE_EXT}`;
exports.vlmUpdatesTable = process.env.NODE_ENV == "production" ? "vlm_updates" : `vlm_updates${process.env.DEV_TABLE_EXT}`;
exports.vlmLandLegacyTable = "vlm_land";
const batchQuery = (params, allData) => __awaiter(void 0, void 0, void 0, function* () {
    if (!allData) {
        allData = [];
    }
    let data = yield exports.docClient.query(params).promise();
    if (data["Items"].length > 0) {
        allData = [...allData, ...data["Items"]];
    }
    if (!params.Limit && data.LastEvaluatedKey) {
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        return yield (0, exports.batchQuery)(params, allData);
    }
    else {
        let finalData = allData;
        return finalData;
    }
});
exports.batchQuery = batchQuery;
