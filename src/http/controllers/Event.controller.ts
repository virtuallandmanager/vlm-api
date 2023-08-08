import express, { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../../dal/common.data";
import mime from "mime";
import { OrganizationManager } from "../../logic/Organization.logic";
import { authMiddleware } from "../../middlewares/security/auth";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { UserManager } from "../../logic/User.logic";
import { User } from "../../models/User.model";
import { ImageManager } from "../../logic/Image.logic";
import { Organization } from "../../models/Organization.model";
import { S3 } from "aws-sdk";
import { Event } from "../../models/Event.model";
import { EventManager } from "../../logic/Event.logic";
import { GiveawayManager } from "../../logic/Giveaway.logic";
import { EventDbManager } from "../../dal/Event.data";
import { GiveawayDbManager } from "../../dal/Giveaway.data";
import { Giveaway } from "../../models/Giveaway.model";
const router = express.Router();

router.get("/cards", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: "Bad Request.",
      });
    }

    const user = await UserManager.getById(req.session.userId),
      events = await EventManager.getEventsForUser(user);

    return res.status(200).json({
      text: "Successfully authenticated.",
      events: events || [],
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Authentication.controller/cards",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/create", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userInfo = req.body.userInfo,
      userOrgInfo = req.body.userOrgInfo;

    const organization = await EventManager.create(userInfo, userOrgInfo);

    return res.status(200).json({
      text: "Successfully created user.",
      organization,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Organization.controller/create",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
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
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/update",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.get("/migrate/all", async (req: Request, res: Response) => {
  try {
    const giveawayItems = await EventDbManager.adminGetAll();
    const gItems: Giveaway.Item[] = [];
    await giveawayItems.forEach(async (item: Giveaway.Item) => {
      const gItem = new Giveaway.Item({ ...item, imageSrc: `https://peer.decentraland.org/lambdas/collections/contents/urn:decentraland:matic:collections-v2:${item.contractAddress}:${item.itemId}/thumbnail` });
      gItems.push(gItem);
      await GiveawayDbManager.addItem(gItem);
    });

    return res.status(200).json({
      text: "Successfully migrated stuff",
      gItems,
      // claims,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/migrate",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});
router.get("/:eventId", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: "Bad Request.",
      });
    }

    const user = await UserManager.getById(req.session.userId),
      event: Event.Config = await EventManager.getById(req.params.eventId),
      giveaways: Event.Giveaway.Config[] = await EventManager.getGiveawaysForEvent(event);

    for (const giveaway of giveaways) {
      if (giveaway?.items) {
        const giveawayItems = [...giveaway.items];
        const fullGiveawayItems = await GiveawayManager.getItemsForGiveaway(giveawayItems);
        giveaway.items = fullGiveawayItems;
      }
    }

    if (event.userId !== user.sk && UserManager.getAdminLevel(user) <= User.Roles.VLM_ADMIN) {
      return res.status(401).json({
        nachos: "Mmmmm...Ahh, got hungry, forgot error message.",
        text: "Ok seriously, you gotta login again or something.",
      });
    }

    return res.status(200).json({
      text: "Found event.",
      event: { ...event, giveaways },
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/:eventId",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});


export default router;
