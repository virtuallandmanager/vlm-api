import axios from 'axios';
import { BaseUser } from '../../models/User.model';

export const checkIp = async (user: BaseUser.Account) => {
  try {
    const response = await axios.get(`https://vpnapi.io/api/${user.lastIp}?key=${process.env.VPN_API_KEY}`);
    const ip = response.data;
    return ip;
  } catch (error) {
    return { error };
  }
};
