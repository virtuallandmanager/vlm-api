import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import config from "../../../config/config";
import { s3 } from "../../dal/common.data";
import path from "path";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";

const upload = multer({
  fileFilter: (req, file, cb) => {
    // check if mimetype starts with 'image/'
    if (file.mimetype.startsWith("image/")) {
      // accept file
      cb(null, true);
    } else {
      // reject file
      cb(null);
      req.body.fileValidationError = "Not an image! Please upload an image.";
    }
  },
});

export const uploadImage = function (req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, function (err) {
    if (err) {
      AdminLogManager.logError(JSON.stringify(err), { from: "Image.middlewares/uploadImage" });
      return res.status(500).send({ error: "Error uploading file." });
    }
    const imageBuffer = req.file?.buffer;
    const originalname = req.file?.originalname;
    const extension = path.extname(originalname)?.substring(1);
    const sk = uuidv4();
    req.body = { ...req.body, imageData: { imageBuffer, sk, extension, originalname } };

    next();
  });
};

export const getImagePath = async (req: Request, sk: string) => {
  let filePath = `${config.environment_short}/`;
  filePath = `${filePath}images/${sk}/`;

  return filePath;
};

export const resizeAndUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sk, extension, originalname } = req.body.imageData;

    // Now call the next middleware function and pass these along
    const filePath = `${config.environment_short}/image/${sk}/`;

    await s3
      .putObject({
        Bucket: config.s3_bucket,
        Key: `${filePath}original.${extension}`,
        Body: req.file.buffer,
      })
      .promise();

    // Use sharp to resize the image to 1024px
    const resizedImageBuffer1024 = await sharp(req.file.buffer)
      .resize(1024, 1024, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    // Upload the resized image to S3
    await s3
      .putObject({
        Bucket: config.s3_bucket,
        Key: `${filePath}texture.${extension}`,
        Body: resizedImageBuffer1024,
      })
      .promise();

    // Use sharp to resize the image to 512px
    const resizedImageBuffer512 = await sharp(req.file.buffer)
      .resize(512, 512, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    // Upload the 512px resized image to S3
    await s3
      .putObject({
        Bucket: config.s3_bucket,
        Key: `${filePath}thumbnail.${extension}`,
        Body: resizedImageBuffer512,
      })
      .promise();

    // Use sharp to retrieve image dimensions
    req.body.imageData.metadata = await sharp(req.file.buffer).metadata();
    req.body.imageData.metadata.name = originalname;

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Error uploading file." });
  }
};
