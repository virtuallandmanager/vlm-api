import express, { Request, Response } from "express";
import { authMiddleware } from "../../middlewares/security/auth";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { UserManager } from "../../logic/User.logic";
import { User } from "../../models/User.model";
import { Event } from "../../models/Event.model";
import { EventManager } from "../../logic/Event.logic";
import { EventDbManager } from "../../dal/Event.data";
import { GiveawayDbManager } from "../../dal/Giveaway.data";
import { Giveaway } from "../../models/Giveaway.model";
const router = express.Router();

router.get("/all", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: "Bad Request.",
      });
    }

    const user = await UserManager.getById(req.session.userId),
      events = await EventManager.getEventsForUser(user),
      giveawayLinks = await EventManager.getLinkedGiveaways(events),
      sceneLinks = await EventManager.getLinkedScenes(events);

    return res.status(200).json({
      text: "Successfully authenticated.",
      events: events || [],
      giveawayLinks: giveawayLinks || [],
      sceneLinks: sceneLinks || [],
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/all",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/create", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      eventConfig = req.body.event;

    const event = await EventManager.create({ ...eventConfig, userId });

    return res.status(200).json({
      text: "Successfully created event.",
      event,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/create",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/link/scenes", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sceneLinkIds, eventId } = req.body;

    const sceneLinks = await EventManager.linkScenes(eventId, sceneLinkIds);

    return res.status(200).json({
      text: "Successfully linked scenes.",
      sceneLinks: sceneLinks,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/link/scenes",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/link/giveaways", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { giveawayLinkIds, eventId } = req.body;

    const giveawayLinks = await EventManager.linkGiveaways(eventId, giveawayLinkIds);

    return res.status(200).json({
      text: "Successfully linked giveaways.",
      giveawayLinks: giveawayLinks,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/link/giveaways",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error
    });
  }
});

router.post("/link/scene", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sceneId, eventId } = req.body;

    const sceneLink = await EventManager.linkScene(eventId, sceneId);

    return res.status(200).json({
      text: "Successfully linked scene.",
      sceneLink,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/link/scene",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});


router.post("/link/giveaway", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { giveawayId, eventId } = req.body;

    const giveawayLink = await EventManager.linkGiveaway(eventId, giveawayId);

    return res.status(200).json({
      text: "Successfully linked giveaway.",
      giveawayLink,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/link/scene",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/unlink/scene", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sceneId, eventId } = req.body;

    const linkId = await EventManager.unlinkScene(eventId, sceneId);

    return res.status(200).json({
      text: "Successfully linked scene.",
      success: true,
      linkId
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/link/scene",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});


router.post("/unlink/giveaway", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { giveawayId, eventId } = req.body;

    const linkId = await EventManager.unlinkGiveaway(eventId, giveawayId);

    return res.status(200).json({
      text: "Successfully linked giveaway.",
      success: true,
      linkId
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Event.controller/link/scene",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/update", authMiddleware, async (req: Request, res: Response) => {
  try {
    const eventConfig = req.body.event;

    const existingEvent = await EventManager.getById(eventConfig.sk);
    if (!existingEvent) {
      return res.status(400).json({
        text: "Bad Request.",
      });
    }

    const event = await EventManager.update(eventConfig);

    return res.status(200).json({
      text: "Successfully updated organization.",
      event,
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
      event: Event.Config = await EventManager.getById(req.params.eventId);

    if (event.userId !== user.sk && UserManager.getAdminLevel(user) <= User.Roles.VLM_ADMIN) {
      return res.status(401).json({
        nachos: "Mmmmm...oops, got hungry, forgot error message.",
        text: "Ok seriously, you gotta login again or something.",
      });
    }

    return res.status(200).json({
      text: "Found event.",
      event,
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
