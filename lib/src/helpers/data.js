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
exports.largeScan = exports.largeQuery = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const config_1 = __importDefault(require("../../config/config"));
const common_data_1 = require("../dal/common.data");
aws_sdk_1.default.config.update(config_1.default.aws_remote_config);
const docClient = new aws_sdk_1.default.DynamoDB.DocumentClient();
const largeQuery = (params, options = { cache: false }, allData) => __awaiter(void 0, void 0, void 0, function* () {
    if (!allData) {
        allData = [];
    }
    if (options.cache) {
        var data = yield common_data_1.daxClient.query(params).promise();
    }
    else {
        var data = yield docClient.query(params).promise();
    }
    if (data["Items"].length > 0) {
        allData = [...allData, ...data["Items"]];
    }
    if (!params.Limit && data.LastEvaluatedKey) {
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        return yield (0, exports.largeQuery)(params, options, allData);
    }
    else {
        let finalData = allData;
        return finalData;
    }
});
exports.largeQuery = largeQuery;
const largeScan = (params, chunkCb, allData) => __awaiter(void 0, void 0, void 0, function* () {
    if (!allData) {
        allData = [];
    }
    let data = yield docClient.scan(params).promise();
    if (data["Items"].length > 0) {
        allData = [...allData, ...data["Items"]];
        yield chunkCb(data["Items"]);
    }
    if (!params.Limit && data.LastEvaluatedKey) {
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        return yield (0, exports.largeScan)(params, chunkCb, allData);
    }
    else {
        let finalData = allData;
        return finalData;
    }
});
exports.largeScan = largeScan;
