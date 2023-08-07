import express, { Request, Response } from "express";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
const router = express.Router();

router.post("/error", async (req: Request, res: Response) => {
  try {
    const { error, metadata, userInfo } = req.body;
    await AdminLogManager.logExternalError(error, metadata, userInfo);

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

router.post("/warning", async (req: Request, res: Response) => {
  try {
    const { log, metadata, userInfo } = req.body;
    await AdminLogManager.logExternalError(log, metadata, userInfo);

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

router.post("/info", async (req: Request, res: Response) => {
  try {
    const { log, metadata, userInfo } = req.body;
    await AdminLogManager.logExternalError(log, metadata, userInfo);

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

router.post("/wat", async (req: Request, res: Response) => {
  try {
    const { log, metadata, userInfo } = req.body;
    await AdminLogManager.logWAT(log, metadata, userInfo);

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
