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
exports.HistoryManager = void 0;
const Generic_data_1 = require("../dal/Generic.data");
const History_data_1 = require("../dal/History.data");
const History_model_1 = require("../models/History.model");
const ErrorLogging_logic_1 = require("./ErrorLogging.logic");
class HistoryManager {
}
exports.HistoryManager = HistoryManager;
_a = HistoryManager;
HistoryManager.initHistory = (user, state) => __awaiter(void 0, void 0, void 0, function* () {
    const { sk } = state, { displayName } = user, userId = user.sk, descriptors = {
        action: "created",
        element: state.pk,
        id: state.sk,
    };
    try {
        const history = new History_model_1.History.Config({ sk }), historyRoot = new History_model_1.History.Root({ sk, root: state }), firstUpdate = new History_model_1.History.Update(Object.assign({ sk, userId, displayName, historyId: history.sk }, descriptors));
        yield History_data_1.HistoryDbManager.initHistory(history, historyRoot, firstUpdate);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, { text: "Failed to create history!", from: "History.logic/createHistory" });
    }
});
HistoryManager.getHistory = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Generic_data_1.GenericDbManager.get({ pk: History_model_1.History.Config.pk, sk });
});
HistoryManager.getHistoryRoot = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Generic_data_1.GenericDbManager.get({ pk: History_model_1.History.Root.pk, sk });
});
HistoryManager.getHistoryUpdate = (sk) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Generic_data_1.GenericDbManager.get({ pk: History_model_1.History.Update.pk, sk });
});
HistoryManager.addUpdate = (user, sk, descriptors, sceneData) => __awaiter(void 0, void 0, void 0, function* () {
    const { displayName } = user, userId = user.sk;
    try {
        const history = new History_model_1.History.Config({ sk });
        let update;
        if (history.updates.length === 0) {
            update = new History_model_1.History.Root({ sk, root: sceneData });
        }
        update = new History_model_1.History.Update(Object.assign({ userId, displayName, historyId: history.sk }, descriptors));
        yield History_data_1.HistoryDbManager.addUpdateToHistory(history, update);
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(error, {
            text: "Failed to update history log!",
            from: "History.logic/addUpdate",
        });
    }
});
