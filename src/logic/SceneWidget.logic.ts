import { SceneWidgetDbManager } from "../dal/SceneWidget.data";
import { SceneWidget, SceneWidgetConfig } from "../models/SceneWidget.model";

export abstract class SceneWidgetManager {
  static getSceneWidget: CallableFunction = async (
    config: SceneWidgetConfig
  ) => {
    const sceneWidget = new SceneWidget(config);
    return await SceneWidgetDbManager.get(sceneWidget);
  };
  static createSceneWidget: CallableFunction = async (
    config: SceneWidgetConfig
  ) => {
    const sceneWidget = new SceneWidget(config);
    await SceneWidgetDbManager.put(sceneWidget);
    return sceneWidget;
  };
}
