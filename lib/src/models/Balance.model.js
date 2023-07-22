"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoBalances = exports.BalanceType = void 0;
var BalanceType;
(function (BalanceType) {
    BalanceType[BalanceType["GIFT"] = 0] = "GIFT";
    BalanceType[BalanceType["ANALYTICS"] = 1] = "ANALYTICS";
    BalanceType[BalanceType["AIRDROP"] = 2] = "AIRDROP";
    BalanceType[BalanceType["ATTENDANCE_TOKEN"] = 3] = "ATTENDANCE_TOKEN";
})(BalanceType = exports.BalanceType || (exports.BalanceType = {}));
exports.PromoBalances = {
    user: [{ type: BalanceType.AIRDROP, value: 1000 }],
    organization: [{ type: BalanceType.AIRDROP, value: 1000 }],
};
