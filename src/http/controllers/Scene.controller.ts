import express, { Request, Response } from "express";
import { MigrationManager } from "../../logic/Migration.logic";
import { SceneManager } from "../../logic/Scene.logic";
import { UserManager } from "../../logic/User.logic";
import { LegacySceneConfig } from "../../models/Legacy.model";
import { authMiddleware } from "../../middlewares/security/auth";
import { Decentraland } from "../../models/worlds/Decentraland.model";
const router = express.Router();

router.get("/all", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await UserManager.get({ sk: req.session.userId });
    const scenes = await SceneManager.getScenesForUser(user);

    return res.status(200).json({
      text: "Successfully authenticated.",
      scenes,
    });
  } catch (error: any) {
    return res.status(error?.status || 500).json({
      text: error.text || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.get("/:sceneId", authMiddleware, async (req: Request, res: Response) => {
  const sk = req.params.sceneId;

  try {
    const scene = await SceneManager.getScene({ sk });

    return res.status(200).json({
      text: "Successfully authenticated.",
      scene,
    });
  } catch (error: any) {
    return res.status(error?.status || 500).json({
      text: error.text || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.get("/migrate", async (req: Request, res: Response) => {
  // const { x, y } = req.params;
  try {
    const migrations: Decentraland.Scene.Config[] = [];
    const legacyScenes = await SceneManager.getLegacyScenes();
    await legacyScenes.forEach(async (legacyScene: LegacySceneConfig) => {
      const migration = await MigrationManager.migrateLegacyScene(legacyScene);
      migrations.push(migration);
    });
    return res.status(200).json({
      text: "Successfully migrated!",
      migrations,
    });
  } catch (error: any) {
    return res.status(error?.status || 500).json({
      text: error.text || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

export default router;
