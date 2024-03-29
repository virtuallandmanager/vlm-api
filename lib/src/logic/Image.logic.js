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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageManager = void 0;
const sharp_1 = __importDefault(require("sharp"));
class ImageManager {
}
exports.ImageManager = ImageManager;
_a = ImageManager;
ImageManager.resizeImage = (buffer, maxSize) => __awaiter(void 0, void 0, void 0, function* () {
    const image = (0, sharp_1.default)(buffer);
    yield image.metadata();
    yield image
        .resize({
        width: maxSize,
        height: maxSize,
        fit: "inside",
        withoutEnlargement: true,
    })
        .withMetadata()
        .toBuffer();
    return image;
});
