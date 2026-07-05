"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const playerMatchStatsSchema = new mongoose_1.Schema({
    matchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ScoringMatch',
        required: true,
    },
    playerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        // No default — field is intentionally absent for guests so it doesn't
        // participate in any index. Setting default: null would store null and
        // trigger the { matchId, playerId } unique index for every guest doc.
    },
    guestName: {
        type: String,
        // No default — absent for registered players
    },
    battingStats: {
        runs: { type: Number, default: 0 },
        ballsFaced: { type: Number, default: 0 },
        fours: { type: Number, default: 0 },
        sixes: { type: Number, default: 0 },
        isOut: { type: Boolean, default: false },
        dismissalType: { type: String, default: null },
        strikeRate: { type: Number, default: 0 },
    },
    bowlingStats: {
        oversBowled: { type: Number, default: 0 },
        ballsBowled: { type: Number, default: 0 },
        runsConceded: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        maidens: { type: Number, default: 0 },
        economy: { type: Number, default: 0 },
    },
    fieldingStats: {
        catches: { type: Number, default: 0 },
        runOuts: { type: Number, default: 0 },
        stumpings: { type: Number, default: 0 },
    },
}, {
    timestamps: true,
});
playerMatchStatsSchema.index({ matchId: 1 });
// Unique index for registered players only — partialFilterExpression excludes
// documents where playerId is null or absent, so guest players never participate.
// This is better than sparse:true which still indexes explicit null values.
playerMatchStatsSchema.index({ matchId: 1, playerId: 1 }, { unique: true, partialFilterExpression: { playerId: { $type: 'objectId' } } });
// Guest player uniqueness — only documents that have a guestName field participate
playerMatchStatsSchema.index({ matchId: 1, guestName: 1 }, { unique: true, sparse: true });
exports.default = mongoose_1.default.model('PlayerMatchStats', playerMatchStatsSchema);
//# sourceMappingURL=PlayerMatchStats.js.map