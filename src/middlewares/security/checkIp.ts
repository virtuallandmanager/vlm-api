import axios from 'axios';
import { User } from '../../models/User.model';

export const checkIp = async (user: User.Config) => {
  try {
    const response = await axios.get(`https://vpnapi.io/api/${user.lastIp}?key=${process.env.VPN_API_KEY}`);
    const ip = response.data;
    return ip;
  } catch (error) {
    return { error };
  }
};
