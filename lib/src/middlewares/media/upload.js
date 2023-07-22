"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../../../config/config"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.update(config_1.default.aws_remote_config);
const s3 = new aws_sdk_1.default.S3();
exports.uploadImage = (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: s3,
        bucket: "vlm-images",
        cacheControl: "max-age=31536000",
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const extension = file.originalname.split(".").pop();
            const uuid = (0, uuid_1.v4)().substring(0, 6), original = `${uuid}-original.${extension}`, texture = `${uuid}-texture.${extension}`, thumbnail = `${uuid}-thumb.${extension}`;
            req.imageKeys = { original, texture, thumbnail };
            cb(null, original);
        },
    }),
});
