import { docClient, vlmMainTable } from "./common.data";
import { AdminLogManager } from "../logic/ErrorLogging.logic";
import { Promotion } from "../models/Promotion.model";
import { GenericDbManager } from "./Generic.data";
import { User } from "../models/User.model";
import { Organization } from "../models/Organization.model";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { BalanceDbManager } from "./Balance.data";
import { Accounting } from "../models/Accounting.model";
import { TransactionDbManager } from "./Transaction.data";
import { largeQuery } from "../helpers/data";
import { DateTime } from "luxon";

export abstract class PromotionDbManager {
  static getClaimIdsForUser: CallableFunction = async (userId: string) => {
    try {
      const partialClaims = await GenericDbManager.getAllForUser(Promotion.Claim.pk, userId),
        balanceIds = partialClaims.map((claim: Promotion.Claim) => claim.sk);

      return balanceIds;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/getClaimIdsForUser",
        userId,
      });
      throw error;
    }
  };

  static getClaimIdsForOrg: CallableFunction = async (orgId: string) => {
    try {
      const partialClaims = await GenericDbManager.getAllForOrg(Promotion.Claim.pk, orgId),
        claimIds = partialClaims.map((claim: Promotion.Claim) => claim.sk);

      return claimIds;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/getClaimIdsForOrg",
        orgId,
      });
      throw error;
    }
  };

  static obtainClaimAggregateForUser: CallableFunction = async (userId: string, promoId: string): Promise<Promotion.ClaimAggregate> => {
    try {
      const claimAggregate = await GenericDbManager.get({ pk: Promotion.ClaimAggregate.pk, sk: `${userId}:${promoId}` }) as Promotion.ClaimAggregate;
      if (!claimAggregate) {
        const newClaimAggregate = new Promotion.ClaimAggregate({ sk: `${userId}:${promoId}`, userId, promoId, balance: 0 });
        await GenericDbManager.put(newClaimAggregate);
        return newClaimAggregate;
      }
      return claimAggregate;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/obtainClaimAggregateForUser",
        userId,
      });
      throw error;
    }
  };

  static obtainClaimAggregateForOrg: CallableFunction = async (orgId: string, promoId: string): Promise<Promotion.ClaimAggregate> => {
    try {
      const claimAggregate = await GenericDbManager.get({ pk: Promotion.ClaimAggregate.pk, sk: `${orgId}:${promoId}` }) as Promotion.ClaimAggregate;
      if (!claimAggregate) {
        const newClaimAggregate = new Promotion.ClaimAggregate({ sk: `${orgId}:${promoId}`, orgId, promoId, balance: 0 });
        await GenericDbManager.put(newClaimAggregate);
        return newClaimAggregate;
      }
      return claimAggregate;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/obtainClaimAggregateForOrg",
        orgId,
      });
      throw error;
    }
  };

  static getClaimAggregatesForUser: CallableFunction = async (userId: string) => {
    try {
      const claimAggregates = await GenericDbManager.getAllForUser(Promotion.ClaimAggregate.pk, userId) as Promotion.ClaimAggregate;
      return claimAggregates;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/getClaimIdsForUser",
        userId,
      });
      throw error;
    }
  };

  static obtain: CallableFunction = async (promo: Promotion.Config) => {
    let existingPromo, newPromo;
    try {
      existingPromo = await this.get(promo);
      if (!existingPromo) {
        newPromo = await this.put(promo);
      }

      return existingPromo || newPromo;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/obtain",
        promo,
      });
      throw error;
    }
  };

  static getActive: CallableFunction = async () => {
    const currentTime = DateTime.now().toUnixInteger();

    const params = {
      TableName: vlmMainTable,
      KeyConditionExpression: 'pk = :pk',
      FilterExpression:
        "(attribute_not_exists(promoStart) OR attribute_type(promoStart, :typeNull) OR promoStart < :currentTime) AND " +
        "(attribute_not_exists(promoEnd) OR attribute_type(promoEnd, :typeNull) OR promoEnd > :currentTime) AND " +
        "#enabled = :enabled",
      ExpressionAttributeNames: {
        "#enabled": "enabled"
      },
      ExpressionAttributeValues: {
        ":pk": Promotion.Config.pk,
        ":currentTime": currentTime,
        ":enabled": true,
        ":typeNull": "NULL"
      }
    };
    try {
      const promoRecords = await largeQuery(params);
      const promos = promoRecords as Promotion.Config[];
      return promos;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/getActive",
      });
      throw error;
    }
  };

  static obtainUserPromoClaim: CallableFunction = async (userId: string, promoId: string) => {
    let existingPromoClaim, newPromoClaim;

    try {
      const claimIds = this.getClaimIdsForUser(userId);
      const claims = [];
      let claimsForPromo = [];

      if (claimIds.length) {
        for (const claimId of claimIds) {
          const claim = await this.getClaim({ pk: Promotion.Claim.pk, sk: claimId });
          claims.push(claim);
        }
        claimsForPromo = claims.filter((claim: Promotion.Claim) => claim.promoId === promoId);
      }

      if (!claimsForPromo.length) {
        const promo = await this.getById(promoId);
        const promoClaimConfig = new Promotion.Claim({ pk: Promotion.Claim.pk, promoId, userId, amount: 0 });
        newPromoClaim = await this.putClaim(promo, promoClaimConfig);
      } else {
        existingPromoClaim = claimsForPromo[0];
      }

      return existingPromoClaim || newPromoClaim;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/obtainUserPromoClaim",
        userId,
        promoId,
      });
      throw error;
    }
  };

  static obtainOrgPromoClaim: CallableFunction = async (orgId: string, promoId: string) => {
    let existingPromo, newPromo;

    try {
      const claimIds = this.getClaimIdsForOrg(orgId);
      const claims = await claimIds.map((claimId: string) => this.getClaim({ pk: Promotion.Claim.pk, sk: claimId }));
      const claimsForPromo = claims.filter((claim: Promotion.Claim) => claim.promoId === promoId);

      if (!claimsForPromo.length) {
        const newPromoConfig = new Promotion.Claim({ pk: Promotion.Claim.pk, promoId, orgId, amount: 0 });
        newPromo = await this.putClaim(newPromoConfig);
      } else {
        existingPromo = claimsForPromo[0];
      }

      return existingPromo || newPromo;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/obtainOrgPromoClaim",
        orgId,
        promoId,
      });
      throw error;
    }
  };

  static getPromoById: CallableFunction = async (sk: string) => {
    const params = {
      TableName: vlmMainTable,
      Key: {
        pk: Promotion.Config.pk,
        sk,
      },
    };

    try {
      const promoRecord = await docClient.get(params).promise();
      const promo = promoRecord.Item as Promotion.Config;
      return promo;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/getPromoById",
        sk,
      });
      throw error;
    }
  };

  static claimPromoBalance: CallableFunction = async ({ promotion, claim, claimAggregate, transaction, balance }: { promotion: Promotion.Config, claim: Promotion.Claim, claimAggregate: Promotion.ClaimAggregate, transaction: Accounting.Transaction, balance: User.Balance | Organization.Balance }) => {
    try {
      const newClaimedCredits = Math.min(claimAggregate.balance + claim.amount, promotion.claimLimits.perUser);
      claimAggregate.claims.push({ claimId: claim.sk, ts: claim.ts, amount: claim.amount });
      claimAggregate.balance = newClaimedCredits;


      const transactionPut: DocumentClient.TransactWriteItem = {
        Put: {
          TableName: vlmMainTable,
          Item: transaction,
        },
      };

      const claimPut: DocumentClient.TransactWriteItem = {
        Put: {
          TableName: vlmMainTable,
          Item: claim,
        },
      };

      const claimAggregateUpdate: DocumentClient.TransactWriteItem = {
        Put: {
          TableName: vlmMainTable,
          Item: claimAggregate,
        },
      };

      // Update the user balance
      const balanceUpdate: DocumentClient.TransactWriteItem = {
        Update: {
          TableName: vlmMainTable,
          Key: { pk: balance.pk, sk: balance.sk },
          UpdateExpression: 'ADD #value :credits',
          ExpressionAttributeValues: {
            ':credits': Math.min(claim.amount, promotion.claimLimits.perUser),
          },
          ExpressionAttributeNames: {
            '#value': 'value',
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        },
      };

      const params = {
        TransactItems: [transactionPut, claimPut, balanceUpdate, claimAggregateUpdate],
      };

      await docClient.transactWrite(params).promise();

      const adjustedBalance = await BalanceDbManager.get(balance);

      return adjustedBalance;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/claimPromoBalance",
        promotion,
      });

      // Record a failed transaction
      await TransactionDbManager.put({ ...transaction, status: Accounting.TransactionStatus.FAILED });
      throw error;
    }
  };


  static get: CallableFunction = async (promotion: Promotion.Config) => {
    const { pk, sk } = promotion;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const promoRecord = await docClient.get(params).promise();
      const promo = promoRecord.Item as Promotion.Config;
      return promo;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/get",
        promotion,
      });
      throw error;
    }
  };

  static getById: CallableFunction = async (promoId: string) => {

    try {
      const params = {
        TableName: vlmMainTable,
        Key: {
          pk: Promotion.Config.pk,
          sk: promoId,
        },
      };

      const promoRecord = await docClient.get(params).promise();
      const promo = promoRecord.Item as Promotion.Config;
      return promo;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/get",
        promoId,
      });
      throw error;
    }
  };

  static getClaim: CallableFunction = async (claim: Promotion.Claim) => {
    const { pk, sk } = claim;

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    };

    try {
      const claimRecord = await docClient.get(params).promise();
      const claim = claimRecord.Item as Promotion.Claim;
      return claim;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/getClaim",
        claim,
      });
      throw error;
    }
  };

  static put: CallableFunction = async (promotion: Promotion.Config) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...promotion,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return promotion;
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/put",
        promotion,
      });
      throw error;
    }
  };

  static putClaim: CallableFunction = async (promotion: Promotion.Config, claim: Promotion.Claim) => {
    if (claim.amount > promotion.claimLimits.perUser) {
      claim.amount = promotion.claimLimits.perUser;
    }

    const params = {
      TableName: vlmMainTable,
      Item: {
        ...claim,
        ts: Date.now(),
      },
    };

    try {
      await docClient.put(params).promise();
      return this.getClaim(claim);
    } catch (error) {
      AdminLogManager.logError(JSON.stringify(error), {
        from: "Promotion.data/put",
        promotion,
      });
      throw error;
    }
  };
}
