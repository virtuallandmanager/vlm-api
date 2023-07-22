"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const request_ip_1 = __importDefault(require("request-ip"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
require("dotenv/config");
const healthCheck_1 = __importDefault(require("./healthCheck"));
const User_controller_1 = __importDefault(require("./http/controllers/User.controller"));
const Authentication_controller_1 = __importDefault(require("./http/controllers/Authentication.controller"));
const Admin_controller_1 = __importDefault(require("./http/controllers/Admin.controller"));
const Scene_controller_1 = __importDefault(require("./http/controllers/Scene.controller"));
const Event_controller_1 = __importDefault(require("./http/controllers/Event.controller"));
const Media_controller_1 = __importDefault(require("./http/controllers/Media.controller"));
dotenv.config({ path: __dirname + "/.env" });
// Create Express server
const app = (0, express_1.default)();
// Express configuration
app.set("port", process.env.PORT || 3010);
app.use(request_ip_1.default.mw());
app.use((req, res, next) => {
    const clientIp = request_ip_1.default.getClientIp(req);
    next();
});
app.use(body_parser_1.default.json({ limit: "5mb" }));
app.use(body_parser_1.default.urlencoded({ limit: "5mb", extended: true }));
const corsOptions = {
    origin: [/^https:\/\/([a-z0-9]+\.)?decentraland\.org$/, /^https:\/\/([a-z0-9]+\.)?vlm\.gg$/,],
    allowedHeaders: ["Content-Type, Authorization, x-identity-timestamp, x-identity-metadata, x-identity-auth-chain-0, x-identity-auth-chain-1, x-identity-auth-chain-2", "x-alchemy-signature"],
    credentials: true,
};
const corsDevOptions = {
    origin: [/^https:\/\/([a-z0-9]+\.)?decentraland\.org$/, /^https:\/\/([a-z0-9]+\.)?vlm\.gg$/, /^http:\/\/localhost:\d+$/, /^https:\/\/localhost:\d+$/],
    allowedHeaders: ["Content-Type, Authorization, x-identity-timestamp, x-identity-metadata, x-identity-auth-chain-0, x-identity-auth-chain-1, x-identity-auth-chain-2"],
    credentials: true,
};
if (process.env.NODE_ENV == "development") {
    app.use((0, cors_1.default)(corsDevOptions));
}
else {
    app.use((0, cors_1.default)(corsOptions));
}
app.use("/_health", healthCheck_1.default);
app.use("/auth", Authentication_controller_1.default);
app.use("/admin", Admin_controller_1.default);
app.use("/scene", Scene_controller_1.default);
app.use("/user", User_controller_1.default);
app.use("/event", Event_controller_1.default);
app.use("/media", Media_controller_1.default);
exports.default = app;
