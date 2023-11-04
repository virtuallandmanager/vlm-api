import express, { Request, Response } from "express";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { SessionManager } from "../../logic/Session.logic";

const router = express.Router();

router.get("/end", async (req: Request, res: Response) => {
  try {
    const { sessionData, pathId, pathSegments } = req.body;
    const session = await SessionManager.getAnalyticsSession(sessionData);
    if (!session) {
      return res.status(400).json({
        text: "Invalid request.",
      });
    }
    await SessionManager.endAnalyticsSession(session);
    const path = await SessionManager.getSessionPath(pathId);
    await SessionManager.extendPath(pathId, pathSegments);
    return res.status(200).json({
      text: "Successfully ended session.",
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Session.controller/demo",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});


export default router;
