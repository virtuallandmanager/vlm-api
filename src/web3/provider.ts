import { Network, Alchemy } from "alchemy-sdk";
import { DateTime } from "luxon";

// Optional Config object, but defaults to demo api-key and eth-mainnet.
const ethSettings = {
  apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
  network: Network.ETH_MAINNET, // Replace with your network.
};

const maticSettings = {
  apiKey: process.env.ALCHEMY_POLYGON_API_KEY, // Replace with your Alchemy API Key.
  network: Network.MATIC_MAINNET, // Replace with your network.
};

export const ethProvider = new Alchemy(ethSettings);
export const maticProvider = new Alchemy(maticSettings);

export const getSignatureMessage = (ethAddr: string, clientIp: string) => {
  const startTime = DateTime.now(),
    endTime = startTime.plus({ hours: 12 }),
    truncAddr = `${ethAddr.slice(0, 5)}...${ethAddr.slice(ethAddr.length - 5)}`;

  return `⸺ BEGIN VLM SIGNATURE REQUEST ⸺\n
  Grant ${truncAddr} 12h access to VLM from ${clientIp}\n
  Session Starts: ${startTime.toISO()}\n
  Session Expires: ${endTime.toISO()}\n
  ⸺ END VLM SIGNATURE REQUEST ⸺`;
};
