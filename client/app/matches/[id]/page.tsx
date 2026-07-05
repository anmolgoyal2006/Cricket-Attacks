'use client';

/**
 * Cricket Scoring Feature — Phase 5
 * Match detail / live spectator page — /matches/[id]
 * Read-only view. Real-time via /live-match socket namespace.
 * Mobile-first: sticky score header, scrollable ball feed, tabbed scorecard.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, Trophy, Radio,
  ChevronLeft, ChevronRight, RotateCcw, Wifi, WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { scoringApi, scoringSpectatorApi, ScoringMatch, BallRecord, PlayerMatchStat } from '@/lib/scoringApi';
import { useLiveMatchSocket } from '@/lib/useLiveMatchSocket';
import { generateCommentary, ballPillLabel, ballPillClass } from '@/lib/commentary';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
function oversStr(oc: number, bic: number) { return `${oc}.${bic}`; }

function runRate(runs: number, oc: number, bic: number) {
  const balls = oc * 6 + bic;
  return balls === 0 ? '0.00' : ((runs / balls) * 6).toFixed(2);
}

function rrr(target: number, runs: number, oc: number, bic: number, totalOvers: number) {
  const ballsLeft = totalOvers * 6 - (oc * 6 + bic);
  if (ballsLeft <= 0) return '—';
  const needed = target - runs;
  if (needed <= 0) return '0.00';
  return ((needed / ballsLeft) * 6).toFixed(2);
}

function strikeRate(runs: number, balls: number) {
  return balls === 0 ? '0.00' : ((runs / balls) * 100).toFixed(1);
}

function economy(runs: number, balls: number) {
  return balls === 0 ? '0.00' : ((runs / balls) * 6).toFixed(2);
}

function bowlingOvers(ballsBowled: number) {
  return `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ScoringMatch['status'] }) {
  if (status === 'live') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-bold bg-red-500/15 border border-red-500/40 text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />LIVE
    </span>
  );
  if (status === 'innings_break') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
      INNINGS BREAK
    </span>
  );
  if (status === 'upcoming') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
      UPCOMING
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-bold bg-green-500/15 border border-green-500/30 text-green-400">
      COMPLETED
    </span>
  );
}

// ── Wicket toast ──────────────────────────────────────────────────────────────
function WicketToast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-red-500/90 backdrop-blur-sm border border-red-400/50 text-white font-display font-bold text-base shadow-2xl shadow-red-500/40 max-w-xs text-center"
    >
      🏏 {text}
    </motion.div>
  );
}
