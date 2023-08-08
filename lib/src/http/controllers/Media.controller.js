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
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/security/auth");
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const config_1 = __importDefault(require("../../../config/config"));
const common_data_1 = require("../../dal/common.data");
const upload_1 = require("../../middlewares/media/upload");
const Session_logic_1 = require("../../logic/Session.logic");
const User_logic_1 = require("../../logic/User.logic");
const User_model_1 = require("../../models/User.model");
const VLM_model_1 = require("../../models/VLM.model");
const router = express_1.default.Router();
router.post("/user/image", auth_1.authMiddleware, upload_1.uploadImage, upload_1.resizeAndUpload, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sk, extension, metadata } = req.body.imageData;
        const pubFilePath = `media/image/${sk}/`;
        // Create a link between this image and the user
        const session = yield Session_logic_1.SessionManager.getVLMSession(req.session);
        const user = yield User_logic_1.UserManager.getById(session.userId);
        yield User_logic_1.UserManager.createMediaLink(new User_model_1.User.MediaLink(user, { sk, mediaType: VLM_model_1.VLMMedia.Type.IMAGE }));
        // Send a successful response
        res.send({
            message: "Image uploaded successfully",
            imageSrc: `${pubFilePath}original.${extension}`,
            textureSrc: `${pubFilePath}texture.${extension}`,
            thumbnailSrc: `${pubFilePath}thumbnail.${extension}`,
            metadata,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError("Image failed to upload.", { from: "Media.controller/user/image" });
        res.status(500).send({ message: "Server error" });
    }
}));
router.get("/image/:sk/:file", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sk, file } = req.params, filePath = `${config_1.default.environment_short}/image/${sk}/${file}`;
    const params = {
        Bucket: config_1.default.s3_bucket,
        Key: filePath,
    };
    try {
        // Use the getObject method to retrieve the image from S3
        const data = yield common_data_1.s3.getObject(params).promise();
        // The image content is returned in the 'Body' property
        const image = data.Body;
        // To display the image in the browser, set the appropriate response headers
        res.set({
            "Content-Type": data.ContentType,
            "Content-Length": data.ContentLength,
        });
        // Send the image data in the response
        res.send(image);
    }
    catch (error) {
        res.status(500).send({ error: "Error retrieving image" });
    }
}));
exports.default = router;
