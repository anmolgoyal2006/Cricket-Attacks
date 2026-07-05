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
const roundResultSchema = new mongoose_1.Schema({
    roundNumber: { type: Number, required: true },
    playerCardId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' },
    playerCardName: { type: String, required: true },
    playerStat: { type: Number, required: true },
    attribute: { type: String, required: true },
    aiId: { type: String },
    computerCardName: { type: String, required: true },
    computerStat: { type: Number, required: true },
    winner: {
        type: String,
        enum: ['player', 'computer', 'tie'],
        required: true,
    },
}, { _id: false });
const battleSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    playerSquad: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Player',
        },
    ],
    aiSquad: [
        {
            aiId: String,
            name: String,
            role: String,
            batting: Number,
            bowling: Number,
            fielding: Number,
            captaincy: Number,
            pressure: Number,
            overall: Number,
            used: { type: Boolean, default: false },
            pendingPick: { type: Boolean, default: false },
        },
    ],
    rounds: [roundResultSchema],
    attributeOrder: { type: [String], default: [] },
    playerScore: { type: Number, default: 0 },
    computerScore: { type: Number, default: 0 },
    winner: {
        type: String,
        enum: ['player', 'computer', 'opponent', 'tie'],
        default: 'tie',
    },
    rewards: {
        coins: { type: Number, default: 0 },
        xp: { type: Number, default: 0 },
        trophies: { type: Number, default: 0 },
        cardDrops: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' }],
    },
    type: {
        type: String,
        enum: ['pve', 'pvp'],
        default: 'pve',
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed'],
        default: 'in_progress',
    },
}, {
    timestamps: true,
});
battleSchema.index({ user: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('Battle', battleSchema);
//# sourceMappingURL=Battle.js.map