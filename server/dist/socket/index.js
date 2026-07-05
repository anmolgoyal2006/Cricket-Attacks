"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketServer = setupSocketServer;
const socket_io_1 = require("socket.io");
const config_1 = require("../config");
const auth_1 = require("./auth");
const matchmaking_1 = require("./matchmaking");
const battleRoom_1 = require("./battleRoom");
// Cricket Scoring Feature — Phase 3: register the live-match namespace (additive only)
const liveMatchSocket_1 = require("./liveMatchSocket");
function setupSocketServer(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: config_1.config.frontendUrl,
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    io.use(auth_1.socketAuth);
    // Cricket Scoring Feature — Phase 3: mount /live-match namespace (additive, no existing code changed)
    (0, liveMatchSocket_1.setupLiveMatchSocket)(io);
    const battleRooms = (0, battleRoom_1.setupBattleRooms)(io);
    const matchmaking = (0, matchmaking_1.setupMatchmaking)(io, battleRooms);
    io.on('connection', (rawSocket) => {
        const socket = rawSocket;
        console.log(`Socket connected: ${socket.username} (${socket.id})`);
        // Send active cooldowns immediately on connect
        if (socket.userId) {
            const cooldowns = (0, battleRoom_1.getActiveCooldowns)(socket.userId);
            if (Object.keys(cooldowns).length > 0) {
                socket.emit('cooldowns:update', { cooldowns });
            }
        }
        socket.on('cooldowns:get', () => {
            const cooldowns = socket.userId ? (0, battleRoom_1.getActiveCooldowns)(socket.userId) : {};
            socket.emit('cooldowns:update', { cooldowns });
        });
        socket.on('matchmaking:join', ({ squad }) => {
            if (!squad || squad.length !== 5) {
                socket.emit('error', { message: 'You need exactly 5 cards in your squad' });
                return;
            }
            matchmaking.joinQueue(socket, squad);
        });
        socket.on('matchmaking:leave', () => {
            matchmaking.leaveQueue(socket);
        });
        socket.on('battle:select-card', ({ battleId, cardId }) => {
            battleRooms.handleSelectCard(socket, battleId, cardId);
        });
        socket.on('battle:reconnect', ({ battleId }) => {
            battleRooms.handleReconnect(socket, battleId);
        });
        socket.on('disconnecting', () => {
            matchmaking.removeFromQueue(socket.userId);
            battleRooms.handleDisconnect(socket);
        });
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.username} (${socket.id})`);
        });
    });
    return io;
}
//# sourceMappingURL=index.js.map