import { Organization } from "../models/Organization.model";
import { User } from "../models/User.model";
import { PromotionDbManager } from "../dal/Promotion.data";
import { Promotion } from "../models/Promotion.model";
import { Accounting } from "../models/Accounting.model";
import { AdminLogManager } from "./ErrorLogging.logic";

export abstract class PromotionManager {

  static getActivePromotions: CallableFunction = async (promoId: string): Promise<Promotion.Config> => {
    return await PromotionDbManager.getActive(promoId);
  };

  static getById: CallableFunction = async (promoId: string) => {
    return await PromotionDbManager.getById(promoId);
  };

  static addClaim: CallableFunction = async (claim: Promotion.Claim) => {
    return await PromotionDbManager.put(claim);
  };

  static obtainUserPromoClaim: CallableFunction = async (userId: string, promoId: string) => {
    try {
      return await PromotionDbManager.obtainUserPromoClaim(userId, promoId);
    } catch (error) {
      AdminLogManager.logError(error, {
        from: "Promotion.data/obtainUserPromoClaim",
        userId,
        promoId,
      });
      console.log(error);
      return;
    }
  };

  static obtainOrgPromoClaim: CallableFunction = async (orgId: string, promoId: string) => {
    return await PromotionDbManager.obtainOrgPromoClaim(orgId, promoId);
  };

  static obtainPromoBalancesForUser: CallableFunction = async (userId: string) => {
    const promoBalances: { [promoId: string]: number } = {};
    const activePromos = await this.getActivePromotions();
    for (const promo of activePromos) {
      const claimAggregate = await PromotionDbManager.obtainClaimAggregateForUser(userId, promo.sk);
      promoBalances[promo.sk] = promo.claimLimits.perUser - claimAggregate.balance;
    }
    return promoBalances;
  };


  static obtainPromoBalancesForOrg: CallableFunction = async (orgId: string) => {
    const promoBalances: { [promoId: string]: number } = {};
    const activePromos = await this.getActivePromotions();
    for (const promo of activePromos) {
      const claimAggregate = await PromotionDbManager.obtainClaimAggregateForOrg(orgId, promo.sk);
      promoBalances[promo.sk] = promo.claimLimits.perUser - claimAggregate.balance;
    }
    return promoBalances;
  };

  static obtainClaimAggregateForUser: CallableFunction = async (userId: string, promoId: string) => {
    const claimAggregate = await PromotionDbManager.obtainClaimAggregateForUser(userId, promoId);
    return claimAggregate;
  };

  static obtainClaimAggregateForOrg: CallableFunction = async (orgId: string, promoId: string) => {
    const claimAggregate = await PromotionDbManager.obtainClaimAggregateForOrg(orgId, promoId);
    return claimAggregate;
  };

  static claimPromoBalance: CallableFunction = async ({ promotion, claim, claimAggregate, balance }: { promotion: Promotion.Config, claim: Promotion.Claim, claimAggregate: Promotion.ClaimAggregate, balance: User.Balance | Organization.Balance }) => {
    const transaction = new Accounting.Transaction({
      promoId: promotion.sk,
      claimId: claim.sk,
      userId: claim.userId,
      txAmount: claim.amount,
      txType: Accounting.TransactionType.CLAIMED_PROMOTION,
      status: Accounting.TransactionStatus.COMPLETED,  // Initially set the status to COMPLETED - if the DB transaction fails we will save it as FAILED
    });
    return await PromotionDbManager.claimPromoBalance({ promotion, claim, claimAggregate, transaction, balance });
  };
}
