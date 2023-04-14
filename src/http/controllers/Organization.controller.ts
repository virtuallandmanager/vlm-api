import express, { Request, Response } from "express";
import { OrganizationManager } from "../../logic/Organization.logic";
import { authMiddleware } from "../../middlewares/security/auth";
const router = express.Router();

router.post("/create", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userInfo = req.body.userInfo,
      userOrgInfo = req.body.userOrgInfo;

    const organization = await OrganizationManager.create(
      userInfo,
      userOrgInfo
    );

    return res.status(200).json({
      text: "Successfully created user.",
      organization,
    });
  } catch (error: any) {
    return res.status(error?.status || 500).json({
      text:
        error.text || "Something went wrong on the server. Please try again.",
      error,
    });
  }
});
router.post("/update", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userOrgInfo = req.body.userOrgInfo;

    const organization = await OrganizationManager.update(userOrgInfo);

    return res.status(200).json({
      text: "Successfully updated organization.",
      organization,
    });
  } catch (error: any) {
    return res.status(error?.status || 500).json({
      text:
        error.text || "Something went wrong on the server. Please try again.",
      error,
    });
  }
});

export default router;
