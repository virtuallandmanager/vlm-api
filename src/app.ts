import express from "express";
import bodyParser from "body-parser";
import requestIp from "request-ip";
import cors, { CorsOptions } from "cors";
import * as dotenv from "dotenv";
import "dotenv/config";
import healthCheck from "./healthCheck";
import userController from "./http/controllers/User.controller";
import authController from "./http/controllers/Authentication.controller";
import adminController from "./http/controllers/Admin.controller";
import sceneController from "./http/controllers/Scene.controller";
import eventController from "./http/controllers/Event.controller";
import mediaController from "./http/controllers/Media.controller";
import logController from "./http/controllers/Log.controller";

dotenv.config({ path: __dirname + "/.env" });

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3010);

app.use(requestIp.mw());

app.use((req, res, next) => {
  const clientIp = requestIp.getClientIp(req);
  next();
});

app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

const corsOptions: CorsOptions = {
  origin: [/^https:\/\/([a-z0-9]+\.)?decentraland\.org$/, /^https:\/\/([a-z0-9]+\.)?vlm\.gg$/],
  allowedHeaders: ["Content-Type, Authorization, x-identity-timestamp, x-identity-metadata, x-identity-auth-chain-0, x-identity-auth-chain-1, x-identity-auth-chain-2", "x-alchemy-signature"],
  credentials: true,
};

const corsDevOptions: CorsOptions = {
  origin: [/^https:\/\/([a-z0-9]+\.)?decentraland\.org$/, /^https:\/\/([a-z0-9]+\.)?vlm\.gg$/, /^http:\/\/localhost:\d+$/, /^https:\/\/localhost:\d+$/],
  allowedHeaders: ["Content-Type, Authorization, x-identity-timestamp, x-identity-metadata, x-identity-auth-chain-0, x-identity-auth-chain-1, x-identity-auth-chain-2"],
  credentials: true,
};

if (process.env.NODE_ENV == "development") {
  app.use(cors(corsDevOptions));
} else {
  app.use(cors(corsOptions));
}

app.use("/_health", healthCheck);
app.use("/auth", authController);
app.use("/admin", adminController);
app.use("/scene", sceneController);
app.use("/user", userController);
app.use("/event", eventController);
app.use("/media", mediaController);
app.use("/log", logController);

export default app;
