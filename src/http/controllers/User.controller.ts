import express, { Request, Response } from "express";
import { UserManager } from "../../logic/User.logic";
import { authMiddleware } from "../../middlewares/security/auth";
import { OrganizationManager } from "../../logic/Organization.logic";
import { User } from "../../models/User.model";
import { Organization } from "../../models/Organization.model";
import { DateTime } from "luxon";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";

const router = express.Router();

router.post("/vlm/update", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userInfo = req.body.userInfo;

    await UserManager.update(userInfo);

    return res.status(200).json({
      text: "Successfully updated user.",
      userInfo,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "User.controller/vlm/update",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

// set up a user who is connecting for the first time
router.post("/setup", authMiddleware, async (req: Request, res: Response) => {
  try {
    let userInfo = req.body.userInfo,
      userOrgInfo = req.body.userOrgInfo,
      userOrgs;

    // ensure the user only passes up roles they're allowed to set
    if (userInfo?.roles?.length) {
      userInfo.roles = [User.Roles.BASIC_USER, User.Roles.ADVANCED_USER, User.Roles.ORG_ADMIN].filter((roleId) => userInfo.roles.includes(roleId) || roleId == User.Roles.BASIC_USER);
    } else {
      userInfo.roles = [User.Roles.BASIC_USER];
    }

    const dbUser = await UserManager.get(userInfo);
    userOrgs = await OrganizationManager.getUserOrgs(dbUser.sk, Organization.Roles.ORG_OWNER);

    if (userInfo.roles.includes(User.Roles.ORG_ADMIN) && !userOrgs?.length) {
      userOrgInfo = await OrganizationManager.create(userInfo, userOrgInfo);
    }

    if ((dbUser?.registeredAt && dbUser?.roles?.length) || userOrgs?.length) {
      return res.status(400).json({
        text: "User's account has already been set up.",
        dbUser,
        tip: "just the",
        real_tip: "Use the user/vlm/update endpoint.",
      });
    }
    userInfo.registeredAt = Date.now();
    userInfo = await UserManager.update(userInfo);
    userOrgs = await OrganizationManager.getUserOrgs(dbUser.sk, Organization.Roles.ORG_OWNER);

    return res.status(200).json({
      text: "Successfully updated user.",
      userInfo,
      userOrgs,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "User.controller/setup",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

export default router;
