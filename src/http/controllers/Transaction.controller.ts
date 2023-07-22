import express, { Request, Response } from "express";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";

const router = express.Router();

router.post("/mine", async (req: Request, res: Response | any) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: "Bad Request.",
      });
    }

    return res.status(200);
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Transaction.controller/mine",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/drop", async (req: Request, res: Response | any) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: "Bad Request.",
      });
    }

    AdminLogManager.logError(
      { error: "Transaction Dropped!", content: req.body.fullTransaction },
      {
        from: "Alchemy",
      }
    );

    return res.status(200);
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Transaction.controller/drop",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.post("/transfer", async (req: Request, res: Response | any) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: "Bad Request.",
      });
    }

    return res.status(200);
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Transaction.controller/transfer",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

export default router;
