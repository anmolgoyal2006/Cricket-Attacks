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
const leaderboardEntrySchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    username: {
        type: String,
        required: true,
    },
    eloRating: {
        type: Number,
        default: 1000,
    },
    rankTier: {
        type: String,
        default: 'Bronze',
    },
    trophies: {
        type: Number,
        default: 0,
    },
    battlesPlayed: {
        type: Number,
        default: 0,
    },
    battlesWon: {
        type: Number,
        default: 0,
    },
    battlesLost: {
        type: Number,
        default: 0,
    },
    battlesDrawn: {
        type: Number,
        default: 0,
    },
    winRate: {
        type: Number,
        default: 0,
    },
    xp: {
        type: Number,
        default: 0,
    },
    streak: {
        type: Number,
        default: 0,
    },
    season: {
        type: Number,
        default: 1,
    },
    avatar: {
        type: String,
        default: '🏏',
    },
}, {
    timestamps: true,
});
leaderboardEntrySchema.index({ season: 1, eloRating: -1 });
leaderboardEntrySchema.index({ season: 1, winRate: -1 });
leaderboardEntrySchema.index({ eloRating: -1 });
leaderboardEntrySchema.index({ winRate: -1 });
exports.default = mongoose_1.default.model('LeaderboardEntry', leaderboardEntrySchema);
//# sourceMappingURL=LeaderboardEntry.js.map