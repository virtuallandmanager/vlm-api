"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const uuid_1 = require("uuid");
const luxon_1 = require("luxon");
var Event;
(function (Event) {
    class Config {
        constructor(config) {
            this.pk = Config.pk; // Partition Key
            this.sk = (0, uuid_1.v4)(); // Sort Key
            this.createdAt = luxon_1.DateTime.now().toUnixInteger();
            this.sk = config.sk || this.sk;
            this.userId = config.userId;
            this.name = config.name;
            this.createdAt = config.createdAt || this.createdAt;
            this.startTime = config.startTime;
            this.endTime = config.endTime;
            this.imageLink = config.imageLink;
            this.claimLimits = config.claimLimits;
        }
    }
    Config.pk = "vlm:event:config"; // Partition Key
    Event.Config = Config;
    class SceneLink {
        constructor(event, scene) {
            this.pk = SceneLink.pk;
            this.sk = (0, uuid_1.v4)();
            this.eventId = event.sk;
            this.sceneId = scene.sk;
        }
    }
    SceneLink.pk = "vlm:event:scene:link";
    Event.SceneLink = SceneLink;
    class OrgLink {
        constructor(event, scene) {
            this.pk = OrgLink.pk;
            this.sk = (0, uuid_1.v4)();
            this.eventId = event.sk;
            this.orgId = scene.sk;
        }
    }
    OrgLink.pk = "vlm:event:org:link";
    Event.OrgLink = OrgLink;
    class GiveawayLink {
        constructor(eventId, giveawayId) {
            this.pk = GiveawayLink.pk;
            this.sk = (0, uuid_1.v4)();
            this.eventId = eventId;
            this.giveawayId = giveawayId;
        }
    }
    GiveawayLink.pk = "vlm:event:giveaway:link";
    Event.GiveawayLink = GiveawayLink;
    let Giveaway;
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
                this.items = config.items;
                this.ts = config.ts;
            }
        }
        Config.pk = "vlm:event:giveaway:config";
        Giveaway.Config = Config;
        class Claim {
            constructor(config) {
                this.pk = Claim.pk;
                this.sk = (0, uuid_1.v4)();
                this.ts = Date.now();
                this.sk = config.sk || this.sk;
                this.to = config.to;
                this.clientIp = config.clientIp;
                this.sceneId = config.sceneId;
                this.eventId = config.eventId;
                this.giveawayId = config.giveawayId;
                this.sceneId = config.sceneId;
                this.claimTs = config.claimTs;
                this.ts = config.ts;
            }
        }
        Claim.pk = "vlm:event:giveaway:claim";
        Giveaway.Claim = Claim;
        class Item {
            constructor(config) {
                this.pk = Item.pk;
                this.sk = (0, uuid_1.v4)();
                this.claimLimits = { total: 0, perUser: 1, perIp: 3 };
                this.ts = Date.now();
                this.sk = config.sk || this.sk;
                this.name = config.name;
                this.chain = config.chain;
                this.contractAddress = config.contractAddress;
                this.itemId = config.itemId;
                this.claimLimits = config.claimLimits;
                this.claimCount = config.claimCount;
                this.imageUrl = config.imageUrl;
                this.ts = config.ts;
            }
        }
        Item.pk = "vlm:event:giveaway:item";
        Giveaway.Item = Item;
    })(Giveaway = Event.Giveaway || (Event.Giveaway = {}));
})(Event = exports.Event || (exports.Event = {}));
