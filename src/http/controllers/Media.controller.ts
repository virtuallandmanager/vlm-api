import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import mime from "mime";
import { OrganizationManager } from "../../logic/Organization.logic";
import { authMiddleware } from "../../middlewares/security/auth";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { uploadImage } from "../../middlewares/media/upload";
import { UserManager } from "../../logic/User.logic";
import { User } from "../../models/User.model";
import config from "../../../config/config";
import { ImageManager } from "../../logic/Image.logic";
import { Organization } from "../../models/Organization.model";
import { S3 } from "aws-sdk";

const router = express.Router();

router.post("/image/upload", authMiddleware, uploadImage.single("image"), async (req: Request, res: Response) => {
  try {
    const originalImage = req.file.buffer,
      originalContentType = req.file.mimetype,
      session = req.session,
      orgId = req.body.orgId,
      folderPath = req.body.folderPath,
      imageId = uuidv4().substring(0, 8);

    const user = await UserManager.obtain(
        new User.Account({
          sk: session.userId,
          connectedWallet: session.connectedWallet,
        })
      ),
      userOrgs = await OrganizationManager.getUserOrgs(user.sk);

    if (!userOrgs.find((org: Organization.Account) => org.id == orgId)) {
      return res.status(401).json({
        text: "You're not a member of this organization.",
      });
    }
    const fullFolderPath = `organization/${orgId}${folderPath}/${imageId}`;

    const resized1024 = await ImageManager.resizeImage(originalImage, 1024);
    const resized512 = await ImageManager.resizeImage(originalImage, 512);

    const originalImageParams = new S3.ManagedUpload({
      params: {
        Bucket: "vlm-images",
        Key: `${fullFolderPath}/original.${mime.getExtension(originalContentType)}`,
        Body: originalImage,
        ContentType: originalContentType,
        ACL: "public-read",
      },
    });
    const medImageParams = new S3.ManagedUpload({
      params: {
        Bucket: "vlm-images",
        Key: `${fullFolderPath}/texture.${mime.getExtension(originalContentType)}`,
        Body: resized1024,
        ContentType: originalContentType,
        ACL: "public-read",
      },
    });
    const thumbImageParams = new S3.ManagedUpload({
      params: {
        Bucket: "vlm-images",
        Key: `${fullFolderPath}/thumbnail.${mime.getExtension(originalContentType)}`,
        Body: resized512,
        ContentType: originalContentType,
        ACL: "public-read",
      },
    });

    await originalImageParams.promise();
    await medImageParams.promise();
    await thumbImageParams.promise();

    return res.status(200).json({
      text: "Image Successfully Uploaded!",
    });
  } catch (error) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Image.controller/upload",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

export default router;
