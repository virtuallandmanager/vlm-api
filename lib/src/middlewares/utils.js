"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.denyListedIPS = exports.MARGIN_OF_ERROR = exports.VALID_SIGNATURE_TOLERANCE_INTERVAL_MS = exports.TESTS_ENABLED = void 0;
// allow requests from localhost
exports.TESTS_ENABLED = true;
// We want all signatures to be "current". We consider "current" to be the current time,
// with a 10 minute tolerance to account for network delays and possibly unsynched clocks
exports.VALID_SIGNATURE_TOLERANCE_INTERVAL_MS = 10 * 1000 * 60;
// number of parcels to use as margin of error when comparing coordinates
exports.MARGIN_OF_ERROR = 2;
// reject any request from these IPs
exports.denyListedIPS = [
    `14.161.47.252`,
    `170.233.124.66`,
    `2001:818:db0f:7500:3576:469a:760a:8ded`,
    `85.158.181.20`,
    `185.39.220.232`,
    `178.250.10.230`,
    `185.39.220.156`,
];
