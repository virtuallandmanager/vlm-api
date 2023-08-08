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
exports.runChecks = exports.checkBannedIPs = exports.ensureHttps = exports.checkOrigin = void 0;
const utils_1 = require("../utils");
const verifyOnMap_1 = require("./verifyOnMap");
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
function checkOrigin(req) {
    const origin = req.header("origin");
    const regexes = [/^https:\/\/([a-z0-9]+\.)?decentraland\.org\/?$/, /^https:\/\/([a-z0-9]+\.)?vlm\.gg\/?$/];
    if (utils_1.TESTS_ENABLED) {
        regexes.push(/^http:\/\/localhost:\d+\/?$/, /^https:\/\/localhost:\d+\/?$/, /^http:\/\/\d+.\d+.\d+.\d+:\d+\/?$/);
    }
    return regexes.some((regex) => regex.test(origin));
}
exports.checkOrigin = checkOrigin;
function ensureHttps(url) {
    if (url.startsWith("http://")) {
        return url.replace("http://", "https://");
    }
    else if (!url.startsWith("https://")) {
        return "https://" + url;
    }
    return url;
}
exports.ensureHttps = ensureHttps;
function checkBannedIPs(req) {
    const ip = req.header("X-Forwarded-For");
    return utils_1.denyListedIPS.includes(ip);
}
exports.checkBannedIPs = checkBannedIPs;
function runChecks(req, parcel) {
    return __awaiter(this, void 0, void 0, function* () {
        const metadata = req.authMetadata;
        const userAddress = req.auth;
        const coordinates = metadata.parcel.split(",").map((item) => {
            return parseInt(item, 10);
        });
        const base = metadata.realm.domain || metadata.realm.hostname || "";
        console.log("BASE: " + base);
        if (!base) {
            ErrorLogging_logic_1.AdminLogManager.logExternalError("NOTICED MISSING DCL METADATA!", { req });
            return;
        }
        else if (utils_1.TESTS_ENABLED) {
            return;
        }
        else {
            ensureHttps(base);
        }
        console.log(`metadata parcel: ${metadata.parcel} | request parcel: ${parcel}`);
        // check that the request comes from a decentraland domain
        const validOrigin = utils_1.TESTS_ENABLED || checkOrigin(req);
        if (!validOrigin) {
            throw new Error("INVALID ORIGIN");
        }
        // filter against a denylist of malicious ips
        const validIP = checkBannedIPs(req);
        if (validIP) {
            throw new Error("INVALID IP");
        }
        // Validate that the authchain signature is real
        // validate that the player is in the catalyst & location from the signature
        const validCatalystPos = utils_1.TESTS_ENABLED && (metadata.realm.catalystName === "localhost:8000" || metadata.realm.catalystName === "127.0.0.1:8000") ? true : yield (0, verifyOnMap_1.checkPlayer)(userAddress, base, coordinates);
        if (!validCatalystPos) {
            throw new Error("INVALID PLAYER POSITION");
        }
        // validate that the player is in a valid location for this operation - if a parcel is provided
        const validPos = (parcel === null || parcel === void 0 ? void 0 : parcel.length) ? (0, verifyOnMap_1.checkCoords)(coordinates, parcel) : true;
        if (!validPos) {
            throw new Error("INVALID PARCEL POSITION");
        }
    });
}
exports.runChecks = runChecks;
