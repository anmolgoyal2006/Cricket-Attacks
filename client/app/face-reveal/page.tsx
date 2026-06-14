"use client";

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Share2, Loader2, ChevronDown, ChevronUp,
  Star, CheckCircle2, XCircle, Lock, RotateCcw,
} from 'lucide-react';
import { wordleApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const MAX_GUESSES = 5;

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
interface Hint { id: number; label: string; value: string; emoji: string }

interface Region {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface DifficultyConfig {
  label: string;
  description: string;
  emoji: string;
  points: number;
  regions: Region[];
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy', description: 'Left half of face', emoji: '😊', points: 5,
    regions: [{ top: 0, bottom: 100, left: 0, right: 50 }],
  },
  medium: {
    label: 'Medium', description: 'Eyes region only', emoji: '🤔', points: 10,
    regions: [{ top: 28, bottom: 52, left: 0, right: 100 }],
  },
  hard: {
    label: 'Hard', description: 'Forehead only', emoji: '😰', points: 20,
    regions: [{ top: 0, bottom: 26, left: 0, right: 100 }],
  },
  expert: {
    label: 'Expert', description: 'Lips only', emoji: '💀', points: 40,
    regions: [{ top: 68, bottom: 84, left: 0, right: 100 }],
  },
};

// ─── Masked image: cover panels hide everything outside the visible region ────
function MaskedImage({
  url, difficulty, revealed,
}: {
  url: string; difficulty: Difficulty; revealed: boolean;
}) {
  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <EyeOff className="w-12 h-12 text-gray-600" />
      </div>
    );
  }

  if (revealed) {
    return <img src={url} alt="Player" className="w-full h-full object-cover object-top" />;
  }

  const r = DIFFICULTIES[difficulty].regions[0];

  // Build 4 cover panels around the visible rectangle
  const covers: React.CSSProperties[] = [];
  if (r.top > 0)
    covers.push({ position: 'absolute', top: 0, left: 0, right: 0, height: `${r.top}%`, background: 'rgb(5,5,10)' });
  if (r.bottom < 100)
    covers.push({ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${100 - r.bottom}%`, background: 'rgb(5,5,10)' });
  if (r.left > 0)
    covers.push({ position: 'absolute', top: `${r.top}%`, height: `${r.bottom - r.top}%`, left: 0, width: `${r.left}%`, background: 'rgb(5,5,10)' });
  if (r.right < 100)
    covers.push({ position: 'absolute', top: `${r.top}%`, height: `${r.bottom - r.top}%`, right: 0, width: `${100 - r.right}%`, background: 'rgb(5,5,10)' });

  return (
    <div className="relative w-full h-full">
      <img
        src={url}
        alt="Mystery player"
        className="absolute inset-0 w-full h-full object-cover object-top"
        draggable={false}
      />
      {covers.map((style, i) => <div key={i} style={style} />)}
      {/* Amber border around visible window */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: `${r.top}%`, left: `${r.left}%`,
          width: `${r.right - r.left}%`, height: `${r.bottom - r.top}%`,
          boxShadow: 'inset 0 0 0 2px rgba(251,191,36,0.6)',
        }}
      />
    </div>
  );
}

export default function FaceRevealPage() {
  const { refreshUser } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [phase, setPhase]           = useState<'select' | 'play' | 'done'>('select');
  const [imageUrl, setImageUrl]     = useState('');
  const [sessionId, setSessionId]   = useState('');
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [hints, setHints]           = useState<Hint[]>([]);
  const [revealedHints, setRevealedHints] = useState(0);
  const [guesses, setGuesses]       = useState<string[]>([]);
  const [input, setInput]           = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gameOver, setGameOver]     = useState(false);
  const [won, setWon]               = useState(false);
  const [answer, setAnswer]         = useState<any>(null);
  const [score, setScore]           = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [revealImage, setRevealImage] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [showHow, setShowHow]       = useState(false);
  const [error, setError]           = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await wordleApi.getFaceReveal();
      setImageUrl(data.image);
      setSessionId(data.sessionId);
      setPlayerNames(data.playerNames);
      setHints(data.hints);
      setRevealedHints(0);
      setGuesses([]);
      setGameOver(false);
      setWon(false);
      setAnswer(null);
      setRevealImage(false);
      setInput('');
      setSuggestions([]);
      setPhase('play');
    } catch (e: any) {
      setError(e.message || 'Failed to load challenge. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const playAgain = () => {
    setPhase('select');
  };

  const handleInput = (v: string) => {
    setInput(v);
    if (v.length < 2) { setSuggestions([]); return; }
    setSuggestions(
      playerNames.filter(n => n.toLowerCase().includes(v.toLowerCase())).slice(0, 8)
    );
  };

  const submitGuess = useCallback(async (name?: string) => {
    const gname = (name || input).trim();
    if (!gname || submitting || gameOver) return;
    const guessNum = guesses.length + 1;
    setSubmitting(true); setSuggestions([]); setInput(''); setError('');

    try {
      const result = await wordleApi.submitFaceRevealGuess(gname, guessNum, difficulty, sessionId);
      const newGuesses = [...guesses, gname];
      setGuesses(newGuesses);

      if (result.isCorrect) {
        setWon(true); setGameOver(true);
        setScore(result.coinsEarned);
        setTotalScore(t => t + result.coinsEarned);
        setGamesPlayed(g => g + 1);
        setRevealImage(true);
        if (result.answer) setAnswer(result.answer);
        refreshUser();
        setPhase('done');
      } else if (guessNum >= MAX_GUESSES || result.answer) {
        setGameOver(true); setRevealImage(true);
        setGamesPlayed(g => g + 1);
        if (result.answer) setAnswer(result.answer);
        setPhase('done');
      } else {
        setRevealedHints(p => Math.min(p + 1, hints.length));
      }
    } catch (e: any) {
      setError(e.message || 'Failed to submit guess');
    } finally {
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [guesses, input, submitting, gameOver, difficulty, hints.length, sessionId]);

  const handleShare = async () => {
    const cfg = DIFFICULTIES[difficulty];
    const lines = guesses.map((_, i) => i === guesses.length - 1 && won ? '🟩' : '🟥').join('');
    const text = `👁️ Cricket Face Reveal — ${cfg.label}\n${won ? `✅ Got it in ${guesses.length}/${MAX_GUESSES}` : `❌ X/${MAX_GUESSES}`}\n${lines}\n\nCoins: ${score} 🪙\ncricketclash.app/face-reveal`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  };

  const cfg = DIFFICULTIES[difficulty];

  // ── SELECT DIFFICULTY ──────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-xl w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="text-6xl mb-4">👁️</div>
            <h1 className="text-5xl font-display font-black gradient-text mb-2">Face Reveal</h1>
            <p className="text-gray-400 font-body mb-2">
              Identify the cricketer from a slice of their face
            </p>
            {gamesPlayed > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 mt-2">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400 font-body font-semibold">
                  {gamesPlayed} game{gamesPlayed > 1 ? 's' : ''} played · {totalScore} coins total
                </span>
              </div>
            )}
          </motion.div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-body text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            {(Object.entries(DIFFICULTIES) as [Difficulty, DifficultyConfig][]).map(([key, d]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setDifficulty(key)}
                className={cn(
                  'p-5 rounded-2xl border-2 text-left transition-all',
                  difficulty === key
                    ? 'border-amber-500/70 bg-amber-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{d.emoji}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-body font-semibold',
                    key === 'easy'   ? 'bg-green-500/20 text-green-400' :
                    key === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    key === 'hard'   ? 'bg-orange-500/20 text-orange-400' :
                                       'bg-red-500/20 text-red-400'
                  )}>{d.label}</span>
                </div>

                {/* Preview diagram */}
                <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 mb-3 relative bg-gray-900">
                  <div className="absolute inset-0 bg-gray-950" />
                  {d.regions.map((r, i) => (
                    <div key={i} className="absolute bg-amber-400/70" style={{
                      top: `${r.top}%`, left: `${r.left}%`,
                      width: `${r.right - r.left}%`, height: `${r.bottom - r.top}%`,
                    }} />
                  ))}
                </div>

                <p className="text-white font-display font-bold text-sm mb-0.5">{d.points} coins</p>
                <p className="text-xs text-gray-400 font-body">{d.description}</p>
              </motion.button>
            ))}
          </div>

          {/* How to play */}
          <div className="glass rounded-2xl p-5 mb-6">
            <button onClick={() => setShowHow(s => !s)}
              className="w-full flex items-center justify-between text-sm text-gray-400 hover:text-white font-body transition-colors">
              <span>How it works</span>
              {showHow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showHow && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <ul className="mt-4 space-y-2 text-sm text-gray-300 font-body">
                    <li>👁️ A clean slice of the cricketer's photo is shown — no blur</li>
                    <li>😊 <strong className="text-white">Easy</strong> — left half of the face</li>
                    <li>🤔 <strong className="text-white">Medium</strong> — eyes region</li>
                    <li>😰 <strong className="text-white">Hard</strong> — forehead only</li>
                    <li>💀 <strong className="text-white">Expert</strong> — lips only</li>
                    <li>💡 A text hint unlocks after each wrong guess</li>
                    <li>🏆 Fewer guesses = more points</li>
                    <li>🔄 Play as many times as you want — new player each time</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={startGame} disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-xl shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Eye className="w-5 h-5" /> Start {cfg.label} Challenge</>}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            className={cn('glass rounded-3xl p-8 text-center border-2',
              won ? 'border-green-500/30' : 'border-white/10')}>

            <div className="text-5xl mb-3">{won ? '🏆' : '😔'}</div>
            <h2 className="text-3xl font-display font-black text-white mb-1">
              {won ? `Got it in ${guesses.length} guess${guesses.length > 1 ? 'es' : ''}!` : 'Better luck next time!'}
            </h2>

            {won && score > 0 && (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 mt-3 mb-1">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-display font-bold">+{score} 🪙 coins</span>
              </div>
            )}

            {/* Revealed photo */}
            {(imageUrl || answer) && (
              <div className="mt-5 mb-4">
                <div className="w-36 h-44 mx-auto rounded-2xl overflow-hidden border-4 border-amber-500/40 mb-3">
                  <img src={imageUrl || answer?.image} alt="Player"
                    className="w-full h-full object-cover object-top" />
                </div>
                <p className="text-2xl font-display font-black text-amber-400 mb-2">{answer?.name}</p>
                <div className="flex flex-wrap justify-center gap-2 text-xs font-body">
                  {[answer?.country, answer?.role, answer?.specialty].filter(Boolean).map((t: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-gray-300">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Guess log */}
            <div className="space-y-1.5 my-4">
              {guesses.map((g, i) => (
                <div key={i} className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-body',
                  i === guesses.length - 1 && won
                    ? 'bg-green-500/15 border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                )}>
                  {i === guesses.length - 1 && won
                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 flex-shrink-0" />}
                  <span className="font-semibold">{g}</span>
                  <span className="ml-auto text-xs text-gray-500">#{i + 1}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <button onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-sm">
                <Share2 className="w-4 h-4" />
                {copied ? 'Copied!' : 'Share'}
              </button>
              {/* Play Again — same difficulty */}
              <button onClick={startGame} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-display font-bold text-sm hover:bg-white/10 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Play Again
              </button>
              <button onClick={playAgain}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-display font-bold text-sm hover:bg-white/10 transition-all">
                Change Mode
              </button>
            </div>

            {gamesPlayed > 1 && (
              <p className="mt-4 text-xs text-gray-500 font-body">
                Session: {gamesPlayed} games · {totalScore} 🪙 coins total
              </p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-display font-black gradient-text mb-2">Face Reveal</h1>
          <div className="flex items-center justify-center gap-2">
            <span className={cn(
              'text-xs px-2.5 py-1 rounded-full font-body font-semibold border',
              difficulty === 'easy'   ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
              difficulty === 'hard'   ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                        'bg-red-500/20 text-red-400 border-red-500/30'
            )}>
              {cfg.emoji} {cfg.label}
            </span>
            <span className="text-xs text-gray-500 font-body">{cfg.description} · {cfg.points} coins</span>
          </div>
        </div>

        {/* Image */}
        <div className="mb-6 mx-auto" style={{ maxWidth: 280 }}>
          <div className={cn(
            'rounded-2xl overflow-hidden border-2 aspect-[3/4] relative bg-gray-950',
            difficulty === 'easy'   ? 'border-green-500/30' :
            difficulty === 'medium' ? 'border-yellow-500/30' :
            difficulty === 'hard'   ? 'border-orange-500/30' :
                                       'border-red-500/30'
          )}>
            <MaskedImage url={imageUrl} difficulty={difficulty} revealed={revealImage} />
          </div>
        </div>

        {/* Showing label */}
        {!revealImage && (
          <div className="flex justify-center mb-5">
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-400 font-body font-semibold">
              Showing: {cfg.description}
            </span>
          </div>
        )}

        {/* Hints */}
        {revealedHints > 0 && (
          <div className="mb-5">
            <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Hints ({revealedHints}/{hints.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {hints.slice(0, revealedHints).map(hint => (
                <motion.div key={hint.id}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-xl p-3 border border-amber-500/20 text-center">
                  <div className="text-lg mb-0.5">{hint.emoji}</div>
                  <div className="text-[10px] text-gray-400 font-body">{hint.label}</div>
                  <div className="text-xs text-amber-300 font-display font-bold mt-0.5">{hint.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Guess history */}
        {guesses.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {guesses.map((g, i) => (
              <div key={i} className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-body',
                i === guesses.length - 1 && won
                  ? 'bg-green-500/15 border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              )}>
                {i === guesses.length - 1 && won
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 flex-shrink-0" />}
                <span className="font-semibold">{g}</span>
                <span className="ml-auto text-xs text-gray-500">#{i + 1}</span>
              </div>
            ))}
          </div>
        )}

        {/* Attempt dots */}
        {!gameOver && (
          <div className="flex items-center justify-center gap-2 mb-5">
            {Array.from({ length: MAX_GUESSES }).map((_, i) => (
              <div key={i} className={cn('w-2.5 h-2.5 rounded-full transition-all',
                i < guesses.length ? 'bg-amber-400 scale-110' : 'bg-white/10')} />
            ))}
            <span className="text-xs text-gray-500 font-body ml-2">
              {MAX_GUESSES - guesses.length} left
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mb-3 text-xs text-red-400 font-body text-center">{error}</p>
        )}

        {/* Input */}
        {!gameOver && (
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text" value={input}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitGuess();
                    if (e.key === 'Escape') setSuggestions([]);
                  }}
                  placeholder="Name the player…"
                  className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border-2 border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 font-body text-sm transition-all"
                  disabled={submitting} autoComplete="off"
                />
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 right-0 mt-1 z-30 glass-dark rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                      {suggestions.map(name => (
                        <button key={name} onClick={() => { setSuggestions([]); submitGuess(name); }}
                          className="w-full text-left px-4 py-2.5 text-white font-body text-sm hover:bg-amber-500/10 hover:text-amber-300 transition-colors border-b border-white/5 last:border-0">
                          {name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => submitGuess()} disabled={!input.trim() || submitting}
                className={cn(
                  'px-5 py-3.5 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-1.5 flex-shrink-0',
                  input.trim() && !submitting
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                )}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guess'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 font-body text-center">
              Correct now = <span className="text-amber-400 font-semibold">{cfg.points} 🪙 coins</span>
            </p>
          </div>
        )}

        {/* Quit mid-game */}
        {!gameOver && (
          <button onClick={playAgain}
            className="mt-4 w-full text-xs text-gray-600 hover:text-gray-400 font-body transition-colors">
            ← Back to difficulty select
          </button>
        )}
      </div>
    </div>
  );
}
