import express, { Request, Response } from 'express'
import { authMiddleware } from '../../middlewares/security/auth'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { BalanceManager } from '../../logic/Balance.logic'
import { UserManager } from '../../logic/User.logic'
import { OrganizationManager } from '../../logic/Organization.logic'
import { Organization } from '../../models/Organization.model'
import { PromotionManager } from '../../logic/Promotion.logic'
import { GiveawayManager } from '../../logic/Giveaway.logic'

const router = express.Router()

router.get('/user/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId

    let balances, promotions

    if (userId) {
      balances = await BalanceManager.obtainUserBalances(userId)
      promotions = await PromotionManager.obtainPromoBalancesForUser(userId)
    }

    return res.status(200).json({
      balances,
      promotions,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Balance.controller/user/all',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('/organization/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId

    let balances: { [any: string]: number } = {}

    if (userId) {
      const userOrgs = await OrganizationManager.getUserOrgs(userId)

      userOrgs.forEach(async (org: Organization.Config) => {
        const balance = await BalanceManager.getOrgBalances(org.sk)
        balances[org.sk] = balance.value
      })
    }

    return res.status(200).json({
      text: `Got organization balances.`,
      balances,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Balance.controller/getAll',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      orgId = req.body.orgId,
      balanceType = req.body.balanceType,
      amount = req.body.amount
    let existingBalance, adjustedBalance

    if (userId) {
      existingBalance = await BalanceManager.obtainBalanceTypeForUser(userId, balanceType)
      adjustedBalance = await BalanceManager.adjustUserBalance(existingBalance, amount)
    } else if (orgId) {
      existingBalance = await BalanceManager.obtainBalanceTypeForOrg(orgId, balanceType)
      adjustedBalance = await BalanceManager.adjustOrgBalance(existingBalance, amount)
    }

    return res.status(200).json({
      text: `Added ${amount} to balance.`,
      balance: adjustedBalance.value,
      balanceType: adjustedBalance.balanceType,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Balance.controller/add',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/deduct', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      orgId = req.body.orgId,
      balanceType = req.body.balanceType,
      amount = req.body.amount

    const userBalance = await BalanceManager.obtainBalanceTypeForUser(userId, balanceType)
    const adjustedBalance = await BalanceManager.adjustUserBalance(userBalance, amount)

    return res.status(200).json({
      text: `Deducted ${amount} from balance.`,
      balance: adjustedBalance.value,
      balanceType: adjustedBalance.balanceType,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Balance.controller/deduct',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/allocate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      giveawayId = req.body.giveawayId,
      balanceType = req.body.balanceType,
      amount = req.body.amount

    let balance = await BalanceManager.obtainBalanceTypeForUser(userId, balanceType)
    const giveaway = await GiveawayManager.getById(giveawayId)
    const adjustedBalance = await GiveawayManager.allocateCreditsToGiveaway({ balance, giveaway, amount })
    const adjustedGiveaway = await GiveawayManager.getById(giveaway, amount)
    balance = adjustedBalance && { [adjustedBalance.type]: adjustedBalance.value }

    return res.status(200).json({
      text: `Allocated ${amount} credit${amount !== 1 && 's'} to ${giveaway.name}.`,
      balances: [balance],
      giveaways: [adjustedGiveaway],
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Balance.controller/deduct',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.post('/transfer', authMiddleware, async (req: Request, res: Response) => {
  try {
    const to = req.body.to,
      from = req.body.from,
      amount = req.body.amount,
      balanceType = req.body.balanceType

    let senderBalance, recipientBalance, adjustedBalance

    if (to.hasOwnProperty('userId')) {
      recipientBalance = await BalanceManager.obtainBalanceTypeForUser(to.userId, balanceType)
    } else if (to.hasOwnProperty('orgId')) {
      recipientBalance = await BalanceManager.obtainBalanceTypeForOrg(to.orgId, balanceType)
    } else if (to.hasOwnProperty('walletId')) {
      const user = UserManager.obtainUserByWallet({ sk: to.walletId })
      recipientBalance = await BalanceManager.obtainBalanceTypeForUser(user.sk, balanceType)
    }

    if (from.hasOwnProperty('userId')) {
      senderBalance = await BalanceManager.obtainBalanceTypeForUser(from.userId, balanceType)
    } else if (from.hasOwnProperty('orgId')) {
      senderBalance = await BalanceManager.obtainBalanceTypeForOrg(from.orgId, balanceType)
    } else if (from.hasOwnProperty('walletId')) {
      const user = UserManager.obtainUserByWallet({ sk: from.walletId })
      senderBalance = await BalanceManager.obtainBalanceTypeForUser(user.sk, balanceType)
    }

    if (to.hasOwnProperty('userId')) {
      adjustedBalance = await BalanceManager.adjustUserBalance(senderBalance, recipientBalance, amount)
    } else if (to.hasOwnProperty('orgId')) {
      adjustedBalance = await BalanceManager.adjustOrgBalance(senderBalance, recipientBalance, amount)
    }

    return res.status(200).json({
      text: `Transferred ${amount} to recipient account.`,
      adjustedBalance: adjustedBalance.value,
    })
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: 'Balance.controller/transfer',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

export default router
