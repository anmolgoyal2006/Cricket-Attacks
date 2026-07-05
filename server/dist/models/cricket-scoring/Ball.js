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
const ballSchema = new mongoose_1.Schema({
    matchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ScoringMatch', required: true },
    inningsId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Innings', required: true },
    over: { type: Number, required: true },
    ballNumber: { type: Number, required: true },
    bowlerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    batsmanOnStrikeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    nonStrikerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    guestBowler: { type: String, default: null },
    guestBatsman: { type: String, default: null },
    guestNonStriker: { type: String, default: null },
    runsScored: { type: Number, default: 0 },
    extraType: {
        type: String,
        enum: ['wide', 'noball', 'bye', 'legbye', null],
        default: null,
    },
    extraRuns: { type: Number, default: 0 },
    isWicket: { type: Boolean, default: false },
    wicketType: {
        type: String,
        enum: ['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket', 'other', null],
        default: null,
    },
    dismissedPlayerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    guestDismissed: { type: String, default: null },
    fielderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    guestFielder: { type: String, default: null },
    isLegalDelivery: { type: Boolean, required: true },
    commentaryText: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: false });
ballSchema.index({ matchId: 1 });
ballSchema.index({ inningsId: 1 });
ballSchema.index({ matchId: 1, inningsId: 1, over: 1, ballNumber: 1 });
exports.default = mongoose_1.default.model('Ball', ballSchema);
//# sourceMappingURL=Ball.js.map