import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";

export const uploadImage = multer({
  storage: multerS3({
    s3: new S3Client({region: process.env.AWS_REGION}),
    bucket: process.env.S3_BUCKET,
    cacheControl: "max-age=31536000",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req: Request, file, cb) => {
      const extension = file.originalname.split(".").pop();
      const uuid = uuidv4().substring(0, 6),
        original = `${uuid}-original.${extension}`,
        texture = `${uuid}-texture.${extension}`,
        thumbnail = `${uuid}-thumb.${extension}`;
      req.imageKeys = { original, texture, thumbnail };
      cb(null, original);
    },
  }),
});
