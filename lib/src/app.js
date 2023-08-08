"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const request_ip_1 = __importDefault(require("request-ip"));
const cors_1 = __importDefault(require("cors"));
const healthCheck_1 = __importDefault(require("./healthCheck"));
const User_controller_1 = __importDefault(require("./http/controllers/User.controller"));
const Authentication_controller_1 = __importDefault(require("./http/controllers/Authentication.controller"));
const Admin_controller_1 = __importDefault(require("./http/controllers/Admin.controller"));
const Scene_controller_1 = __importDefault(require("./http/controllers/Scene.controller"));
const Session_controller_1 = __importDefault(require("./http/controllers/Session.controller"));
const Event_controller_1 = __importDefault(require("./http/controllers/Event.controller"));
const Media_controller_1 = __importDefault(require("./http/controllers/Media.controller"));
const Log_controller_1 = __importDefault(require("./http/controllers/Log.controller"));
// Create Express server
const app = (0, express_1.default)();
// Express configuration
app.set("port", process.env.PORT || 3010);
app.use(request_ip_1.default.mw());
app.use((req, res, next) => {
    const clientIp = request_ip_1.default.getClientIp(req);
    next();
});
const jsonParser = body_parser_1.default.json({ limit: "5mb" });
const urlencodedParser = body_parser_1.default.urlencoded({ limit: "5mb", extended: true });
const corsOptions = {
    origin: [/^https:\/\/([a-z0-9]+\.)?decentraland\.org\/?$/, /^https:\/\/([a-z0-9]+\.)?vlm\.gg\/?$/],
    allowedHeaders: ["Content-Type, Authorization, x-identity-timestamp, x-identity-metadata, x-identity-auth-chain-0, x-identity-auth-chain-1, x-identity-auth-chain-2", "x-alchemy-signature"],
    credentials: true,
};
const corsDevOptions = {
    origin: [/^https:\/\/([a-z0-9]+\.)?decentraland\.org\/?$/, /^https:\/\/([a-z0-9]+\.)?vlm\.gg\/?$/, /^http:\/\/localhost:\d+\/?$/, /^https:\/\/localhost:\d+\/?$/, /^http:\/\/\d+.\d+.\d+.\d+:\d+\/?$/],
    allowedHeaders: ["Content-Type, Authorization, x-identity-timestamp, x-identity-metadata, x-identity-auth-chain-0, x-identity-auth-chain-1, x-identity-auth-chain-2", "x-alchemy-signature"],
    credentials: true,
};
if (process.env.NODE_ENV == "development") {
    app.use((0, cors_1.default)(corsDevOptions));
}
else {
    app.use((0, cors_1.default)(corsOptions));
}
app.use("/_health", healthCheck_1.default);
app.use("/auth", jsonParser, urlencodedParser, Authentication_controller_1.default);
app.use("/admin", jsonParser, urlencodedParser, Admin_controller_1.default);
app.use("/scene", jsonParser, urlencodedParser, Scene_controller_1.default);
app.use("/session", jsonParser, urlencodedParser, Session_controller_1.default);
app.use("/user", jsonParser, urlencodedParser, User_controller_1.default);
app.use("/event", jsonParser, urlencodedParser, Event_controller_1.default);
app.use("/media", Media_controller_1.default); // No body-parser middleware applied to this route
app.use("/log", jsonParser, urlencodedParser, Log_controller_1.default);
exports.default = app;
