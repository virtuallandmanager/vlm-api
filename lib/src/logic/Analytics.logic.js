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
exports.AnalyticsManager = void 0;
const AnalyticsUser_data_1 = require("../dal/AnalyticsUser.data");
const UserWallet_data_1 = require("../dal/UserWallet.data");
const Analytics_model_1 = require("../models/Analytics.model");
class AnalyticsManager {
}
exports.AnalyticsManager = AnalyticsManager;
_a = AnalyticsManager;
AnalyticsManager.createUser = (userConfig) => __awaiter(void 0, void 0, void 0, function* () {
    return yield AnalyticsUser_data_1.AnalyticsUserDbManager.put(userConfig);
});
AnalyticsManager.getUser = (userConfig) => __awaiter(void 0, void 0, void 0, function* () {
    return yield AnalyticsUser_data_1.AnalyticsUserDbManager.get(userConfig);
});
AnalyticsManager.getUserById = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    return yield AnalyticsUser_data_1.AnalyticsUserDbManager.getById(sk);
});
AnalyticsManager.updateUser = (userConfig) => __awaiter(void 0, void 0, void 0, function* () {
    return yield AnalyticsUser_data_1.AnalyticsUserDbManager.put(userConfig);
});
AnalyticsManager.obtainUserByWallet = (walletConfig, userConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = new Analytics_model_1.Analytics.User.Wallet(walletConfig);
    const dbWallet = yield UserWallet_data_1.UserWalletDbManager.obtain(wallet);
    const user = new Analytics_model_1.Analytics.User.Account(Object.assign({ connectedWallet: dbWallet.sk }, userConfig));
    const dbUser = yield AnalyticsUser_data_1.AnalyticsUserDbManager.obtain(user);
    return dbUser;
});
AnalyticsManager.obtainUser = (userConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const user = new Analytics_model_1.Analytics.User.Account(userConfig);
    return yield AnalyticsUser_data_1.AnalyticsUserDbManager.obtain(user);
});
