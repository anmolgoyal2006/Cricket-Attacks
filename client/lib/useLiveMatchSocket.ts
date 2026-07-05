/**
 * Cricket Scoring Feature — Phase 4 + Phase 5
 * React hook for connecting to the /live-match Socket.io namespace.
 * Used by both the scorer page (Phase 4) and spectator page (Phase 5).
 *
 * Phase 5 additions:
 *  - Exposes `connected` and `reconnecting` state for the reconnecting indicator
 *  - Allows unauthenticated spectators to attempt connection (server will reject cleanly)
 *
 * The card-game socket (default namespace "/") is completely separate and unaffected.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BallResult, InningsSummary } from './scoringApi';

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') as string) ||
  'http://localhost:5000';

export interface LiveMatchCallbacks {
  onBallRecorded?: (data: BallResult) => void;
  onWicketFallen?: (data: unknown) => void;
  onInningsCompleted?: (data: unknown) => void;
  onMatchCompleted?: (data: { resultText: string | null }) => void;
  onBallUndone?: (data: { undone: unknown; innings: BallResult['innings'] }) => void;
  onSnapshot?: (data: { match: unknown; innings: InningsSummary | null }) => void;
}

export function useLiveMatchSocket(matchId: string | null, callbacks: LiveMatchCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Keep callbacks ref up-to-date without re-subscribing
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const joinMatch = useCallback((id: string) => {
    socketRef.current?.emit('match:join', { matchId: id });
  }, []);

  const leaveMatch = useCallback((id: string) => {
    socketRef.current?.emit('match:leave', { matchId: id });
  }, []);

  useEffect(() => {
    if (!matchId) return;

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    // No token — spectators without accounts cannot receive live events (server auth required)
    if (!token) return;

    const socket = io(`${SOCKET_URL}/live-match`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
      socket.emit('match:join', { matchId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('reconnect_attempt', () => {
      setReconnecting(true);
    });

    socket.on('reconnect', () => {
      setConnected(true);
      setReconnecting(false);
      // Re-join the room and re-fetch handled by the page on reconnect
      socket.emit('match:join', { matchId });
    });

    socket.on('match:snapshot', (data) => {
      callbacksRef.current.onSnapshot?.(data);
    });

    socket.on('ball:recorded', (data: BallResult) => {
      callbacksRef.current.onBallRecorded?.(data);
    });

    socket.on('wicket:fallen', (data) => {
      callbacksRef.current.onWicketFallen?.(data);
    });

    socket.on('innings:completed', (data) => {
      callbacksRef.current.onInningsCompleted?.(data);
    });

    socket.on('match:completed', (data) => {
      callbacksRef.current.onMatchCompleted?.(data);
    });

    socket.on('ball:undone', (data) => {
      callbacksRef.current.onBallUndone?.(data);
    });

    return () => {
      socket.emit('match:leave', { matchId });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setReconnecting(false);
    };
  }, [matchId]);

  return { joinMatch, leaveMatch, connected, reconnecting };
}
