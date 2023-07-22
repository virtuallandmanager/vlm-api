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
exports.EventManager = void 0;
const Event_model_1 = require("../models/Event.model");
const Event_data_1 = require("../dal/Event.data");
const luxon_1 = require("luxon");
class EventManager {
}
exports.EventManager = EventManager;
_a = EventManager;
EventManager.create = (eventConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const event = new Event_model_1.Event.Config(eventConfig);
    event.createdAt = luxon_1.DateTime.now().toUnixInteger();
    return yield Event_data_1.EventDbManager.put(event);
});
EventManager.add = (event) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Event_data_1.EventDbManager.put(event);
});
EventManager.get = (eventConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const event = new Event_model_1.Event.Config(eventConfig);
    return yield Event_data_1.EventDbManager.get(event);
});
EventManager.getById = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Event_data_1.EventDbManager.getById(eventId);
});
EventManager.getByIds = (eventIds) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Event_data_1.EventDbManager.getByIds(eventIds);
});
EventManager.getLegacyEvent = (baseParcel) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Event_data_1.EventDbManager.getLegacy(baseParcel);
});
EventManager.getEventsForUser = (vlmUser) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Event_data_1.EventDbManager.getAllForUser(vlmUser);
});
EventManager.getGiveawaysForEvent = (eventConfig) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Event_data_1.EventDbManager.getGiveawaysForEvent(eventConfig);
});
