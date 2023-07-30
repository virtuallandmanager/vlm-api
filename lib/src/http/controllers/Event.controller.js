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
const uuid_1 = require("uuid");
const mime_1 = __importDefault(require("mime"));
const Organization_logic_1 = require("../../logic/Organization.logic");
const auth_1 = require("../../middlewares/security/auth");
const ErrorLogging_logic_1 = require("../../logic/ErrorLogging.logic");
const upload_1 = require("../../middlewares/media/upload");
const User_logic_1 = require("../../logic/User.logic");
const User_model_1 = require("../../models/User.model");
const config_1 = __importDefault(require("../../../config/config"));
const Image_logic_1 = require("../../logic/Image.logic");
const aws_sdk_1 = require("aws-sdk");
const Event_logic_1 = require("../../logic/Event.logic");
const Giveaway_logic_1 = require("../../logic/Giveaway.logic");
const Event_data_1 = require("../../dal/Event.data");
const Giveaway_data_1 = require("../../dal/Giveaway.data");
const Giveaway_model_1 = require("../../models/Giveaway.model");
const router = express_1.default.Router();
router.get("/cards", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.session.userId) {
            return res.status(400).json({
                text: "Bad Request.",
            });
        }
        const user = yield User_logic_1.UserManager.getById(req.session.userId), events = yield Event_logic_1.EventManager.getEventsForUser(user);
        return res.status(200).json({
            text: "Successfully authenticated.",
            events: events || [],
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Authentication.controller/cards",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.post("/create", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userInfo = req.body.userInfo, userOrgInfo = req.body.userOrgInfo;
        const organization = yield Event_logic_1.EventManager.create(userInfo, userOrgInfo);
        return res.status(200).json({
            text: "Successfully created user.",
            organization,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Organization.controller/create",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.post("/update", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userOrgInfo = req.body.userOrgInfo;
        const organization = yield Organization_logic_1.OrganizationManager.update(userOrgInfo);
        return res.status(200).json({
            text: "Successfully updated organization.",
            organization,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.controller/update",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.get("/migrate/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const giveawayItems = yield Event_data_1.EventDbManager.adminGetAll();
        const gItems = [];
        yield giveawayItems.forEach((item) => __awaiter(void 0, void 0, void 0, function* () {
            const gItem = new Giveaway_model_1.Giveaway.Item(Object.assign(Object.assign({}, item), { imageSrc: `https://peer.decentraland.org/lambdas/collections/contents/urn:decentraland:matic:collections-v2:${item.contractAddress}:${item.itemId}/thumbnail` }));
            gItems.push(gItem);
            yield Giveaway_data_1.GiveawayDbManager.addItem(gItem);
        }));
        return res.status(200).json({
            text: "Successfully migrated stuff",
            gItems,
            // claims,
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.controller/migrate",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.get("/:eventId", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.session.userId) {
            return res.status(400).json({
                text: "Bad Request.",
            });
        }
        const user = yield User_logic_1.UserManager.getById(req.session.userId), event = yield Event_logic_1.EventManager.getById(req.params.eventId), giveaways = yield Event_logic_1.EventManager.getGiveawaysForEvent(event);
        for (const giveaway of giveaways) {
            if (giveaway === null || giveaway === void 0 ? void 0 : giveaway.items) {
                const giveawayItems = [...giveaway.items];
                const fullGiveawayItems = yield Giveaway_logic_1.GiveawayManager.getItemsForGiveaway(giveawayItems);
                giveaway.items = fullGiveawayItems;
            }
        }
        if (event.userId !== user.sk && User_logic_1.UserManager.getAdminLevel(user) <= User_model_1.User.Roles.VLM_ADMIN) {
            return res.status(401).json({
                nachos: "Mmmmm...Ahh, got hungry, forgot error message.",
                text: "Ok seriously, you gotta login again or something.",
            });
        }
        return res.status(200).json({
            text: "Found event.",
            event: Object.assign(Object.assign({}, event), { giveaways }),
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Event.controller/:eventId",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
router.post("/image/library/upload", auth_1.authMiddleware, upload_1.uploadImage.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const originalImage = req.file.buffer, originalContentType = req.file.mimetype, session = req.session, orgId = req.body.orgId, folderPath = req.body.folderPath, imageId = (0, uuid_1.v4)().substring(0, 8);
        const user = yield User_logic_1.UserManager.obtain(new User_model_1.User.Account({
            sk: session.userId,
            connectedWallet: session.connectedWallet,
        })), userOrgs = yield Organization_logic_1.OrganizationManager.getUserOrgs(user.sk);
        if (!userOrgs.find((org) => org.id == orgId)) {
            return res.status(401).json({
                text: "You're not a member of this organization.",
            });
        }
        const fullFolderPath = `organization/${orgId}${folderPath}/${imageId}`;
        const resized1024 = yield Image_logic_1.ImageManager.resizeImage(originalImage, 1024);
        const resized512 = yield Image_logic_1.ImageManager.resizeImage(originalImage, 512);
        const originalImageParams = new aws_sdk_1.S3.ManagedUpload({
            params: {
                Bucket: config_1.default.s3_bucket,
                Key: `${fullFolderPath}/original.${mime_1.default.getExtension(originalContentType)}`,
                Body: originalImage,
                ContentType: originalContentType,
                ACL: "public-read",
            },
        });
        const medImageParams = new aws_sdk_1.S3.ManagedUpload({
            params: {
                Bucket: config_1.default.s3_bucket,
                Key: `${fullFolderPath}/texture.${mime_1.default.getExtension(originalContentType)}`,
                Body: resized1024,
                ContentType: originalContentType,
                ACL: "public-read",
            },
        });
        const thumbImageParams = new aws_sdk_1.S3.ManagedUpload({
            params: {
                Bucket: config_1.default.s3_bucket,
                Key: `${fullFolderPath}/thumbnail.${mime_1.default.getExtension(originalContentType)}`,
                Body: resized512,
                ContentType: originalContentType,
                ACL: "public-read",
            },
        });
        yield originalImageParams.promise();
        yield medImageParams.promise();
        yield thumbImageParams.promise();
        return res.status(200).json({
            text: "Image Successfully Uploaded!",
        });
    }
    catch (error) {
        ErrorLogging_logic_1.AdminLogManager.logError(JSON.stringify(error), {
            from: "Image.controller/upload",
        });
        return res.status(500).json({
            text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
            error,
        });
    }
}));
exports.default = router;
