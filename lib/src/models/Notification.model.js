"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
var Notification;
(function (Notification) {
    class Config {
        constructor(config) {
            this.pk = Config.pk;
            this.seen = config.seen;
            this.read = config.read;
            this.delivered = config.delivered || this.delivered;
            this.receiverId = config.receiverId;
            this.senderId = config.senderId;
            this.senderName = config.senderName;
            this.originType = config.originType;
            this.origin = config.origin;
            this.message = config.message;
        }
    }
    Config.pk = "vlm:notification:config";
    Notification.Config = Config;
    let DeliveryType;
    (function (DeliveryType) {
        DeliveryType[DeliveryType["WEB"] = 0] = "WEB";
        DeliveryType[DeliveryType["SMS"] = 1] = "SMS";
        DeliveryType[DeliveryType["EMAIL"] = 2] = "EMAIL";
        DeliveryType[DeliveryType["WORLD"] = 3] = "WORLD";
    })(DeliveryType = Notification.DeliveryType || (Notification.DeliveryType = {}));
    let OriginType;
    (function (OriginType) {
        OriginType[OriginType["SERVER"] = 0] = "SERVER";
        OriginType[OriginType["USER"] = 1] = "USER";
        OriginType[OriginType["WORLD"] = 2] = "WORLD";
    })(OriginType = Notification.OriginType || (Notification.OriginType = {}));
})(Notification = exports.Notification || (exports.Notification = {}));
