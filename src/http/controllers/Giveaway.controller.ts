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
  const { giveawayId, byItem } = req.body
  const session = req.session

  if (!session || !session.userId) {
    return res.status(401).json({
      text: 'Invalid or missing session.',
    })
  }
  if (!giveawayId) {
    return res.status(400).json({
      text: 'Missing required parameters.',
    })
  }

  const user = await UserManager.getById(session.userId)
  const giveaway = await GiveawayManager.getById(giveawayId)
  const giveawayItems = await GiveawayManager.getItemsForGiveaway(giveaway.items)
  const contracts = giveawayItems.map((item: Giveaway.Item) => item?.contractAddress).filter((x: string) => x)
  const ids = giveawayItems.map((item: Giveaway.Item) => item?.itemId)

  let minter

  if (!session || !user) {
    return res.status(401).send('Unauthorized: Invalid user/session.')
  }

  if (giveaway.minter) {
    const minterObj = await GiveawayManager.getMintingWalletById(giveaway.minter)
    minter = minterObj.publicKey
  } else {
    const minterObj = await GiveawayManager.getRandomMintingWallet()
    minter = minterObj.publicKey
    await GiveawayManager.setGiveawayMinter(giveaway, minterObj)
  }

  if (!contracts) {
    return res.status(400).send('Missing required parameters.')
  }
  const transactions = await TransactionManager.createMinterRightsTranactions(user, { contracts, ids, minter, byItem })

  res.json({ transactions })
})

router.post('/set-minter/broadcast', authMiddleware, async (req: Request, res: Response | any) => {
  try {
    if (!req.session.userId) {
      return res.status(400).json({
        text: 'Bad Request.',
      })
    }

    const signedTransactions = req.body.signedTransactions

    if (!signedTransactions) {
      return res.status(400).json({
        text: 'Bad Request.',
      })
    }

    const result = await TransactionManager.broadcastMinerRightsTransactions(signedTransactions)

    return res.json({ txReceipts: result })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Giveaway.controller/set-minter/broadcast',
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
