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
exports.resizeAndUpload = exports.getImagePath = exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const config_1 = __importDefault(require("../../../config/config"));
const common_data_1 = require("../../dal/common.data");
const path_1 = __importDefault(require("path"));
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const upload = (0, multer_1.default)({
    fileFilter: (req, file, cb) => {
        // check if mimetype starts with 'image/'
        if (file.mimetype.startsWith("image/")) {
            // accept file
            cb(null, true);
        }
        else {
            // reject file
            cb(null);
            req.body.fileValidationError = "Not an image! Please upload an image.";
        }
    },
});
const uploadImage = function (req, res, next) {
    upload.single("image")(req, res, function (err) {
        var _a, _b, _c;
        if (err) {
            ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(err), { from: "Image.middlewares/uploadImage" });
            return res.status(500).send({ error: "Error uploading file." });
        }
        const imageBuffer = (_a = req.file) === null || _a === void 0 ? void 0 : _a.buffer;
        const originalname = (_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname;
        const extension = (_c = path_1.default.extname(originalname)) === null || _c === void 0 ? void 0 : _c.substring(1);
        const sk = (0, uuid_1.v4)();
        req.body = Object.assign(Object.assign({}, req.body), { imageData: { imageBuffer, sk, extension, originalname } });
        next();
    });
};
exports.uploadImage = uploadImage;
const getImagePath = (req, sk) => __awaiter(void 0, void 0, void 0, function* () {
    let filePath = `${config_1.default.environment_short}/`;
    filePath = `${filePath}images/${sk}/`;
    return filePath;
});
exports.getImagePath = getImagePath;
const resizeAndUpload = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sk, extension, originalname } = req.body.imageData;
        // Now call the next middleware function and pass these along
        const filePath = `${config_1.default.environment_short}/image/${sk}/`;
        yield common_data_1.s3
            .putObject({
            Bucket: config_1.default.s3_bucket,
            Key: `${filePath}original.${extension}`,
            Body: req.file.buffer,
        })
            .promise();
        // Use sharp to resize the image to 1024px
        const resizedImageBuffer1024 = yield (0, sharp_1.default)(req.file.buffer)
            .resize(1024, 1024, {
            fit: "inside",
            withoutEnlargement: true,
        })
            .toBuffer();
        // Upload the resized image to S3
        yield common_data_1.s3
            .putObject({
            Bucket: config_1.default.s3_bucket,
            Key: `${filePath}texture.${extension}`,
            Body: resizedImageBuffer1024,
        })
            .promise();
        // Use sharp to resize the image to 512px
        const resizedImageBuffer512 = yield (0, sharp_1.default)(req.file.buffer)
            .resize(512, 512, {
            fit: "inside",
            withoutEnlargement: true,
        })
            .toBuffer();
        // Upload the 512px resized image to S3
        yield common_data_1.s3
            .putObject({
            Bucket: config_1.default.s3_bucket,
            Key: `${filePath}thumbnail.${extension}`,
            Body: resizedImageBuffer512,
        })
            .promise();
        // Use sharp to retrieve image dimensions
        req.body.imageData.metadata = yield (0, sharp_1.default)(req.file.buffer).metadata();
        req.body.imageData.metadata.name = originalname;
        next();
    }
    catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Error uploading file." });
    }
});
exports.resizeAndUpload = resizeAndUpload;
