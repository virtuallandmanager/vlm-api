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
exports.AdvertisementDbManager = void 0;
const Advertisement_model_1 = require("../models/Advertisement.model");
const common_data_1 = require("./common.data");
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
class AdvertisementDbManager {
}
exports.AdvertisementDbManager = AdvertisementDbManager;
_a = AdvertisementDbManager;
AdvertisementDbManager.obtain = (adConfig) => __awaiter(void 0, void 0, void 0, function* () {
    let existingAdvertisement, createdAdvertisement;
    try {
        existingAdvertisement = yield _a.get(adConfig);
        if (!existingAdvertisement) {
            createdAdvertisement = yield _a.put(adConfig);
        }
        return createdAdvertisement || existingAdvertisement;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Advertisement.data/obtain",
            adConfig,
        });
        return;
    }
});
AdvertisementDbManager.get = (adConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const ad = new Advertisement_model_1.Advertisement(adConfig), { pk, sk } = ad;
    const params = {
        TableName: common_data_1.vlmMainTable,
        Key: {
            pk,
            sk,
        },
    };
    try {
        const adRecord = yield common_data_1.docClient.get(params).promise();
        return adRecord.Item;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Advertisement.data/get",
            adConfig,
        });
        return;
    }
});
AdvertisementDbManager.put = (adConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const ad = new Advertisement_model_1.Advertisement(adConfig);
    const params = {
        TableName: common_data_1.vlmMainTable,
        Item: Object.assign(Object.assign({}, ad), { ts: Date.now() }),
    };
    try {
        const adRecord = yield common_data_1.docClient.put(params).promise();
        return adRecord.Attributes;
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Advertisement.data/put",
            adConfig,
        });
        return;
    }
});
