"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Loader2, Info, ChevronDown, ChevronUp,
  Lock, CheckCircle2, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import { wordleApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const MAX_GUESSES = 6;

type MatchState = 'correct' | 'close' | 'wrong' | 'higher' | 'lower';

interface HintCell { value: any; match: MatchState }
interface GuessRow  { guess: string; hints: Record<string, HintCell> | null; valid: boolean }
interface Clue      { id: number; category: string; label: string; value: string; emoji: string }

// Columns shown in the guess grid — matches server hintRow keys
const COLUMNS: { key: string; label: string; emoji: string }[] = [
  { key: 'country',      label: 'Country',       emoji: '🌍' },
  { key: 'role',         label: 'Role',           emoji: '🏏' },
  { key: 'specialty',    label: 'Specialty',      emoji: '⚡' },
  { key: 'battingHand',  label: 'Bat Hand',       emoji: '🖐️' },
  { key: 'bowlingStyle', label: 'Bowl Style',     emoji: '🎳' },
  { key: 'iplTeam',      label: 'IPL Team',       emoji: '🏟️' },
  { key: 'debutYear',    label: 'Debut Era',      emoji: '📅' },
];

const CELL_STYLES: Record<MatchState, string> = {
  correct: 'bg-green-500/25 border-green-500/70 text-green-300',
  close:   'bg-yellow-500/25 border-yellow-500/70 text-yellow-300',
  wrong:   'bg-white/5 border-white/10 text-gray-500',
  higher:  'bg-blue-500/20 border-blue-500/50 text-blue-300',
  lower:   'bg-orange-500/20 border-orange-500/50 text-orange-300',
};

function MatchIcon({ match }: { match: MatchState }) {
  if (match === 'correct') return <CheckCircle2 className="w-3 h-3 text-green-400" />;
  if (match === 'higher')  return <ArrowUp className="w-3 h-3 text-blue-400" />;
  if (match === 'lower')   return <ArrowDown className="w-3 h-3 text-orange-400" />;
  if (match === 'close')   return <span className="text-xs">〜</span>;
  return <Minus className="w-3 h-3 text-gray-600" />;
}

function todayKey(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

function emojiForMatch(m: string) {
  if (m === 'correct') return '🟩';
  if (m === 'close')   return '🟨';
  if (m === 'higher')  return '⬆️';
  if (m === 'lower')   return '⬇️';
  return '🟥';
}

export default function WordlePage() {
  const [players, setPlayers]         = useState<{ id: string; name: string; clues: Clue[] }[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [gameStates, setGameStates]   = useState<Record<string, {
    revealedClues: number;
    guesses: GuessRow[];
    gameOver: boolean;
    won: boolean;
    answer: any;
  }>>({});
  const [input, setInput]             = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [showHow, setShowHow]         = useState(false);
  const [date, setDate]               = useState('');
  const [copied, setCopied]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentState = selectedPlayerId ? gameStates[selectedPlayerId] : null;
  const revealedClues = currentState?.revealedClues ?? 1;
  const guesses = currentState?.guesses ?? [];
  const gameOver = currentState?.gameOver ?? false;
  const won = currentState?.won ?? false;
  const answer = currentState?.answer ?? null;

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const clues = selectedPlayer?.clues ?? [];

  // Restore today's saved state
  useEffect(() => {
    const saved = localStorage.getItem(`wordle-v2-${todayKey()}`);
    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      setGameStates(s.gameStates || {});
      setSelectedPlayerId(s.selectedPlayerId || null);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    wordleApi.getDaily().then(d => {
      setPlayers(d.players);
      setPlayerNames(d.playerNames);
      setDate(d.date);
      if (d.players.length > 0 && !selectedPlayerId) {
        setSelectedPlayerId(d.players[0].id);
      }
    }).catch(() => setError('Failed to load today\'s challenge.')).finally(() => setLoading(false));
  }, []);

  // Persist on every change
  useEffect(() => {
    if (players.length === 0) return;
    localStorage.setItem(`wordle-v2-${todayKey()}`, JSON.stringify({ gameStates, selectedPlayerId }));
  }, [gameStates, selectedPlayerId, players]);

  const handleInput = (v: string) => {
    setInput(v);
    if (v.length < 2) { setSuggestions([]); return; }
    setSuggestions(playerNames.filter(n => n.toLowerCase().includes(v.toLowerCase())).slice(0, 8));
  };

  const submitGuess = useCallback(async (name?: string) => {
    const gname = (name || input).trim();
    if (!gname || submitting || !selectedPlayerId || gameOver) return;
    const currentGuesses = gameStates[selectedPlayerId]?.guesses ?? [];
    const guessNumber = currentGuesses.length + 1;
    setSubmitting(true); setError(''); setSuggestions([]); setInput('');

    try {
      const result = await wordleApi.submitGuess(gname, guessNumber, selectedPlayerId);
      const row: GuessRow = {
        guess: gname,
        hints: result.hintRow as Record<string, HintCell> | null,
        valid: result.playerFound,
      };

      setGameStates(prev => {
        const state = prev[selectedPlayerId] ?? { revealedClues: 1, guesses: [], gameOver: false, won: false, answer: null };
        const nextGuesses = [...state.guesses, row];
        const isWon = result.isCorrect;
        const isGameOver = isWon || guessNumber >= MAX_GUESSES || !!result.answer;

        return {
          ...prev,
          [selectedPlayerId]: {
            ...state,
            guesses: nextGuesses,
            won: isWon,
            gameOver: isGameOver,
            answer: result.answer ?? state.answer,
            revealedClues: isGameOver ? state.revealedClues : Math.min(state.revealedClues + 1, clues.length),
          }
        };
      });
    } catch (e: any) {
      setError(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [gameStates, selectedPlayerId, input, submitting, gameOver, clues.length]);

  const retryGame = () => {
    if (!selectedPlayerId) return;
    setGameStates(prev => ({
      ...prev,
      [selectedPlayerId]: {
        revealedClues: 1,
        guesses: [],
        gameOver: false,
        won: false,
        answer: null,
      }
    }));
  };

  const shareText = () => {
    const grid = guesses.map(g => {
      if (!g.hints) return '🟥'.repeat(7);
      return COLUMNS.map(c => emojiForMatch(g.hints?.[c.key]?.match || 'wrong')).join('');
    }).join('\n');
    const playerLabel = selectedPlayer ? ` (${selectedPlayer.name})` : '';
    return `🏏 Cricket Wordle ${date}${playerLabel}\n${won ? `${guesses.length}/${MAX_GUESSES} ✅` : `X/${MAX_GUESSES}`}\n\n${grid}\n\ncricketclash.app/wordle`;
  };

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(shareText()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* ignore */ }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <h1 className="text-5xl sm:text-6xl font-display font-black gradient-text mb-2">Cricket Wordle</h1>
          <p className="text-gray-400 font-body mb-3">Deduce the mystery cricketer — {MAX_GUESSES} guesses, real cricket knowledge</p>

          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setShowHow(s => !s)}
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-amber-400 transition-colors font-body">
              <Info className="w-4 h-4" />
              How to play
              {showHow ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <Link href="/face-reveal"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/25 transition-all font-body">
              👁️ Face Reveal Mode
            </Link>
          </div>
        </div>

        {/* ── How to Play ── */}
        <AnimatePresence>
          {showHow && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
              exit={{ opacity:0, height:0 }} className="mb-6 overflow-hidden">
              <div className="glass rounded-2xl p-6 grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-3">Rules</h3>
                  <ul className="space-y-1.5 text-sm text-gray-300 font-body">
                    <li>• Guess the mystery cricketer in {MAX_GUESSES} tries</li>
                    <li>• A new clue unlocks after every wrong guess</li>
                    <li>• Clues go from broad → specific</li>
                    <li>• New puzzle every day at midnight</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-3">Color Guide</h3>
                  <div className="space-y-1.5 text-sm font-body">
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded bg-green-500/30 border border-green-500/70 flex-shrink-0" /><span className="text-gray-300">Exact match</span></div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded bg-yellow-500/30 border border-yellow-500/70 flex-shrink-0" /><span className="text-gray-300">Close / same category</span></div>
                    <div className="flex items-center gap-2"><ArrowUp className="w-4 h-4 text-blue-400 flex-shrink-0" /><span className="text-gray-300">Target is higher (age/year)</span></div>
                    <div className="flex items-center gap-2"><ArrowDown className="w-4 h-4 text-orange-400 flex-shrink-0" /><span className="text-gray-300">Target is lower</span></div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded bg-white/5 border border-white/10 flex-shrink-0" /><span className="text-gray-300">No match</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Player Selection Tabs ── */}
        {players.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3 flex items-center gap-2">
              Select Player to Guess
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((player, idx) => {
                const state = gameStates[player.id];
                const isSelected = player.id === selectedPlayerId;
                const isWon = state?.won;
                const isComplete = state?.gameOver;
                return (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    className={cn(
                      'px-4 py-2 rounded-xl font-display font-bold text-sm transition-all border',
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'glass border-white/10 text-gray-400 hover:text-white hover:border-white/20',
                      isWon && 'ring-2 ring-green-500/50',
                      isComplete && !isWon && 'opacity-60'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{isWon ? '✅' : isComplete ? '❌' : `${idx + 1}.`}</span>
                      <span>{state?.guesses?.length ?? 0}/{MAX_GUESSES}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Clue Cards ── */}
        <div className="mb-8">
          <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Progressive Clues — {Math.min(revealedClues, clues.length)} of {clues.length} revealed
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {clues.map((clue, i) => {
              const revealed = i < revealedClues || gameOver;
              return (
                <motion.div key={clue.id}
                  animate={revealed ? { opacity:1, scale:1 } : { opacity:0.35, scale:0.97 }}
                  transition={{ duration:0.4, delay: revealed ? i*0.05 : 0 }}
                  className={cn(
                    'rounded-xl p-3 border text-center transition-all',
                    revealed ? 'glass border-amber-500/30' : 'glass-dark border-white/5'
                  )}>
                  <div className="text-xl mb-1">{revealed ? clue.emoji : '🔒'}</div>
                  <div className="text-[10px] text-gray-400 font-body leading-tight mb-1">{clue.label}</div>
                  <div className={cn('text-xs font-display font-bold leading-tight', revealed ? 'text-amber-300' : 'text-gray-700')}>
                    {revealed ? clue.value : '???'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Guess Grid ── */}
        {guesses.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3">Your Guesses</p>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header row */}
                <div className="grid grid-cols-8 gap-1.5 mb-1.5 px-1">
                  <div className="text-xs text-gray-500 font-body p-2">Player</div>
                  {COLUMNS.map(c => (
                    <div key={c.key} className="text-xs text-gray-500 font-body text-center p-2 leading-tight">
                      <div>{c.emoji}</div>
                      <div>{c.label}</div>
                    </div>
                  ))}
                </div>
                {/* Guess rows */}
                {guesses.map((row, idx) => (
                  <motion.div key={idx}
                    initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay:0.05 }}
                    className="grid grid-cols-8 gap-1.5 mb-1.5">
                    {/* Player name cell */}
                    <div className={cn(
                      'rounded-xl px-3 py-2 flex items-center border',
                      row.valid
                        ? 'glass border-white/10'
                        : 'bg-red-500/10 border-red-500/20'
                    )}>
                      <span className="text-white text-xs font-display font-bold truncate leading-tight">
                        {row.guess}
                      </span>
                    </div>
                    {/* Hint cells */}
                    {COLUMNS.map(col => {
                      const hint = row.hints?.[col.key];
                      const match = (hint?.match as MatchState) || 'wrong';
                      return (
                        <div key={col.key}
                          className={cn(
                            'rounded-xl px-2 py-2 border flex flex-col items-center justify-center text-center gap-0.5 min-h-[52px]',
                            hint ? CELL_STYLES[match] : 'bg-white/5 border-white/5'
                          )}>
                          {hint && <MatchIcon match={match} />}
                          <span className="text-[10px] font-body font-semibold leading-tight break-words max-w-full">
                            {hint ? String(hint.value) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Attempt dots ── */}
        {!gameOver && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: MAX_GUESSES }).map((_, i) => (
              <div key={i} className={cn('w-2.5 h-2.5 rounded-full transition-all',
                i < guesses.length ? 'bg-amber-400 scale-110' : 'bg-white/10')} />
            ))}
            <span className="text-xs text-gray-500 font-body ml-2">
              {MAX_GUESSES - guesses.length} guesses left
            </span>
          </div>
        )}

        {/* ── Input ── */}
        {!gameOver && (
          <div className="mb-8 relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input ref={inputRef} type="text" value={input}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitGuess(); if (e.key === 'Escape') setSuggestions([]); }}
                  placeholder="Type a player name…"
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border-2 border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 font-body text-base transition-all"
                  disabled={submitting} autoComplete="off" />

                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:-6 }}
                      className="absolute top-full left-0 right-0 mt-1 z-30 glass-dark rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                      {suggestions.map(name => (
                        <button key={name} onClick={() => { setSuggestions([]); submitGuess(name); }}
                          className="w-full text-left px-5 py-3 text-white font-body text-sm hover:bg-amber-500/10 hover:text-amber-300 transition-colors border-b border-white/5 last:border-0">
                          {name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => submitGuess()} disabled={!input.trim() || submitting}
                className={cn(
                  'px-6 py-4 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 flex-shrink-0',
                  input.trim() && !submitting
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                )}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guess'}
              </button>
            </div>

            {error && <p className="mt-2 text-xs text-red-400 font-body text-center">{error}</p>}
          </div>
        )}

        {/* ── Game Over ── */}
        <AnimatePresence>
          {gameOver && (
            <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
              className={cn(
                'rounded-3xl p-8 text-center border-2',
                won ? 'bg-green-500/8 border-green-500/30' : 'bg-white/3 border-white/10'
              )}>
              <div className="text-5xl mb-3">{won ? '🏆' : '😔'}</div>
              <h2 className="text-3xl font-display font-black text-white mb-1">
                {won ? `Cracked it in ${guesses.length}!` : 'Better luck tomorrow!'}
              </h2>

              {answer && (
                <div className="mt-5 mb-6 inline-block">
                  <div className="glass rounded-2xl px-8 py-5">
                    <p className="text-xs text-gray-400 font-body mb-2 uppercase tracking-wider">Today's player</p>
                    <p className="text-3xl font-display font-black text-amber-400 mb-3">{answer.name}</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-body">
                      {[
                        { label: answer.country, color: 'bg-blue-500/20 text-blue-300' },
                        { label: answer.role,    color: 'bg-green-500/20 text-green-300' },
                        { label: answer.battingHand, color: 'bg-purple-500/20 text-purple-300' },
                        { label: answer.bowlingStyle, color: 'bg-orange-500/20 text-orange-300' },
                        { label: answer.iplTeam, color: 'bg-amber-500/20 text-amber-300' },
                        { label: answer.debutEra, color: 'bg-cyan-500/20 text-cyan-300' },
                        { label: answer.specialty, color: 'bg-pink-500/20 text-pink-300' },
                      ].map((tag, i) => tag.label && (
                        <span key={i} className={cn('px-2.5 py-1 rounded-full border border-white/10', tag.color)}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={handleShare}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                  <Share2 className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Share Score'}
                </button>
                <button onClick={retryGame}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 font-display font-bold hover:bg-blue-500/30 transition-all">
                  🔄 Retry
                </button>
                <Link href="/face-reveal"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 font-display font-bold hover:bg-purple-500/30 transition-all">
                  👁️ Try Face Reveal
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
