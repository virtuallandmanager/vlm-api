import express, { Request, Response } from "express";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
const router = express.Router();

router.post("/error", async (req: Request, res: Response) => {
  try {
    const { error, metadata } = req.body;
    await AdminLogManager.logError(error, metadata, true);
    return res.status(200).json({
      text: "Logged error successfully.",
    });
  } catch (error: any) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Log.controller/error",
    });
    return res.status(error?.status || 500).json({
      text: error.text || "Something went wrong on the server. Please try again.",
      error,
    });
  }
});

export default router;
