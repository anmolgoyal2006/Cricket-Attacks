"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Share2,
  RotateCcw,
  Trophy,
  Loader2,
  Info,
  Clock,
} from 'lucide-react';
import { wordleApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const MAX_GUESSES = 6;

type MatchState = 'correct' | 'close' | 'wrong' | 'higher' | 'lower';

interface HintCell {
  value: any;
  match: MatchState;
}

interface GuessRow {
  guess: string;
  hints: Record<string, HintCell> | null;
  valid: boolean;
}

interface Clue {
  id: number;
  category: string;
  label: string;
  value: string;
  emoji: string;
}

const COLUMNS = [
  { key: 'country', label: 'Country', emoji: '🌍' },
  { key: 'role', label: 'Role', emoji: '🏏' },
  { key: 'rarity', label: 'Rarity', emoji: '⭐' },
  { key: 'batting', label: 'Batting', emoji: '🏏' },
  { key: 'bowling', label: 'Bowling', emoji: '🎯' },
  { key: 'overall', label: 'Overall', emoji: '📊' },
  { key: 'specialty', label: 'Specialty', emoji: '⚡' },
];

const MATCH_STYLES: Record<MatchState, string> = {
  correct: 'bg-green-500/30 border-green-500 text-green-300',
  close: 'bg-yellow-500/30 border-yellow-500 text-yellow-300',
  wrong: 'bg-red-500/20 border-red-500/50 text-red-400',
  higher: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  lower: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
};

const MATCH_ICONS: Record<MatchState, string> = {
  correct: '✅',
  close: '🟡',
  wrong: '❌',
  higher: '⬇️',
  lower: '⬆️',
};

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getTodayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export default function WordlePage() {
  const [clues, setClues] = useState<Clue[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [revealedClues, setRevealedClues] = useState(1);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [answer, setAnswer] = useState<any>(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [date, setDate] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 1000);
    setCountdown(getTimeUntilMidnight());
    return () => clearInterval(timer);
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    const todayKey = getTodayKey();
    const saved = localStorage.getItem(`wordle-${todayKey}`);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setGuesses(state.guesses || []);
        setRevealedClues(state.revealedClues || 1);
        setGameOver(state.gameOver || false);
        setWon(state.won || false);
        setAnswer(state.answer || null);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    async function fetchDaily() {
      try {
        const data = await wordleApi.getDaily();
        setClues(data.clues);
        setPlayerNames(data.playerNames);
        setDate(data.date);
      } catch {
        setError('Failed to load today\'s challenge. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchDaily();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (guesses.length === 0 && !gameOver) return;
    const todayKey = getTodayKey();
    localStorage.setItem(
      `wordle-${todayKey}`,
      JSON.stringify({ guesses, revealedClues, gameOver, won, answer })
    );
  }, [guesses, revealedClues, gameOver, won, answer]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    const filtered = playerNames
      .filter((n) => n.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 8);
    setSuggestions(filtered);
  };

  const handleGuess = useCallback(
    async (name?: string) => {
      const guessName = name || input;
      if (!guessName.trim() || submitting || gameOver) return;

      const guessNumber = guesses.length + 1;
      setSubmitting(true);
      setError('');
      setSuggestions([]);
      setInput('');

      try {
        const result = await wordleApi.submitGuess(guessName.trim(), guessNumber);

        const newRow: GuessRow = {
          guess: guessName.trim(),
          hints: result.hintRow as Record<string, HintCell> | null,
          valid: result.playerFound,
        };

        const newGuesses = [...guesses, newRow];
        setGuesses(newGuesses);

        if (result.isCorrect) {
          setWon(true);
          setGameOver(true);
          setAnswer(result.answer);
        } else if (guessNumber >= MAX_GUESSES || result.answer) {
          setGameOver(true);
          setAnswer(result.answer);
          // Reveal a new clue after each wrong guess
        } else {
          // Reveal next clue after each wrong guess
          setRevealedClues((prev) => Math.min(prev + 1, clues.length));
        }

        if (result.answer) setAnswer(result.answer);
      } catch (err: any) {
        setError(err.message || 'Failed to submit guess');
      } finally {
        setSubmitting(false);
        inputRef.current?.focus();
      }
    },
    [guesses, input, submitting, gameOver, clues.length]
  );

  const buildShareText = () => {
    const emojiGrid = guesses
      .map((g) => {
        if (!g.hints) return '🟥🟥🟥🟥🟥🟥🟥';
        return COLUMNS.map((col) => {
          const h = g.hints?.[col.key];
          if (!h) return '⬛';
          if (h.match === 'correct') return '🟩';
          if (h.match === 'close') return '🟨';
          return '🟥';
        }).join('');
      })
      .join('\n');

    return `🏏 Cricket Wordle ${date}\n${won ? `Got it in ${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`}\n\n${emojiGrid}\n\ncricketclash.app/wordle`;
  };

  const handleShare = async () => {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 mb-4"
          >
            <Clock className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-amber-400 text-sm font-body font-semibold">
              New puzzle in {countdown}
            </span>
          </motion.div>
          <h1 className="text-5xl font-display font-black gradient-text mb-2">Cricket Wordle</h1>
          <p className="text-gray-400 font-body">Guess today's mystery cricketer in {MAX_GUESSES} tries</p>

          <button
            onClick={() => setShowInstructions((s) => !s)}
            className="mt-3 inline-flex items-center space-x-1 text-sm text-gray-400 hover:text-amber-400 transition-colors font-body"
          >
            <Info className="w-4 h-4" />
            <span>How to play</span>
            {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Instructions */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-display font-bold text-white mb-4">How to Play</h3>
                <ul className="space-y-2 text-sm text-gray-300 font-body">
                  <li>🏏 Guess the mystery cricket player in {MAX_GUESSES} tries</li>
                  <li>🟩 <strong className="text-white">Green</strong> = exact match</li>
                  <li>🟨 <strong className="text-white">Yellow</strong> = within 10 points (for stats)</li>
                  <li>🟥 <strong className="text-white">Red</strong> = no match</li>
                  <li>⬆️ <strong className="text-white">Arrow up</strong> = actual value is higher</li>
                  <li>⬇️ <strong className="text-white">Arrow down</strong> = actual value is lower</li>
                  <li>💡 A new clue is revealed after each wrong guess</li>
                  <li>📅 A new player every day at midnight</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clues Panel */}
        <div className="mb-8">
          <h2 className="text-sm text-gray-400 font-body font-semibold uppercase tracking-wider mb-4 flex items-center">
            <HelpCircle className="w-4 h-4 mr-2" />
            Clues Revealed ({Math.min(revealedClues, clues.length)}/{clues.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {clues.map((clue, i) => {
              const revealed = i < revealedClues;
              return (
                <motion.div
                  key={clue.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'rounded-xl p-4 border transition-all duration-500',
                    revealed
                      ? 'glass border-amber-500/30 bg-amber-500/5'
                      : 'glass-dark border-white/5'
                  )}
                >
                  <div className="text-2xl mb-1">{revealed ? clue.emoji : '🔒'}</div>
                  <div className="text-xs text-gray-400 font-body mb-1">{clue.label}</div>
                  <div
                    className={cn(
                      'text-sm font-display font-bold',
                      revealed ? 'text-amber-300' : 'text-gray-600'
                    )}
                  >
                    {revealed ? clue.value : '???'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Guess History Table */}
        {guesses.length > 0 && (
          <div className="mb-8 overflow-x-auto">
            <h2 className="text-sm text-gray-400 font-body font-semibold uppercase tracking-wider mb-4">
              Your Guesses
            </h2>
            <div className="rounded-2xl overflow-hidden border border-white/10">
              {/* Column headers */}
              <div className="grid grid-cols-8 bg-white/5 p-2 gap-2 min-w-[700px]">
                <div className="text-xs text-gray-400 font-body font-semibold p-2">Player</div>
                {COLUMNS.map((col) => (
                  <div key={col.key} className="text-xs text-gray-400 font-body font-semibold text-center p-2">
                    {col.emoji} {col.label}
                  </div>
                ))}
              </div>
              {/* Guess rows */}
              {guesses.map((row, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-8 p-2 gap-2 border-t border-white/5 min-w-[700px]"
                >
                  <div className="flex items-center p-2">
                    <span className="text-white text-sm font-display font-semibold truncate">
                      {row.guess}
                    </span>
                    {!row.valid && (
                      <span className="ml-1 text-xs text-red-400">(not found)</span>
                    )}
                  </div>
                  {COLUMNS.map((col) => {
                    const hint = row.hints?.[col.key];
                    if (!hint) {
                      return (
                        <div key={col.key} className="p-2 rounded-lg bg-gray-800/50 border border-white/5 flex flex-col items-center justify-center text-center">
                          <span className="text-gray-500 text-xs">—</span>
                        </div>
                      );
                    }
                    const matchStyle = MATCH_STYLES[hint.match as MatchState] || MATCH_STYLES.wrong;
                    const icon = MATCH_ICONS[hint.match as MatchState] || '❌';
                    return (
                      <div
                        key={col.key}
                        className={cn(
                          'p-2 rounded-lg border flex flex-col items-center justify-center text-center transition-all',
                          matchStyle
                        )}
                      >
                        <span className="text-xs mb-0.5">{icon}</span>
                        <span className="text-xs font-body font-semibold leading-tight">
                          {String(hint.value)}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Remaining guesses indicator */}
        {!gameOver && (
          <div className="flex items-center justify-center space-x-2 mb-6">
            {Array.from({ length: MAX_GUESSES }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-all',
                  i < guesses.length
                    ? 'bg-amber-400'
                    : 'bg-white/10'
                )}
              />
            ))}
          </div>
        )}

        {/* Input */}
        {!gameOver && (
          <div className="mb-6">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGuess();
                  if (e.key === 'Escape') setSuggestions([]);
                }}
                placeholder="Type a player name..."
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border-2 border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 font-body text-lg transition-all"
                disabled={submitting}
                autoComplete="off"
              />
              <button
                onClick={() => handleGuess()}
                disabled={!input.trim() || submitting}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl font-display font-bold text-sm transition-all',
                  input.trim() && !submitting
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                )}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guess'}
              </button>

              {/* Autocomplete Suggestions */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-2 z-20 glass-dark rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                  >
                    {suggestions.map((name) => (
                      <button
                        key={name}
                        onClick={() => {
                          setSuggestions([]);
                          handleGuess(name);
                        }}
                        className="w-full text-left px-5 py-3 text-white font-body hover:bg-amber-500/10 hover:text-amber-300 transition-colors text-sm border-b border-white/5 last:border-0"
                      >
                        {name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-400 font-body text-center">{error}</p>
            )}
            <p className="mt-2 text-xs text-gray-500 font-body text-center">
              Guess {guesses.length + 1} of {MAX_GUESSES}
            </p>
          </div>
        )}

        {/* Game Over Panel */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'rounded-2xl p-8 text-center border-2',
                won
                  ? 'bg-green-500/10 border-green-500/40'
                  : 'bg-red-500/10 border-red-500/40'
              )}
            >
              <div className="text-5xl mb-4">{won ? '🏆' : '😢'}</div>
              <h2 className="text-3xl font-display font-black text-white mb-2">
                {won
                  ? `Brilliant! Got it in ${guesses.length}!`
                  : "Better luck tomorrow!"}
              </h2>

              {answer && (
                <div className="mt-4 mb-6 inline-block glass rounded-xl px-8 py-4">
                  <p className="text-sm text-gray-400 font-body mb-1">Today's player was</p>
                  <p className="text-3xl font-display font-black text-amber-400">{answer.name}</p>
                  <div className="flex items-center justify-center space-x-4 mt-2 text-sm text-gray-300 font-body">
                    <span>{answer.country}</span>
                    <span>•</span>
                    <span>{answer.role}</span>
                    <span>•</span>
                    <span className="text-amber-400">{answer.rarity}</span>
                    <span>•</span>
                    <span>OVR {answer.overall}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center space-x-4 mt-6">
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Share Result'}</span>
                </button>
                <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm font-body">
                  <Clock className="w-4 h-4" />
                  <span>Next puzzle in {countdown}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        {!gameOver && guesses.length === 0 && (
          <div className="mt-8 glass rounded-2xl p-6">
            <h3 className="text-sm font-display font-bold text-gray-400 uppercase tracking-wider mb-4">
              Color Guide
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(MATCH_STYLES).map(([state, style]) => (
                <div key={state} className={cn('px-3 py-2 rounded-lg border text-center text-xs font-body', style)}>
                  {MATCH_ICONS[state as MatchState]} {state.charAt(0).toUpperCase() + state.slice(1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
