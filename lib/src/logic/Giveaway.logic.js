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
exports.GiveawayManager = void 0;
const Giveaway_data_1 = require("../dal/Giveaway.data");
const Giveaway_model_1 = require("../models/Giveaway.model");
class GiveawayManager {
}
exports.GiveawayManager = GiveawayManager;
_a = GiveawayManager;
GiveawayManager.create = (giveaway) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Giveaway_data_1.GiveawayDbManager.put(giveaway);
});
GiveawayManager.createItem = (giveawayItem) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Giveaway_data_1.GiveawayDbManager.addItem(giveawayItem);
});
GiveawayManager.addClaim = (analyticsAction, claim, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Giveaway_data_1.GiveawayDbManager.addClaim(analyticsAction, claim, transaction);
});
GiveawayManager.get = (giveawayConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const giveaway = new Giveaway_model_1.Giveaway.Config(giveawayConfig);
    return yield Giveaway_data_1.GiveawayDbManager.get(giveaway);
});
GiveawayManager.getAllLegacy = (chunkCb) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Giveaway_data_1.GiveawayDbManager.getAllLegacy(chunkCb);
});
GiveawayManager.getItemsForGiveaway = (items) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Giveaway_data_1.GiveawayDbManager.getItemsByIds(items);
});
