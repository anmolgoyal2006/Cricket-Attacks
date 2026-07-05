"use strict";
/**
 * Cricket Scoring Feature — Phase 3
 * Live Match Socket Namespace (/live-match)
 *
 * This file creates a completely separate Socket.io namespace for real-time
 * cricket scoring. It does NOT touch, modify, or share event names with the
 * existing card-battle namespace (default "/").
 *
 * Frontend usage (Phase 5 reference):
 *   const socket = io('/live-match', { auth: { token } });
 *   socket.emit('match:join',  { matchId });
 *   socket.emit('match:leave', { matchId });
 *   socket.on('ball:recorded',     (data) => { /* update scorecard *\/ });
 *   socket.on('wicket:fallen',     (data) => { /* show dismissal toast *\/ });
 *   socket.on('innings:completed', (data) => { /* show innings break screen *\/ });
 *   socket.on('match:completed',   (data) => { /* show final result *\/ });
 *   socket.on('ball:undone',       (data) => { /* rollback last ball in UI *\/ });
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveMatchNamespace = void 0;
exports.setupLiveMatchSocket = setupLiveMatchSocket;
const auth_1 = require("./auth");
const ScoringMatch_1 = __importDefault(require("../models/cricket-scoring/ScoringMatch"));
const Innings_1 = __importDefault(require("../models/cricket-scoring/Innings"));
function setupLiveMatchSocket(io) {
    exports.liveMatchNamespace = io.of('/live-match');
    // Reuse the same JWT auth middleware as the card-game default namespace.
    // Attaches socket.userId and socket.username exactly as card-game sockets.
    exports.liveMatchNamespace.use(auth_1.socketAuth);
    exports.liveMatchNamespace.on('connection', (rawSocket) => {
        const socket = rawSocket;
        console.log(`[live-match] connected: ${socket.username} (${socket.id})`);
        // ── match:join ────────────────────────────────────────────────────────────
        // Client emits { matchId } to subscribe to live updates for a match.
        // The socket is immediately added to room `match_<matchId>`.
        // A snapshot of the current innings state is emitted back to the joining
        // socket so late-joining spectators see the current score without waiting
        // for the next ball.
        socket.on('match:join', async ({ matchId }) => {
            try {
                if (!matchId || typeof matchId !== 'string') {
                    socket.emit('error', { message: 'match:join requires a valid matchId string' });
                    return;
                }
                const match = await ScoringMatch_1.default.findById(matchId).lean();
                if (!match) {
                    socket.emit('error', { message: `Match not found: ${matchId}` });
                    return;
                }
                const room = `match_${matchId}`;
                socket.join(room);
                console.log(`[live-match] ${socket.username} joined room ${room}`);
                // Send current innings snapshot so late joiners see live state immediately.
                const currentInnings = await Innings_1.default.findOne({
                    matchId,
                    inningsNumber: match.currentInnings,
                }).lean();
                socket.emit('match:snapshot', {
                    match: {
                        _id: match._id,
                        status: match.status,
                        teamA: match.teamA,
                        teamB: match.teamB,
                        oversFormat: match.oversFormat,
                        currentInnings: match.currentInnings,
                        result: match.result ?? null,
                    },
                    innings: currentInnings ?? null,
                });
            }
            catch (err) {
                console.error('[live-match] match:join error:', err);
                socket.emit('error', { message: 'Failed to join match room' });
            }
        });
        // ── match:leave ───────────────────────────────────────────────────────────
        socket.on('match:leave', ({ matchId }) => {
            if (!matchId || typeof matchId !== 'string')
                return;
            const room = `match_${matchId}`;
            socket.leave(room);
            console.log(`[live-match] ${socket.username} left room ${room}`);
        });
        // ── disconnect ────────────────────────────────────────────────────────────
        // Socket.io automatically removes the socket from all rooms on disconnect.
        // No manual cleanup needed.
        socket.on('disconnect', () => {
            console.log(`[live-match] disconnected: ${socket.username} (${socket.id})`);
        });
    });
}
//# sourceMappingURL=liveMatchSocket.js.map