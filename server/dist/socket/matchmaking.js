"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMatchmaking = setupMatchmaking;
const User_1 = __importDefault(require("../models/User"));
const battleRoom_1 = require("./battleRoom");
const BASE_ELO_RANGE = 100;
const MAX_ELO_RANGE = 500;
const EXPAND_INTERVAL = 5000;
const queue = [];
function findMatch(entry) {
    const waitTime = Date.now() - entry.joinedAt.getTime();
    const eloRange = Math.min(MAX_ELO_RANGE, BASE_ELO_RANGE + Math.floor(waitTime / EXPAND_INTERVAL) * 50);
    for (const candidate of queue) {
        if (candidate.userId === entry.userId)
            continue;
        const diff = Math.abs(candidate.eloRating - entry.eloRating);
        if (diff <= eloRange) {
            return candidate;
        }
    }
    return null;
}
function setupMatchmaking(io, battleRooms) {
    setInterval(() => {
        if (queue.length < 2)
            return;
        const player1 = queue.shift();
        const player2 = findMatch(player1);
        if (!player2) {
            queue.unshift(player1);
            return;
        }
        const p2Idx = queue.findIndex((p) => p.userId === player2.userId);
        if (p2Idx === -1) {
            queue.unshift(player1);
            return;
        }
        queue.splice(p2Idx, 1);
        const battleId = `pvp_${player1.userId}_${player2.userId}_${Date.now()}`;
        const p1Socket = io.sockets.sockets.get(player1.socket.id);
        const p2Socket = io.sockets.sockets.get(player2.socket.id);
        if (!p1Socket?.connected || !p2Socket?.connected) {
            if (p1Socket?.connected)
                queue.unshift(player1);
            if (p2Socket?.connected)
                queue.unshift(player2);
            return;
        }
        player1.socket.join(battleId);
        player2.socket.join(battleId);
        battleRooms.initializeBattle(player1.socket, io, battleId, {
            userId: player1.userId,
            username: player1.username,
            socketId: player1.socket.id,
            cards: player1.squad,
        }, {
            userId: player2.userId,
            username: player2.username,
            socketId: player2.socket.id,
            cards: player2.squad,
        });
        io.to(battleId).emit('matchmaking:found', {
            battleId,
            opponent1: { username: player2.username, userId: player2.userId, eloRating: player2.eloRating },
            opponent2: { username: player1.username, userId: player1.userId, eloRating: player1.eloRating },
        });
        startBattleCountdown(io, battleId);
    }, 2000);
    return {
        async joinQueue(socket, squad) {
            const existing = queue.find((e) => e.userId === socket.userId);
            const user = await User_1.default.findById(socket.userId).lean();
            const eloRating = user?.eloRating || 1000;
            // Check for cards on cooldown
            const cooledCards = squad.filter((c) => (0, battleRoom_1.isCardOnCooldown)(socket.userId, c._id || c.userCardId));
            if (cooledCards.length > 0) {
                const cooldowns = (0, battleRoom_1.getActiveCooldowns)(socket.userId);
                socket.emit('matchmaking:cooldown-error', {
                    message: `${cooledCards.length} card(s) are on cooldown. Please select different cards.`,
                    cooldowns, // { cardId: expiresAtTimestamp }
                    cooledCardIds: cooledCards.map((c) => c._id || c.userCardId),
                });
                return;
            }
            if (existing) {
                existing.squad = squad;
                existing.eloRating = eloRating;
                socket.emit('matchmaking:waiting', {
                    position: queue.indexOf(existing) + 1,
                    queueSize: queue.length,
                    eloRange: BASE_ELO_RANGE,
                });
                return;
            }
            queue.push({
                socket,
                userId: socket.userId,
                username: socket.username,
                eloRating,
                joinedAt: new Date(),
                squad,
            });
            socket.emit('matchmaking:waiting', {
                position: queue.length,
                queueSize: queue.length,
                eloRating,
                eloRange: BASE_ELO_RANGE,
            });
        },
        leaveQueue(socket) {
            const idx = queue.findIndex((e) => e.userId === socket.userId);
            if (idx !== -1) {
                queue.splice(idx, 1);
                socket.emit('matchmaking:left');
            }
        },
        removeFromQueue(userId) {
            const idx = queue.findIndex((e) => e.userId === userId);
            if (idx !== -1) {
                queue.splice(idx, 1);
            }
        },
    };
}
function startBattleCountdown(io, battleId) {
    let countdown = 3;
    const interval = setInterval(() => {
        io.to(battleId).emit('battle:countdown', { seconds: countdown });
        countdown--;
        if (countdown < 0) {
            clearInterval(interval);
        }
    }, 1000);
}
//# sourceMappingURL=matchmaking.js.map