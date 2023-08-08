"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
const luxon_1 = require("luxon");
const uuid_1 = require("uuid");
const User_model_1 = require("./User.model");
const Session_model_1 = require("./Session.model");
var Analytics;
(function (Analytics) {
    let User;
    (function (User) {
        class Account extends User_model_1.BaseUser.Account {
            constructor(config) {
                super(config);
                this.pk = Account.pk;
                if (config.hasConnectedWeb3 && !config.connectedWallet) {
                    this.connectedWallet = config.publicKey;
                }
                else if (!config.hasConnectedWeb3) {
                    this.ttl = luxon_1.DateTime.now().plus({ month: 1 }).toMillis();
                }
            }
        }
        Account.pk = `vlm:analytics:user`;
        User.Account = Account;
        class Wallet extends User_model_1.BaseUser.Wallet {
            constructor(config) {
                super(config);
                this.pk = Wallet.pk;
                this.userId = (0, uuid_1.v4)();
                this.currency = "ETH";
                this.sk = config.sk || config.address;
                this.currency = config.currency;
                this.userId = config.userId || this.userId;
            }
        }
        Wallet.pk = "vlm:analytics:user:wallet";
        User.Wallet = Wallet;
    })(User = Analytics.User || (Analytics.User = {}));
    let Session;
    (function (Session) {
        class Config extends Session_model_1.Session.Config {
            constructor(config) {
                super(config);
                this.pk = Config.pk;
                this.device = config.device;
                this.worldLocation = config.worldLocation;
            }
        }
        Config.pk = "vlm:analytics:session";
        Session.Config = Config;
        class BotConfig extends Session_model_1.Session.Config {
            constructor(config) {
                super(config);
                this.pk = Config.pk;
                this.suspicious = true;
                this.device = config.device;
                this.worldLocation = config.worldLocation;
            }
        }
        BotConfig.pk = "vlm:analytics:session";
        Session.BotConfig = BotConfig;
        class Action {
            constructor(config) {
                this.pk = Action.pk;
                this.sk = (0, uuid_1.v4)(); // Sort Key
                this.name = "Unknown Action";
                this.metadata = {};
                this.ts = Date.now();
                this.sk = config.sk || this.sk;
                this.name = config.name || this.name;
                this.sessionId = config.sessionId;
                this.sceneId = config.sceneId;
                this.origin = config.origin;
                this.pathPoint = config.pathPoint;
                this.metadata = config.metadata || this.metadata;
                this.ts = config.ts || this.ts;
            }
        }
        Action.pk = "vlm:analytics:session:action"; // Partition Key
        Session.Action = Action;
    })(Session = Analytics.Session || (Analytics.Session = {}));
    class Path {
        constructor(config) {
            this.pk = Path.pk;
            this.sk = (0, uuid_1.v4)(); // Sort Key
            this.segments = [];
            this.sk = (config === null || config === void 0 ? void 0 : config.sk) || this.sk;
            this.segments = (config === null || config === void 0 ? void 0 : config.segments) || this.segments;
        }
    }
    Path.pk = "vlm:analytics:path"; // Partition Key
    Analytics.Path = Path;
    class PathSegment {
        constructor(config) {
            this.pk = PathSegment.pk;
            this.sk = (0, uuid_1.v4)(); // Sort Key
            this.sk = config.sk || this.sk;
            this.pathId = config.pathId;
            this.type = config.type;
            this.path = config.path;
        }
    }
    PathSegment.pk = "vlm:analytics:path:segment"; // Partition Key
    Analytics.PathSegment = PathSegment;
    let SegmentType;
    (function (SegmentType) {
        SegmentType[SegmentType["LOADING"] = 0] = "LOADING";
        SegmentType[SegmentType["IDLE"] = 1] = "IDLE";
        SegmentType[SegmentType["STATIONARY_DISENGAGED"] = 2] = "STATIONARY_DISENGAGED";
        SegmentType[SegmentType["STATIONARY_ENGAGED"] = 3] = "STATIONARY_ENGAGED";
        SegmentType[SegmentType["RUNNING_DISENGAGED"] = 4] = "RUNNING_DISENGAGED";
        SegmentType[SegmentType["WALKING_DISENGAGED"] = 5] = "WALKING_DISENGAGED";
        SegmentType[SegmentType["RUNNING_ENGAGED"] = 6] = "RUNNING_ENGAGED";
        SegmentType[SegmentType["WALKING_ENGAGED"] = 7] = "WALKING_ENGAGED";
    })(SegmentType = Analytics.SegmentType || (Analytics.SegmentType = {}));
    Analytics.PathPointLegend = {
        0: "X-Position",
        1: "Y-Position",
        2: "Z-Position",
        3: "Timestamp",
        4: "X-Rotation",
        5: "Y-Rotation",
        6: "POV",
    };
    // Action Locations and Path Points are arrays of primitives for data efficiency.
    ///////////////////////////////////////////////////////////////////////////////////
    // Action Point: [W, B]
    ////////////////////// LEGEND //////////////////////
    // W [0] = metaverse world
    // B [1] = player's segmented position in world, if relevant, such as a DCL parcel
    ///////////////////////////////////////////////////////////////////////////////////
    // Path Point: [O, Px, Py, Pz, Rx, Ry, V]
    ////////////////////// LEGEND //////////////////////
    // O [0] = offset from startTime - tracked in seconds
    // P [1,2,3] = player's relative position in scene
    // R [4,5] = camera rotation
    // V [6] = pov
})(Analytics = exports.Analytics || (exports.Analytics = {}));
