"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const ErrorLogging_logic_1 = require("../logic/ErrorLogging.logic");
exports.default = {
    addIpData: function (clientIp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!clientIp) {
                return null;
            }
            try {
                const response = yield axios_1.default.get(`https://vpnapi.io/api/${clientIp}?key=${process.env.VPN_API_KEY}`);
                const ipData = response.data;
                return ipData;
            }
            catch (error) {
                ErrorLogging_logic_1.AdminLogManager.logError(error, { from: "ip.ts/addIpData" });
                return null;
            }
        });
    },
};
