import express, { Request, Response } from 'express'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { UserManager } from '../../logic/User.logic'
import { authMiddleware } from '../../middlewares/security/auth'
import { GiveawayManager } from '../../logic/Giveaway.logic'
import { User } from '../../models/User.model'
import { Giveaway } from '../../models/Giveaway.model'
import { TransactionManager } from '../../logic/Transaction.logic'

const router = express.Router()

router.get('/all', authMiddleware, async (req: Request, res: Response) => {
  // Gets all giveaways for user
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        text: 'Unauthorized.',
      })
    }
    // Find user
    const user = await UserManager.getById(req.session.userId),
      // Get giveaways for user
      giveaways = await GiveawayManager.getGiveawaysForUser(user)

    return res.status(200).json({
      text: 'Successfully fetched giveaways.',
      giveaways,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Giveaway.controller/cards',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      giveawayConfig = req.body.giveaway

    const giveaway = await GiveawayManager.create({ ...giveawayConfig, userId })

    return res.status(200).json({
      text: 'Successfully created giveaway.',
      giveaway,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Giveaway.controller/create',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/update', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      giveawayConfig = req.body.giveaway

    const existingGiveaway = await GiveawayManager.getById(giveawayConfig.sk),
      giveaway = await GiveawayManager.update({ ...existingGiveaway, ...giveawayConfig, userId })

    return res.status(200).json({
      text: 'Successfully created giveaway.',
      giveaway,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Giveaway.controller/create',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/item/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      giveawayId = req.body.giveawayId,
      item = new Giveaway.Item({ ...req.body.item })

    let giveaway = await GiveawayManager.getById(giveawayId)
    giveaway = await GiveawayManager.addItem(giveaway, item)

    return res.status(200).json({
      text: 'Successfully created giveaway.',
      giveaway,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Giveaway.controller/create',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('/:giveawayId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId
    if (!userId) {
      return res.status(400).json({
        text: 'Bad Request.',
      })
    }

    const user = await UserManager.getById(req.session.userId),
      giveaway: Giveaway.Config = await GiveawayManager.getById(req.params.giveawayId),
      giveawayItems = [...giveaway.items],
      fullGiveawayItems = await GiveawayManager.getItemsForGiveaway(giveawayItems)

    giveaway.items = fullGiveawayItems

    if (giveaway.userId !== user.sk && UserManager.getAdminLevel(user) <= User.Roles.VLM_ADMIN) {
      return res.status(401).json({
        nachos: 'Mmmmm...Ahh, got hungry, forgot error message.',
        text: 'Ok seriously, you gotta login again or something.',
      })
    }

    return res.status(200).json({
      text: 'Found giveaway.',
      giveaway,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Giveaway.controller/:giveawayId',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/set-minter/request', authMiddleware, async (req: Request, res: Response) => {
  const { contracts, ids, minter } = req.body
  const session = req.session

  const user = await UserManager.getById(session.userId)

  if (!session || !user) {
    return res.status(401).send('Unauthorized: Invalid user/session.')
  }

  if (!contracts || !ids || !minter) {
    return res.status(400).send('Missing required parameters.')
  }

  if (contracts.length !== ids.length) {
    return res.status(400).send('Contracts and IDs arrays must have the same length.')
  }

  const transactions = TransactionManager.createMinterRightsTranactions(user, { contracts, ids, minter })

  res.json({ transactions })
})

router.post('/set-minter/broadcast', async (req: Request, res: Response | any) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: 'Bad Request.',
      })
    }

    return res.status(200)
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Transaction.controller/create',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/check-minting-rights', async (req: Request, res: Response) => {
  const { giveawayIds } = req.body

  if (!giveawayIds) {
    return res.status(400).send('Invalid request')
  }

  const minter = await TransactionManager.getMinter()
  const giveaways = await GiveawayManager.getByIds(giveawayIds)
  const giveawayItems = await GiveawayManager.getItemsForGiveaways(giveaways)

  const contracts = giveawayItems.map((item: Giveaway.Item) => item?.contractAddress).filter((x: string) => x)
  const ids = giveawayItems.map((item: Giveaway.Item) => item?.itemId)

  try {
    const { allGranted, grantedRights, missingRights } = await TransactionManager.checkMintingRights({ contracts, ids, minter })

    return res.json({ allGranted, grantedRights, missingRights })
  } catch (error) {
    AdminLogManager.logError(error, { from: 'Giveaway.controller/check-minting-rights' })
    return res.status(500).send({ text: 'Error checking minting rights' })
  }
})

export default router
