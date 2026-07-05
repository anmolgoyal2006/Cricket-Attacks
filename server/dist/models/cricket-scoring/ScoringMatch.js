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
const matchPlayerSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    guestName: { type: String, default: null },
    displayName: { type: String, required: true },
}, { _id: false });
const scoringMatchSchema = new mongoose_1.Schema({
    teamA: {
        name: { type: String, required: true },
        players: { type: [matchPlayerSchema], default: [] },
    },
    teamB: {
        name: { type: String, required: true },
        players: { type: [matchPlayerSchema], default: [] },
    },
    oversFormat: { type: Number, required: true },
    tossWonBy: {
        type: String,
        enum: ['teamA', 'teamB'],
        required: true,
    },
    tossDecision: {
        type: String,
        enum: ['bat', 'bowl'],
        required: true,
    },
    status: {
        type: String,
        enum: ['upcoming', 'live', 'innings_break', 'completed'],
        default: 'upcoming',
    },
    currentInnings: {
        type: Number,
        default: 1,
    },
    result: {
        type: new mongoose_1.Schema({
            winner: { type: String, default: null },
            margin: { type: String, default: null },
            method: { type: String, default: null },
        }, { _id: false }),
        default: null,
    },
    scorers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    venue: { type: String, default: null },
    statsProcessed: { type: Boolean, default: false },
}, {
    timestamps: true,
});
scoringMatchSchema.index({ status: 1 });
scoringMatchSchema.index({ createdBy: 1 });
exports.default = mongoose_1.default.model('ScoringMatch', scoringMatchSchema);
//# sourceMappingURL=ScoringMatch.js.map