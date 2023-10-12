import express, { Request, Response } from "express";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { UserManager } from "../../logic/User.logic";
import { authMiddleware } from "../../middlewares/security/auth";
import { GiveawayManager } from "../../logic/Giveaway.logic";
import { User } from "../../models/User.model";
import { Giveaway } from "../../models/Giveaway.model";

const router = express.Router();

router.get("/all", authMiddleware, async (req: Request, res: Response) => {
  // Gets all giveaways for user
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        text: "Unauthorized.",
      });
    }
    // Find user
    const user = await UserManager.getById(req.session.userId),
      // Get giveaways for user
      giveaways = await GiveawayManager.getGiveawaysForUser(user);

    return res.status(200).json({
      text: "Successfully fetched giveaways.",
      giveaways
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Giveaway.controller/cards",
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
      giveawayConfig = req.body.giveaway;

    const giveaway = await GiveawayManager.create({ ...giveawayConfig, userId });

    return res.status(200).json({
      text: "Successfully created giveaway.",
      giveaway,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Giveaway.controller/create",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/update", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      giveawayConfig = req.body.giveaway;


    const existingGiveaway = await GiveawayManager.getById(giveawayConfig.sk),
      giveaway = await GiveawayManager.update({ ...existingGiveaway, ...giveawayConfig, userId });

    return res.status(200).json({
      text: "Successfully created giveaway.",
      giveaway,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Giveaway.controller/create",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/item/add", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      giveawayId = req.body.giveawayId,
      item = new Giveaway.Item({ ...req.body.item });

    let giveaway = await GiveawayManager.getById(giveawayId);
    giveaway = await GiveawayManager.addItem(giveaway, item);

    return res.status(200).json({
      text: "Successfully created giveaway.",
      giveaway,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Giveaway.controller/create",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});


router.get("/:giveawayId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({
        text: "Bad Request.",
      });
    }

    const user = await UserManager.getById(req.session.userId),
      giveaway: Giveaway.Config = await GiveawayManager.getById(req.params.giveawayId),
      giveawayItems = [...giveaway.items],
      fullGiveawayItems = await GiveawayManager.getItemsForGiveaway(giveawayItems);

    giveaway.items = fullGiveawayItems;

    if (giveaway.userId !== user.sk && UserManager.getAdminLevel(user) <= User.Roles.VLM_ADMIN) {
      return res.status(401).json({
        nachos: "Mmmmm...Ahh, got hungry, forgot error message.",
        text: "Ok seriously, you gotta login again or something.",
      });
    }

    return res.status(200).json({
      text: "Found giveaway.",
      giveaway,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Giveaway.controller/:giveawayId",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

export default router;
