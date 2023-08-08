import axios from "axios";
import { Ipv4Address } from "aws-sdk/clients/inspector";
import { AdminLogManager } from "../logic/ErrorLogging.logic";

export default {
  addIpData: async function (clientIp: Ipv4Address) {
    if (!clientIp) {
      return null;
    }
    try {
      const response = await axios.get(`https://vpnapi.io/api/${clientIp}?key=${process.env.VPN_API_KEY}`);
      const ipData = response.data;
      return ipData;
    } catch (error) {
      AdminLogManager.logError(error, { from: "ip.ts/addIpData" });
      return null;
    }
  },
};
