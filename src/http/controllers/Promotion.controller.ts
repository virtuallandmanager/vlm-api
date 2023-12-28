import express, { Request, Response } from "express";
import { authMiddleware } from "../../middlewares/security/auth";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { PromotionManager } from "../../logic/Promotion.logic";
import { BalanceManager } from "../../logic/Balance.logic";
import { Promotion } from "../../models/Promotion.model";
const router = express.Router();

router.post("/claim", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId,
      orgId = req.body.orgId,
      promoId = req.body.promoId,
      amount = req.body.amount;

    let promotion, claim, claimAggregate, balance, adjustedBalance, promoBalance;

    if (promoId) {
      promotion = await PromotionManager.getById(promoId);
    }

    if (userId) {
      claim = await PromotionManager.addClaim(new Promotion.Claim({ userId, promoId, amount }));
      balance = await BalanceManager.obtainBalanceTypeForUser(userId, promotion.type);
      claimAggregate = await PromotionManager.obtainClaimAggregateForUser(userId, promoId);
    } else if (orgId) {
      claim = await PromotionManager.addClaim(new Promotion.Claim({ orgId, promoId, amount }));
      balance = await BalanceManager.obtainBalanceTypeForOrg(orgId, promotion.type);
      claimAggregate = await PromotionManager.obtainClaimAggregateForOrg(orgId, promoId);
    }

    if (promotion && claim && claimAggregate && balance && (claim.amount + claimAggregate.balance <= promotion.claimLimits.perUser)) {
      adjustedBalance = await PromotionManager.claimPromoBalance({ promotion, claim, claimAggregate, balance });
    } else {
      return res.status(400).json({
        error: `Promotion limit reached.`,
        balances: {},
        promotions: {}
      });
    }

    balance = adjustedBalance && { [adjustedBalance.type]: adjustedBalance.value };
    promoBalance = claimAggregate && { [promotion.sk]: promotion.claimLimits.perUser - claimAggregate.balance };

    return res.status(200).json({
      text: `Promotion claimed.`,
      balances: balance,
      promotions: promoBalance
    });
  } catch (error: unknown) {
    AdminLogManager.logError(error, {
      from: "Promotion.controller/claim",
    });
    return res.status(500).json({
      text: JSON.stringify(error) || "Something went wrong on the server. Try again.",
      error,
    });
  }
});


export default router;
