import express, { Request, Response } from "express";
import { MigrationManager } from "../../logic/Migration.logic";
import { SceneManager } from "../../logic/Scene.logic";
import { UserManager } from "../../logic/User.logic";
import { LegacySceneConfig } from "../../models/Legacy.model";
import { authMiddleware } from "../../middlewares/security/auth";
import { Decentraland } from "../../models/worlds/Decentraland.model";
import { Scene } from "../../models/Scene.model";
import { User } from "../../models/User.model";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { HistoryManager } from "../../logic/History.logic";
const router = express.Router();

router.get("/cards", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: "Bad Request.",
      });
    }

    const user = await UserManager.getById(req.session.userId),
      scenes = await SceneManager.getScenesForUser(user);

    return res.status(200).json({
      text: "Successfully authenticated.",
      scenes: scenes || [],
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
    const sceneConfig = req.body,
      newScene = new Scene.Config(sceneConfig),
      userAccount = await UserManager.getById(req.session.userId),
      newSceneLink = new User.SceneLink({ sk: req.session.userId }, newScene),
      scene = await SceneManager.createScene(newScene),
      sceneLink = await SceneManager.createUserLink(newSceneLink),
      fullScene = await SceneManager.buildScene(scene, req.body.locale);

    HistoryManager.initHistory(userAccount, fullScene);

    return res.status(200).json({
      text: "Successfully authenticated.",
      scene: fullScene,
      sceneLink,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Scene.controller/create",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.get("/demo", authMiddleware, async (req: Request, res: Response) => {
  try {
    const scene = await SceneManager.getSceneById("00000000-0000-0000-0000-000000000000");
    await SceneManager.buildScene(scene);
    return res.status(200).json({
      text: "Successfully authenticated.",
      scene,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Scene.controller/demo",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
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
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Scene.controller/migrate",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

router.get("/:sceneId", authMiddleware, async (req: Request, res: Response) => {
  const sk = req.params.sceneId;

  try {
    const scene = await SceneManager.getSceneById(sk);

    return res.status(200).json({
      text: "Successfully authenticated.",
      scene,
    });
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: "Scene.controller/:sceneId",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});

export default router;
