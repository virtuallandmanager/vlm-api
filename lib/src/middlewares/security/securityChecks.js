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
exports.runChecks = exports.checkBannedIPs = exports.checkOrigin = void 0;
const utils_1 = require("../utils");
const verifyOnMap_1 = require("./verifyOnMap");
function checkOrigin(req) {
    const validOrigins = ['https://play.decentraland.org', 'https://play.decentraland.zone'];
    return validOrigins.includes(req.header('origin'));
}
exports.checkOrigin = checkOrigin;
function checkBannedIPs(req) {
    const ip = req.header('X-Forwarded-For');
    return utils_1.denyListedIPS.includes(ip);
}
exports.checkBannedIPs = checkBannedIPs;
function runChecks(req, parcel) {
    return __awaiter(this, void 0, void 0, function* () {
        const metadata = req.authMetadata;
        const userAddress = req.auth;
        const coordinates = metadata.parcel.split(',').map((item) => {
            return parseInt(item, 10);
        });
        // check that the request comes from a decentraland domain
        const validOrigin = (utils_1.TESTS_ENABLED && metadata.realm.serverName === 'LocalPreview')
            ? true
            : checkOrigin(req);
        if (!validOrigin) {
            throw new Error('INVALID ORIGIN');
        }
        // filter against a denylist of malicious ips
        const validIP = checkBannedIPs(req);
        if (validIP) {
            throw new Error('INVALID IP');
        }
        // Validate that the authchain signature is real
        // validate that the player is in the catalyst & location from the signature
        const validCatalystPos = (utils_1.TESTS_ENABLED && metadata.realm.serverName === 'LocalPreview') ? true
            : yield (0, verifyOnMap_1.checkPlayer)(userAddress, metadata.realm.domain, coordinates);
        if (!validCatalystPos) {
            throw new Error('INVALID PLAYER POSITION');
        }
        // validate that the player is in a valid location for this operation - if a parcel is provided
        const validPos = (parcel === null || parcel === void 0 ? void 0 : parcel.length) ? (0, verifyOnMap_1.checkCoords)(coordinates, parcel) : true;
        if (!validPos) {
            throw new Error('INVALID PARCEL POSITION');
        }
    });
}
exports.runChecks = runChecks;
