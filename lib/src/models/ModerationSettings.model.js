"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAllowActions = exports.EBanWallType = exports.EBanActions = void 0;
var EBanActions;
(function (EBanActions) {
    EBanActions[EBanActions["WALL"] = 0] = "WALL";
    EBanActions[EBanActions["BLACKOUT"] = 1] = "BLACKOUT";
})(EBanActions = exports.EBanActions || (exports.EBanActions = {}));
var EBanWallType;
(function (EBanWallType) {
    EBanWallType[EBanWallType["BLACK"] = 0] = "BLACK";
    EBanWallType[EBanWallType["INVISIBLE"] = 1] = "INVISIBLE";
    EBanWallType[EBanWallType["MIRROR"] = 2] = "MIRROR";
})(EBanWallType = exports.EBanWallType || (exports.EBanWallType = {}));
var EAllowActions;
(function (EAllowActions) {
    EAllowActions[EAllowActions["MOVE"] = 0] = "MOVE";
})(EAllowActions = exports.EAllowActions || (exports.EAllowActions = {}));
