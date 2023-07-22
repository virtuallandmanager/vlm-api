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
exports.AdvertisementManager = void 0;
const Advertisement_data_1 = require("../dal/Advertisement.data");
class AdvertisementManager {
}
exports.AdvertisementManager = AdvertisementManager;
_a = AdvertisementManager;
AdvertisementManager.createAdvertisement = (advert) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Advertisement_data_1.AdvertisementDbManager.put(advert);
});
AdvertisementManager.addAdvertisement = (advert) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Advertisement_data_1.AdvertisementDbManager.put(advert);
});
AdvertisementManager.getAdvertisement = (advert) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Advertisement_data_1.AdvertisementDbManager.get(advert);
});
