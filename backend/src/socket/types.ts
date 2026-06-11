import { Server } from 'socket.io';
import { AuthenticatedSocket } from './auth';

export interface BattleRoomHandlers {
  initializeBattle(
    socket: AuthenticatedSocket,
    io: Server,
    battleId: string,
    player1Data: { userId: string; username: string; socketId: string; cards: any[] },
    player2Data: { userId: string; username: string; socketId: string; cards: any[] }
  ): any;
  handleSelectCard(socket: AuthenticatedSocket, battleId: string, cardId: string): void;
  handleDisconnect(socket: AuthenticatedSocket): void;
  handleReconnect(socket: AuthenticatedSocket, battleId: string): void;
}
