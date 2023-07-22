"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractToken = void 0;
function extractToken(req) {
    let token;
    if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
        token = req.headers.authorization.split(" ")[1];
    }
    else if (req.query && req.query.token) {
        token = req.query.token;
    }
    if (token) {
        return token;
    }
    return null;
}
exports.extractToken = extractToken;
