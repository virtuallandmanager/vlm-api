import fetch from "cross-fetch";
import { Ipv4Address } from "aws-sdk/clients/inspector";
import { logError } from "../dal/ErrorLogging.data";

export default {
  addIpData: async function (clientIp: Ipv4Address) {
    if (!clientIp) {
      return null;
    }
    try {
      const data = await fetch(
        `https://vpnapi.io/api/${clientIp}?key=${process.env.VPN_API_KEY}`
      );
      const ipData = await data.json();
      return ipData;
    } catch (error) {
      AdminLogManager.logError("addIpData", error);
      return null;
    }
  },
};
