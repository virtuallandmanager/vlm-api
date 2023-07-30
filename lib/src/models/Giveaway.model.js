"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Giveaway = void 0;
const uuid_1 = require("uuid");
var Giveaway;
(function (Giveaway) {
    class Config {
        constructor(config) {
            this.pk = Config.pk;
            this.sk = (0, uuid_1.v4)();
            this.startBuffer = 0;
            this.endBuffer = 0;
            this.claimLimits = { total: 0 };
            this.claimCount = 0;
            this.ts = Date.now();
            this.sk = config.sk || this.sk;
            this.name = config.name || this.name;
            this.startBuffer = config.startBuffer || this.startBuffer;
            this.endBuffer = config.endBuffer || this.claimCount;
            this.claimLimits = config.claimLimits || this.claimLimits;
            this.claimCount = config.claimCount || this.claimCount;
            this.eventId = config.eventId;
            this.paused = config.paused;
            this.items = config.items;
            this.ts = config.ts;
        }
    }
    Config.pk = "vlm:event:giveaway";
    Giveaway.Config = Config;
    class Claim {
        constructor(config) {
            this.pk = Claim.pk;
            this.sk = (0, uuid_1.v4)();
            this.queued = false;
            this.ts = Date.now();
            this.sk = config.sk || this.sk;
            this.to = config.to;
            this.clientIp = config.clientIp;
            this.sceneId = config.sceneId;
            this.eventId = config.eventId;
            this.giveawayId = config.giveawayId;
            this.sceneId = config.sceneId;
            this.claimTs = config.claimTs;
            this.analyticsRecord = config.analyticsRecord;
            this.ts = config.ts;
        }
    }
    Claim.pk = "vlm:event:giveaway:claim";
    Giveaway.Claim = Claim;
    class Item {
        constructor(config) {
            this.pk = Item.pk;
            this.sk = (0, uuid_1.v4)();
            this.chain = 137;
            this.claimLimits = { total: 0, perUser: 1, perIp: 3 };
            this.ts = Date.now();
            this.sk = config.sk || this.sk;
            this.name = config.name;
            this.chain = config.chain;
            this.contractAddress = config.contractAddress;
            this.itemId = config.itemId;
            this.claimLimits = config.claimLimits;
            this.claimCount = config.claimCount || 0;
            this.imageSrc = config.imageSrc;
            this.ts = config.ts;
        }
    }
    Item.pk = "vlm:event:giveaway:item";
    Giveaway.Item = Item;
    class ClaimResponse {
        constructor(config) {
            this.pk = ClaimResponse.pk;
            this.sk = (0, uuid_1.v4)();
            this.ts = Date.now();
            this.sk = config.sk || this.sk;
            this.headline = config.headline;
            this.message = config.message;
            this.messageOptions = config.messageOptions;
            this.ts = config.ts;
        }
    }
    ClaimResponse.pk = "vlm:event:giveaway:claim:response";
    Giveaway.ClaimResponse = ClaimResponse;
    let ClaimRejection;
    (function (ClaimRejection) {
        ClaimRejection[ClaimRejection["BEFORE_EVENT_START"] = 0] = "BEFORE_EVENT_START";
        ClaimRejection[ClaimRejection["AFTER_EVENT_END"] = 1] = "AFTER_EVENT_END";
        ClaimRejection[ClaimRejection["EXISTING_WALLET_CLAIM"] = 2] = "EXISTING_WALLET_CLAIM";
        ClaimRejection[ClaimRejection["OVER_IP_LIMIT"] = 3] = "OVER_IP_LIMIT";
        ClaimRejection[ClaimRejection["SUPPLY_DEPLETED"] = 4] = "SUPPLY_DEPLETED";
        ClaimRejection[ClaimRejection["INAUTHENTIC"] = 5] = "INAUTHENTIC";
        ClaimRejection[ClaimRejection["SUSPICIOUS"] = 6] = "SUSPICIOUS";
    })(ClaimRejection = Giveaway.ClaimRejection || (Giveaway.ClaimRejection = {}));
    let ClaimResponseType;
    (function (ClaimResponseType) {
        ClaimResponseType[ClaimResponseType["CLAIM_ACCEPTED"] = 0] = "CLAIM_ACCEPTED";
        ClaimResponseType[ClaimResponseType["CLAIM_DENIED"] = 1] = "CLAIM_DENIED";
        ClaimResponseType[ClaimResponseType["CLAIM_IN_PROGRESS"] = 2] = "CLAIM_IN_PROGRESS";
    })(ClaimResponseType = Giveaway.ClaimResponseType || (Giveaway.ClaimResponseType = {}));
})(Giveaway = exports.Giveaway || (exports.Giveaway = {}));
