import express, { Request, Response } from "express";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { UserManager } from "../../logic/User.logic";
import dcl, { express as dclExpress } from "decentraland-crypto-middleware";

import { EventManager } from "../../logic/Event.logic";
import { Metadata, VALID_SIGNATURE_TOLERANCE_INTERVAL_MS } from "../../middlewares/utils";

const router = express.Router();

router.post("/", dclExpress({ expiration: VALID_SIGNATURE_TOLERANCE_INTERVAL_MS }), async (req: Request & dcl.DecentralandSignatureData<Metadata>, res: Response | any) => {
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

export default router;
