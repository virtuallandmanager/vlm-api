"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignatureMessage = exports.maticProvider = exports.ethProvider = void 0;
const alchemy_sdk_1 = require("alchemy-sdk");
const luxon_1 = require("luxon");
// Optional Config object, but defaults to demo api-key and eth-mainnet.
const ethSettings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: alchemy_sdk_1.Network.ETH_MAINNET, // Replace with your network.
};
const maticSettings = {
    apiKey: process.env.ALCHEMY_POLYGON_API_KEY,
    network: alchemy_sdk_1.Network.MATIC_MAINNET, // Replace with your network.
};
exports.ethProvider = new alchemy_sdk_1.Alchemy(ethSettings);
exports.maticProvider = new alchemy_sdk_1.Alchemy(maticSettings);
const getSignatureMessage = (ethAddr, clientIp) => {
    const startTime = luxon_1.DateTime.now(), endTime = startTime.plus({ hours: 12 }), truncAddr = `${ethAddr.slice(0, 5)}...${ethAddr.slice(ethAddr.length - 5)}`;
    return `⸺ BEGIN VLM SIGNATURE REQUEST ⸺\n
  Grant ${truncAddr} 12h access to VLM from ${clientIp}\n
  Session Starts: ${startTime.toISO()}\n
  Session Expires: ${endTime.toISO()}\n
  ⸺ END VLM SIGNATURE REQUEST ⸺`;
};
exports.getSignatureMessage = getSignatureMessage;
