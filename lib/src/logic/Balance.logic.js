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
exports.BalanceManager = void 0;
const Advertisement_model_1 = require("../models/Advertisement.model");
const Advertisement_data_1 = require("../dal/Advertisement.data");
const Organization_data_1 = require("../dal/Organization.data");
const User_data_1 = require("../dal/User.data");
class BalanceManager {
}
exports.BalanceManager = BalanceManager;
_a = BalanceManager;
BalanceManager.createAdvertisement = (adConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const event = new Advertisement_model_1.Advertisement(adConfig);
    return yield Advertisement_data_1.AdvertisementDbManager.put(event);
});
BalanceManager.adjustOrgBalance = (balance, adjustment) => __awaiter(void 0, void 0, void 0, function* () {
    balance.value += adjustment;
    return yield Organization_data_1.OrganizationDbManager.updateBalance(event);
});
BalanceManager.getUserBalance = (balanceId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User_data_1.UserDbManager.getBalance(balanceId);
});
BalanceManager.getOrgBalance = (balanceId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Organization_data_1.OrganizationDbManager.getBalance(balanceId);
});
