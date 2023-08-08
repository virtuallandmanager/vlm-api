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
exports.UserManager = void 0;
const Balance_data_1 = require("../dal/Balance.data");
const Generic_data_1 = require("../dal/Generic.data");
const Scene_data_1 = require("../dal/Scene.data");
const Transaction_data_1 = require("../dal/Transaction.data");
const User_data_1 = require("../dal/User.data");
const UserWallet_data_1 = require("../dal/UserWallet.data");
const User_model_1 = require("../models/User.model");
class UserManager {
}
exports.UserManager = UserManager;
_a = UserManager;
UserManager.create = (vlmUser) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User_data_1.UserDbManager.put(vlmUser);
});
UserManager.get = (vlmUser) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User_data_1.UserDbManager.get(vlmUser);
});
UserManager.getById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User_data_1.UserDbManager.getById(userId);
});
UserManager.getAdminLevel = (vlmUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!vlmUser.roles) {
        return User_model_1.User.Roles.BASIC_USER;
    }
    return Math.max(...vlmUser.roles);
});
UserManager.update = (vlmUser) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User_data_1.UserDbManager.put(vlmUser);
});
UserManager.updateIp = (vlmUser) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User_data_1.UserDbManager.updateIp(vlmUser);
});
UserManager.obtainUserByWallet = (walletConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = new User_model_1.User.Wallet(walletConfig);
    const userWallet = yield UserWallet_data_1.UserWalletDbManager.obtain(wallet);
    const user = new User_model_1.User.Account({ sk: userWallet.userId, connectedWallet: userWallet.sk });
    const dbUser = yield User_data_1.UserDbManager.obtain(user);
    return dbUser;
});
UserManager.obtain = (user) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User_data_1.UserDbManager.obtain(user);
});
UserManager.injectUiData = (vlmUser) => __awaiter(void 0, void 0, void 0, function* () {
    const uiUserInfo = new User_model_1.User.Aggregates();
    uiUserInfo.walletIds = yield UserWallet_data_1.UserWalletDbManager.getIdsForUser(vlmUser);
    uiUserInfo.sceneIds = yield Scene_data_1.SceneDbManager.getIdsForUser(vlmUser.sk);
    uiUserInfo.transactionIds = yield Transaction_data_1.TransactionDbManager.getIdsForUser(vlmUser.sk);
    uiUserInfo.balanceIds = yield Balance_data_1.BalanceDbManager.getIdsForUser(vlmUser);
});
UserManager.createUserRoles = () => __awaiter(void 0, void 0, void 0, function* () {
    yield User_model_1.User.InitialRoles.forEach((role) => __awaiter(void 0, void 0, void 0, function* () {
        return (yield Generic_data_1.GenericDbManager.put(role));
    }));
});
UserManager.createSceneLink = (sceneLink) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Generic_data_1.GenericDbManager.put(sceneLink));
});
UserManager.createMediaLink = (mediaLink) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Generic_data_1.GenericDbManager.put(mediaLink));
});
// getUserRole gets the name and description of a user role by the id of that user role.
// to get roles for a userId, get a user account and look at the roles attribute.
UserManager.getUserRole = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User_data_1.UserDbManager.getUserRole(id);
});
