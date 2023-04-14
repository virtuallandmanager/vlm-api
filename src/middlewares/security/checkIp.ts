import fetch from "cross-fetch";
import { AnalyticsUser } from "src/api/models/user.model";

export const checkIp = async(user: AnalyticsUser) => {
  try {
    const data = await fetch(`https://vpnapi.io/api/${user.clientIp}?key=${process.env.VPN_API_KEY}`);
    const ip = await data.json();
    return ip;
  } catch (error) {
    return { error };
  }
};