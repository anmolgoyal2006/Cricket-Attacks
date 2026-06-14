import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../config';
import { AuthenticatedSocket, socketAuth } from './auth';
import { setupMatchmaking } from './matchmaking';
import { setupBattleRooms, getActiveCooldowns } from './battleRoom';

export function setupSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(socketAuth);

  const battleRooms = setupBattleRooms(io);
  const matchmaking = setupMatchmaking(io, battleRooms as any);

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    console.log(`Socket connected: ${socket.username} (${socket.id})`);

    // Send active cooldowns immediately on connect
    if (socket.userId) {
      const cooldowns = getActiveCooldowns(socket.userId);
      if (Object.keys(cooldowns).length > 0) {
        socket.emit('cooldowns:update', { cooldowns });
      }
    }

    socket.on('cooldowns:get', () => {
      const cooldowns = socket.userId ? getActiveCooldowns(socket.userId) : {};
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
      matchmaking.removeFromQueue(socket.userId!);
      battleRooms.handleDisconnect(socket);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.username} (${socket.id})`);
    });
  });

  return io;
}
