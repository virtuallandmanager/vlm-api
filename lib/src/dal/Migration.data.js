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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationDbManager = void 0;
const common_data_1 = require("./common.data");
class MigrationDbManager {
}
exports.MigrationDbManager = MigrationDbManager;
_a = MigrationDbManager;
MigrationDbManager.moveDataInBatches = (sourceTableName, destinationTableName, batchSize) => __awaiter(void 0, void 0, void 0, function* () {
    let lastEvaluatedKey;
    let shouldContinue = true;
    while (shouldContinue) {
        const scanParams = {
            TableName: sourceTableName,
            Limit: batchSize,
            ExclusiveStartKey: lastEvaluatedKey,
        };
        const scanResult = yield common_data_1.docClient.scan(scanParams).promise();
        const items = scanResult.Items;
        const batchWriteParams = {
            RequestItems: {
                [destinationTableName]: items.map((item) => ({
                    PutRequest: {
                        Item: item,
                    },
                })),
            },
        };
        yield common_data_1.docClient.batchWrite(batchWriteParams).promise();
        lastEvaluatedKey = scanResult.LastEvaluatedKey;
        shouldContinue = !!lastEvaluatedKey;
    }
    console.log("Data migration completed.");
});
