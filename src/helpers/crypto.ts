import axios from 'axios';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { AdminLogManager } from '../logic/ErrorLogging.logic';

export const getPriceInCrypto = async (usdValue: number, crypto: 'ETH' | 'MANA') => {
    // For this example, replace with an actual API endpoint
    const ethPrice = await getETHPrice(),
        manaPrice = await getMANAPrice();

    const cryptoPrices = {
        ETH: ethPrice,  // Replace with dynamic price
        MANA: manaPrice  // Replace with dynamic price
    };

    return usdValue / cryptoPrices[crypto];
};

const getETHPrice = async () => {
    try {
        let url;
        if (process.env.NODE_ENV == "development") {
            url = `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_MAINNET_GOERLI}`;
        } else {
            url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_MAINNET}`;

        }
        const payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_call",
            "params": [
                {
                    "to": "0x8468b2bDCE073A157E560AA4D9CcF6dB1DB98507", // This is the Uniswap V2 Pair for WETH/USDT. Replace if needed.
                    "data": "0x0d536201"  // `getReserves` function call
                },
                "latest"
            ]
        };

        const response = await axios.post(url, payload);
        const data = response.data.result;
        const reserves = {
            reserve0: BigNumber.from(data.substring(0, 66)),
            reserve1: BigNumber.from("0x" + data.substring(66, 130))
        };

        // Assuming reserve0 is WETH and reserve1 is USDT. Adjust if necessary.
        const ethPrice = reserves.reserve1.div(reserves.reserve0);
        return parseFloat(formatUnits(ethPrice, 'ether'));
    } catch (error) {
        AdminLogManager.logError(error, { from: "getETHPrice" });
    }
}

const getMANAPrice = async () => {
    try {
        let url;

        if (process.env.NODE_ENV == "development") {
            url = `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_MAINNET_GOERLI}`;
        } else {
            url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_MAINNET}`;

        }
        const payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_call",
            "params": [
                {
                    "to": "0x8468b2bDCE073A157E560AA4D9CcF6dB1DB98507", // This is the Uniswap V2 Pair for WETH/USDT. Replace if needed.
                    "data": "0x0d536201"  // `getReserves` function call
                },
                "latest"
            ]
        };

        const response = await axios.post(url, payload);
        const data = response.data.result;
        const reserves = {
            reserve0: BigNumber.from(data.substring(0, 66)),
            reserve1: BigNumber.from("0x" + data.substring(66, 130))
        };

        // Assuming reserve0 is WETH and reserve1 is USDT. Adjust if necessary.
        const ethPrice = reserves.reserve1.div(reserves.reserve0);
        return parseFloat(formatUnits(ethPrice, 'ether'));

    } catch (error) {
        AdminLogManager.logError(error, { from: "getMANAPrice" });
    }
}

