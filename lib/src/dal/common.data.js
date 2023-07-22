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
exports.batchQuery = exports.vlmLandLegacyTable = exports.vlmLogTable = exports.vlmAnalyticsTable = exports.vlmMainTable = exports.alchemyPoly = exports.alchemyEth = exports.daxClient = exports.docClient = exports.s3 = void 0;
const alchemy_sdk_1 = require("alchemy-sdk");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const amazon_dax_client_1 = __importDefault(require("amazon-dax-client"));
const config_1 = __importDefault(require("../../config/config"));
aws_sdk_1.default.config.update(config_1.default.aws_remote_config);
const dynamodb = new aws_sdk_1.default.DynamoDB(config_1.default.aws_remote_config);
exports.s3 = new aws_sdk_1.default.S3();
if (process.env.NODE_ENV == "production") {
    const dax = new amazon_dax_client_1.default(config_1.default.aws_dax_config);
    var daxdb = new aws_sdk_1.default.DynamoDB(Object.assign(Object.assign({}, config_1.default.aws_dax_config.endpoints), { service: dax }));
}
exports.docClient = new aws_sdk_1.default.DynamoDB.DocumentClient({
    service: dynamodb,
});
exports.daxClient = process.env.NODE_ENV == "production"
    ? exports.docClient
    : new aws_sdk_1.default.DynamoDB.DocumentClient({
        service: daxdb,
    });
exports.alchemyEth = new alchemy_sdk_1.Alchemy(config_1.default.alchemy_eth);
exports.alchemyPoly = new alchemy_sdk_1.Alchemy(config_1.default.alchemy_polygon);
// export const vlmMainTable = "VLM_Main" ;
exports.vlmMainTable = process.env.NODE_ENV == "production" ? "VLM_Main" : `VLM_Main${process.env.DEV_TABLE_EXT}`;
// export const vlmAnalyticsTable = "VLM_Analytics";
exports.vlmAnalyticsTable = process.env.NODE_ENV == "production" ? "VLM_Analytics" : `VLM_Analytics${process.env.DEV_TABLE_EXT}`;
exports.vlmLogTable = process.env.NODE_ENV == "production" ? "VLM_Logs" : `VLM_Logs${process.env.DEV_TABLE_EXT}`;
exports.vlmLandLegacyTable = "vlm_land";
const batchQuery = (params, allData) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Querying Table");
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
