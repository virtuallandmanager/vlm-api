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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCoords = exports.checkPlayer = void 0;
const utils_1 = require("../utils");
// validate that the player is active in a catalyst server, and in the indicated coordinates, or within a margin of error
function checkPlayer(playerId, server, parcel) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = server + '/comms/peers/';
        // const url = `https://peer.decentraland.org/comms/peers`
        try {
            const response = yield fetch(url);
            const data = yield response.json();
            if (data.ok) {
                const player = data.peers.find((peer) => peer.address && peer.address.toLowerCase() === playerId.toLowerCase());
                if (!player.parcel) {
                    return false;
                }
                return player && checkCoords(player.parcel, parcel);
            }
        }
        catch (error) {
            console.log(error);
            return false;
        }
        return false;
    });
}
exports.checkPlayer = checkPlayer;
// check coordinates against a single parcel - within a margin of error
function checkCoords(coords, parcel) {
    const validMargin = (p, c) => Math.abs(p - c) <= utils_1.MARGIN_OF_ERROR;
    return validMargin(coords[0], parcel[0]) && validMargin(coords[1], parcel[1]);
}
exports.checkCoords = checkCoords;
