"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMatchmaking = setupMatchmaking;
const queue = [];
function setupMatchmaking(io, battleRooms) {
    setInterval(() => {
        if (queue.length < 2)
            return;
        const player1 = queue.shift();
        const player2Index = queue.findIndex((p) => p.userId !== player1.userId);
        if (player2Index === -1) {
            queue.unshift(player1);
            return;
        }
        const player2 = queue.splice(player2Index, 1)[0];
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
            opponent1: { username: player2.username, userId: player2.userId },
            opponent2: { username: player1.username, userId: player1.userId },
        });
        startBattleCountdown(io, battleId);
    }, 2000);
    return {
        joinQueue(socket, squad) {
            const existing = queue.find((e) => e.userId === socket.userId);
            if (existing) {
                existing.squad = squad;
                socket.emit('matchmaking:waiting', {
                    position: queue.indexOf(existing) + 1,
                    queueSize: queue.length,
                });
                return;
            }
            queue.push({
                socket,
                userId: socket.userId,
                username: socket.username,
                joinedAt: new Date(),
                squad,
            });
            socket.emit('matchmaking:waiting', {
                position: queue.length,
                queueSize: queue.length,
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
            io.to(battleId).emit('battle:start', {
                battleId,
                round: 1,
                totalRounds: 5,
            });
        }
    }, 1000);
}
//# sourceMappingURL=matchmaking.js.map