import express, { Request, Response } from "express";
import { authMiddleware } from "../../middlewares/security/auth";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import config from "../../../config/config";
import { s3 } from "../../dal/common.data";
import { resizeAndUpload, uploadImage } from "../../middlewares/media/upload";
import { SessionManager } from "../../logic/Session.logic";
import { UserManager } from "../../logic/User.logic";
import { User } from "../../models/User.model";
import { VLMMedia } from "../../models/VLM.model";

const router = express.Router();

router.post("/user/image", authMiddleware, uploadImage, resizeAndUpload, async (req: Request, res: Response) => {
  try {
    const { sk, extension, metadata } = req.body.imageData;

    const pubFilePath = `media/image/${sk}/`;

    // Create a link between this image and the user
    const session = await SessionManager.getVLMSession(req.session);
    const user = await UserManager.getById(session.userId);
    await UserManager.createMediaLink(new User.MediaLink(user, { sk, mediaType: VLMMedia.Type.IMAGE }));

    // Send a successful response
    res.send({
      message: "Image uploaded successfully",
      imageSrc: `${pubFilePath}original.${extension}`,
      textureSrc: `${pubFilePath}texture.${extension}`,
      thumbnailSrc: `${pubFilePath}thumbnail.${extension}`,
      metadata,
    });
  } catch (error) {
    AdminLogManager.logError("Image failed to upload.", { from: "Media.controller/user/image" });
    res.status(500).send({ message: "Server error" });
  }
});

router.get("/image/:sk/:file", async (req: Request, res: Response) => {
  const { sk, file } = req.params,
    filePath = `${config.environment_short}/image/${sk}/${file}`;

  const params = {
    Bucket: config.s3_bucket,
    Key: filePath,
  };

  try {
    // Use the getObject method to retrieve the image from S3
    const data = await s3.getObject(params).promise();

    // The image content is returned in the 'Body' property
    const image = data.Body;

    // To display the image in the browser, set the appropriate response headers
    res.set({
      "Content-Type": data.ContentType,
      "Content-Length": data.ContentLength,
    });

    // Send the image data in the response
    res.send(image);
  } catch (error) {
    res.status(500).send({ error: "Error retrieving image" });
  }
});

router.get("/demo-image/:id", async (req: Request, res: Response) => {
  const { id } = req.params,
    filePath = `prod/demo-images/${id}.png`;

  const params = {
    Bucket: config.s3_bucket,
    Key: filePath,
  };

  try {
    // Use the getObject method to retrieve the image from S3
    const data = await s3.getObject(params).promise();

    // The image content is returned in the 'Body' property
    const image = data.Body;

    // To display the image in the browser, set the appropriate response headers
    res.set({
      "Content-Type": data.ContentType,
      "Content-Length": data.ContentLength,
    });

    // Send the image data in the response
    res.send(image);
  } catch (error) {
    res.status(500).send({ error: "Error retrieving image" });
  }
});

router.get("/demo-video/:id", async (req: Request, res: Response) => {
  const { id } = req.params,
    filePath = `prod/demo-videos/${id}.mp4`;

  const params = {
    Bucket: config.s3_bucket,
    Key: filePath,
  };

  try {
    // Use the getObject method to retrieve the video from S3
    const data = await s3.getObject(params).promise();

    // The video content is returned in the 'Body' property
    const video = data.Body;

    // To display the image in the browser, set the appropriate response headers
    res.set({
      "Content-Type": data.ContentType,
      "Content-Length": data.ContentLength,
    });

    // Send the image data in the response
    res.send(video);
  } catch (error) {
    res.status(500).send({ error: "Error retrieving image" });
  }
});

export default router;
