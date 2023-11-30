import { User } from '../models/User.model'
import { GenericDbManager } from '../dal/Generic.data'
import { Scene } from '../models/Scene.model'
import { SceneDbManager } from '../dal/Scene.data'
import { AdminLogManager } from './ErrorLogging.logic'
import { SceneSettingsManager } from './SceneSettings.logic'
import { ScenePresetManager } from './ScenePreset.logic'
import { GiveawayManager } from './Giveaway.logic'
import { DateTime } from 'luxon'
import { UserWalletDbManager } from '../dal/UserWallet.data'
import { SupportedCurrencies } from '../models/Wallet.model'

export abstract class SceneManager {
  // Base Scene Operations //
  static loadScene: CallableFunction = async (sceneId: string) => {
    try {
      let scene = await SceneDbManager.getById(sceneId)
      if (scene) {
        scene = await this.buildScene(scene)
      } else {
        scene = await this.createScene(new Scene.Config({ sk: sceneId }))
        scene = await this.buildScene(scene)
      }

      return scene
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.loadScene' })
    }
  }

  static obtainScene: CallableFunction = async (sceneConfig?: Scene.Config) => {
    try {
      let scene = await SceneDbManager.get(sceneConfig)
      if (!scene) {
        scene = await SceneDbManager.put(new Scene.Config(sceneConfig))
        scene = await SceneDbManager.addPresetToScene(scene, new Scene.Preset({ name: 'Signature Arrangement' }))
      }
      return scene
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.obtainScene' })
    }
  }

  static createScene: CallableFunction = async (scene?: Scene.Config) => {
    try {
      return await SceneDbManager.put(scene)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.createScene' })
    }
  }

  static createSceneForUser: CallableFunction = async (user: User.Account, sceneConfig?: Scene.Config) => {
    try {
      const newScene = new Scene.Config(sceneConfig),
        initialPreset = new Scene.Preset({ name: 'Signature Arrangement' }),
        initialSettings = new Scene.DefaultSettings(newScene).settings,
        newSceneLink = new User.SceneLink(user, newScene)
      newScene.scenePreset = initialPreset.sk
      newScene.presets = [initialPreset.sk]
      newScene.settings = initialSettings.map((setting) => setting.sk)

      const scene = await SceneManager.createScene(newScene),
        { presets } = await ScenePresetManager.addPresetsToScene(scene, initialPreset),
        { settings } = await SceneSettingsManager.addSettingsToScene(scene, initialSettings),
        sceneLink = await SceneManager.createUserLink(newSceneLink),
        fullScene = await SceneManager.buildScene(scene)

      return { scene, sceneLink, fullScene, presets, settings }
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.createSceneForUser' })
    }
  }

  static getScene: CallableFunction = async (scene: Scene.Config) => {
    try {
      return await SceneDbManager.get(scene)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.getScene' })
    }
  }

  static getSceneById: CallableFunction = async (sceneId: string) => {
    try {
      return await SceneDbManager.getById(sceneId)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.getSceneById' })
    }
  }

  static getScenesForUser: CallableFunction = async (vlmUser: User.Account) => {
    try {
      const sceneIds = await SceneDbManager.getIdsForUser(vlmUser)
      return await SceneDbManager.getByIds(sceneIds)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.getScenesForUser' })
    }
  }

  static getIdsForUser: CallableFunction = async (vlmUser: User.Account) => {
    try {
      return await SceneDbManager.getIdsForUser(vlmUser.sk)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.getIdsForUser' })
    }
  }

  static updateSceneProperty: CallableFunction = async ({ scene, prop, val }: { scene: Scene.Config; prop: string; val?: unknown }) => {
    try {
      return await SceneDbManager.updateSceneProperty(scene, prop, val)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.updateSceneProperty' })
      return
    }
  }

  static changeScenePreset: CallableFunction = async (sceneConfig: Scene.Config, presetId: string) => {
    try {
      const sceneStub = await this.updateSceneProperty({ scene: sceneConfig, prop: 'scenePreset', val: presetId }),
        scene = await this.buildScene(sceneStub)

      return scene
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.changeScenePreset' })
    }
  }

  static getGiveawaysForScene: CallableFunction = async (scene: Scene.Config) => {
    const giveaways = await GiveawayManager.getGiveawaysForSceneEvents(scene.sk)
    return giveaways
  }

  static inviteUserByWallet: CallableFunction = async (inviteConfig: Scene.Invite & { connectedWallet: string; currency: SupportedCurrencies }) => {
    try {
      const user = await UserWalletDbManager.obtain(
        new User.Wallet({ address: inviteConfig.connectedWallet, currency: inviteConfig.currency || 'ETH' })
      )
      const invite = new Scene.Invite({ ...inviteConfig, userId: user.userId })
      await GenericDbManager.put(invite)

      return { user, invite }
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.inviteUser' })
    }
  }
  ////

  static buildScene: CallableFunction = async (sceneConfig?: Scene.Config, locale?: string) => {
    try {
      let presetsLoaded = false

      let scene = new Scene.Config(sceneConfig)

      if (!sceneConfig) {
        await SceneManager.createScene(scene)
      }

      // create the first preset if one doesn't exist in this scene
      if (!scene.presets || !scene.presets.length) {
        scene = await ScenePresetManager.createInitialPreset(scene)
      }

      if (scene.presets.every((preset) => typeof preset === 'string')) {
        presetsLoaded = false
      } else {
        presetsLoaded = true
      }

      if (!scene.scenePreset && !presetsLoaded) {
        scene.scenePreset = scene.presets[0]
      } else if (!scene.scenePreset && presetsLoaded && typeof scene.presets[0] !== 'string') {
        scene.scenePreset = scene.scenePreset || scene.presets[0].sk
      }

      if (!presetsLoaded) {
        await SceneManager.fillInPresetIds(scene)
      }
      await SceneManager.fillInSettingIds(scene)

      return scene
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.buildScene' })
      return
    }
  }

  static fillInPresetIds: CallableFunction = async (scene: Scene.Config) => {
    const presetArr: string[] = (scene.presets as string[]) || [],
      presetIds: string[] = []

    // start looping through the preset array, convert preset ids to preset records
    for (let i = 0; i < presetArr.length; i++) {
      if (typeof presetArr[i] !== 'string') {
        continue
      }
      if (!scene.scenePreset && i == 0) {
        scene.scenePreset = presetArr[i]
      }

      const sk: string = presetArr[i]
      presetIds.push(sk)
      let scenePreset = await ScenePresetManager.getScenePresetById(sk)

      if (!scenePreset) {
        scenePreset = await ScenePresetManager.createScenePreset(new Scene.Preset({ name: `Signature Arrangement`, sk }))
      }

      if (!scene.scenePreset && i == 0) {
        const newPreset = await ScenePresetManager.buildScenePreset(scenePreset)
        const changeResult = await SceneManager.changeScenePreset(scene, newPreset.sk)
        scene = changeResult
        scene.presets[i] = newPreset
      } else {
        scene.presets[i] = await ScenePresetManager.buildScenePreset(scenePreset)
      }
    }

    // loop ends
  }

  static fillInSettingIds: CallableFunction = async (scene: Scene.Config) => {
    if (scene.settings.length > new Scene.DefaultSettings(scene).settings.length) {
      scene.settings.forEach((setting: string | Scene.Setting) => {
        if (typeof setting === 'string') {
          GenericDbManager.put({ pk: Scene.Setting.pk, sk: setting, ttl: DateTime.now().toUnixInteger() })
        } else {
          GenericDbManager.put({ pk: Scene.Setting.pk, sk: setting.sk, ttl: DateTime.now().toUnixInteger() })
        }
      })

      await SceneManager.updateSceneProperty({ scene, prop: 'settings', val: [] })
      const addSettingsResponse = await SceneSettingsManager.addSettingsToScene(scene, new Scene.DefaultSettings(scene).settings)
      scene.settings = addSettingsResponse.settings
    } else {
      scene.settings = await SceneSettingsManager.getSceneSettingsByIds(scene.settings)
    }
  }
  //

  // Scene User State Operations //
  static getUserStateByScene: CallableFunction = async (sceneId: string, key: string) => {
    try {
      if (key == 'pk' || 'sk') {
        return false
      }
      const userState = await SceneDbManager.getSceneUserState(sceneId)
      return userState[key]
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.getUserStateByScene' })
      return
    }
  }

  static setUserStateByScene: CallableFunction = async (sceneId: string, key: string, value: unknown) => {
    try {
      if (key == 'pk' || 'sk') {
        return false
      }
      const userState = await SceneDbManager.getSceneUserState(sceneId)
      return await SceneDbManager.setSceneUserState(userState, key, value)
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.setUserStateByScene' })
      return
    }
  }
  ////

  // Generic Scene Element Operations //
  static getSceneElementById: CallableFunction = async (pk: string, sk: string) => {
    try {
      const element = await GenericDbManager.get({ pk, sk })
      switch (pk) {
        case 'vlm.scene.image':
          return new Scene.Image.Config(element)
        case 'vlm.scene.image.instance':
          return new Scene.Image.Instance(element)
        case 'vlm.scene.video':
          return new Scene.Video.Config(element)
        case 'vlm.scene.video.instance':
          return new Scene.Video.Instance(element)
        case 'vlm.scene.model':
          return new Scene.Model.Config(element)
        case 'vlm.scene.model.instance':
          return new Scene.Model.Instance(element)
        case 'vlm.scene.nft':
          return new Scene.NFT.Config(element)
        case 'vlm.scene.sound':
          return new Scene.Sound.Config(element)
        case 'vlm.scene.sound.instance':
          return new Scene.Sound.Instance(element)
        case 'vlm.scene.widget':
          return new Scene.Widget.Config(element)
        case 'vlm.scene.giveaway.claimpoint':
          return new Scene.Giveaway.ClaimPoint(element)
        default:
          return element
      }
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.getSceneElementById' })
      return
    }
  }
  ////

  // Many-to-Many Link Creation Shortcuts //
  static createUserLink: CallableFunction = async (sceneLink: User.SceneLink) => {
    try {
      return (await GenericDbManager.put(sceneLink)) as User.SceneLink
    } catch (error) {
      AdminLogManager.logError(error, { from: 'SceneManager.createUserLink' })
      return
    }
  }
  //
}
