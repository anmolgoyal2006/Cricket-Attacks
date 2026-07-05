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
const playerCareerStatsSchema = new mongoose_1.Schema({
    playerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        // unique enforced by schema.index below — don't set unique:true here to avoid duplicate index
    },
    matchesPlayed: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    totalBallsFaced: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    totalFours: { type: Number, default: 0 },
    totalSixes: { type: Number, default: 0 },
    battingAverage: { type: Number, default: 0 },
    battingStrikeRate: { type: Number, default: 0 },
    timesOut: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalOversBowled: { type: Number, default: 0 },
    totalRunsConceded: { type: Number, default: 0 },
    bestBowlingFigures: {
        wickets: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
    },
    bowlingAverage: { type: Number, default: 0 },
    economyRate: { type: Number, default: 0 },
    totalCatches: { type: Number, default: 0 },
    totalRunOuts: { type: Number, default: 0 },
    totalStumpings: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
}, {
    timestamps: false, // using explicit lastUpdated field
});
playerCareerStatsSchema.index({ playerId: 1 }, { unique: true });
exports.default = mongoose_1.default.model('PlayerCareerStats', playerCareerStatsSchema);
//# sourceMappingURL=PlayerCareerStats.js.map