import express, { Request, Response } from 'express'
import { authMiddleware } from '../../middlewares/security/auth'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { getDclCollection, getDclCollectionsForUser, getDclCollectionItems } from '../../helpers/collectables'
const router = express.Router()

router.get('/user', authMiddleware, async (req: Request, res: Response) => {
  try {
    const collections = await getDclCollectionsForUser(req.session.connectedWallet)

    return res.status(200).json({
      text: `Collection received`,
      collections,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Collection.controller/:contractAddress',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('/:contractAddress', authMiddleware, async (req: Request, res: Response) => {
  try {
    const collection = await getDclCollection(req.params.contractAddress)

    return res.status(200).json({
      text: `Collection received`,
      collection,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Collection.controller/:contractAddress',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('/:contractAddress/items', authMiddleware, async (req: Request, res: Response) => {
  try {
    const items = await getDclCollectionItems(req.params.contractAddress)

    return res.status(200).json({
      text: `Collection items received`,
      items,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Collection.controller/:contractAddress/items',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

export default router
