import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import config from "../../config/config";
import { PutObjectInput } from "aws-sdk/clients/backupstorage";

export abstract class ImageManager {
  static resizeImage = async (buffer: Buffer, maxSize: number): Promise<sharp.Sharp> => {
    const image = sharp(buffer);
    await image.metadata();

    await image
      .resize({
        width: maxSize,
        height: maxSize,
        fit: "inside",
        withoutEnlargement: true,
      })
      .withMetadata()
      .toBuffer();

    return image;
  };
}
