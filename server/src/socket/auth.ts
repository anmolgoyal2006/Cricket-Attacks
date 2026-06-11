import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { config } from '../config';
import User from '../models/User';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export async function socketAuth(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId).select('username');

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}
