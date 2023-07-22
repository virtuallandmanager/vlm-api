import fetch from "cross-fetch";
import { BaseUser } from "../../models/User.model";

export const checkIp = async (user: BaseUser.Account) => {
  try {
    const data = await fetch(`https://vpnapi.io/api/${user.lastIp}?key=${process.env.VPN_API_KEY}`);
    const ip = await data.json();
    return ip;
  } catch (error) {
    return { error };
  }
};
