"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Share2, Loader2, Clock, ChevronDown, ChevronUp,
  Star, CheckCircle2, XCircle, Lock,
} from 'lucide-react';
import { wordleApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const MAX_GUESSES = 5;

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface Hint { id: number; label: string; value: string; emoji: string }

// ─── Difficulty config ────────────────────────────────────────────────────────
// Instead of blur, each mode uses a named clip region:
//   easy   → left half of face
//   medium → eyes strip (top 30-48%)
//   hard   → forehead strip (top 0-28%)
//   expert → lips strip (bottom 70-85%)
// No blur applied anywhere — just clean partial crops.
interface DifficultyConfig {
  label: string;
  description: string;
  emoji: string;
  points: number;
  // The visible rect(s) as percentage of image height: [{ top, bottom }]
  // Multiple rects = multiple visible strips shown together via SVG clipPath
  regions: { top: number; bottom: number; leftPercent: number; rightPercent: number }[];
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    description: 'Left half of face revealed',
    emoji: '😊',
    points: 5,
    regions: [{ top: 0, bottom: 100, leftPercent: 0, rightPercent: 50 }],
  },
  medium: {
    label: 'Medium',
    description: 'Eyes region only',
    emoji: '🤔',
    points: 10,
    regions: [{ top: 28, bottom: 52, leftPercent: 0, rightPercent: 100 }],
  },
  hard: {
    label: 'Hard',
    description: 'Forehead only',
    emoji: '😰',
    points: 20,
    regions: [{ top: 0, bottom: 26, leftPercent: 0, rightPercent: 100 }],
  },
  expert: {
    label: 'Expert',
    description: 'Lips only',
    emoji: '💀',
    points: 40,
    regions: [{ top: 68, bottom: 84, leftPercent: 0, rightPercent: 100 }],
  },
};

function countdown(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const d = midnight.getTime() - now.getTime();
  const h = Math.floor(d / 3600000);
  const m = Math.floor((d % 3600000) / 60000);
  const s = Math.floor((d % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function todayKey() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

// ─── Masked image component ───────────────────────────────────────────────────
// Renders the player photo with a dark overlay punched out in the visible regions.
// Uses inline SVG clipPath so no CSS blur is needed at all.
function MaskedPlayerImage({
  imageUrl,
  difficulty,
  revealed,
}: {
  imageUrl: string;
  difficulty: Difficulty;
  revealed: boolean;
}) {
  const cfg = DIFFICULTIES[difficulty];
  const clipId = `face-clip-${difficulty}`;

  if (revealed || !imageUrl) {
    return (
      <img
        src={imageUrl || ''}
        alt="Player"
        className="w-full h-full object-cover object-top"
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Full image underneath — always rendered so layout is stable */}
      <img
        src={imageUrl}
        alt="Mystery player"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />

      {/* Dark overlay with cut-outs for visible regions */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            {cfg.regions.map((r, i) => (
              <rect
                key={i}
                x={r.leftPercent / 100}
                y={r.top / 100}
                width={(r.rightPercent - r.leftPercent) / 100}
                height={(r.bottom - r.top) / 100}
              />
            ))}
          </clipPath>
        </defs>

        {/* Full dark overlay */}
        <rect x="0" y="0" width="100" height="100" fill="rgba(8,8,12,0.88)" />

        {/* Punch out visible regions — show the actual image through them */}
        {cfg.regions.map((r, i) => (
          <image
            key={i}
            href={imageUrl}
            x="0"
            y="0"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMin slice"
            clipPath={`url(#${clipId})`}
          />
        ))}
      </svg>

      {/* Subtle border lines showing the cut region boundaries */}
      {cfg.regions.map((r, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${r.top}%`,
            height: `${r.bottom - r.top}%`,
            left: `${r.leftPercent}%`,
            width: `${r.rightPercent - r.leftPercent}%`,
            boxShadow: 'inset 0 0 0 1.5px rgba(251,191,36,0.35)',
            borderRadius: 2,
          }}
        />
      ))}

      {/* Label badge showing what region is visible */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="text-[10px] text-amber-400/80 font-body font-semibold bg-black/70 px-2 py-0.5 rounded-full border border-amber-500/20">
          {cfg.description}
        </span>
      </div>
    </div>
  );
}

// ─── Region label for the "how it works" breakdown ────────────────────────────
const REGION_PREVIEWS: Record<Difficulty, { label: string; visual: string }> = {
  easy:   { label: 'Left Half',  visual: '⬛🟨 ←left side of face' },
  medium: { label: 'Eyes Strip', visual: '🔲 eyes band across middle' },
  hard:   { label: 'Forehead',   visual: '🔲 top portion only' },
  expert: { label: 'Lips',       visual: '🔲 small lips band near bottom' },
};

export default function FaceRevealPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [phase, setPhase]           = useState<'select' | 'play' | 'done'>('select');
  const [imageUrl, setImageUrl]     = useState('');
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
  const [streak]                    = useState(1);
  const [revealImage, setRevealImage] = useState(false);
  const [timer, setTimer]           = useState('');
  const [copied, setCopied]         = useState(false);
  const [showHow, setShowHow]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTimer(countdown()), 1000);
    setTimer(countdown());
    return () => clearInterval(t);
  }, []);

  // Restore saved state
  useEffect(() => {
    const saved = localStorage.getItem(`face-reveal-${todayKey()}`);
    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      if (s.phase === 'done') {
        setPhase('done');
        setGuesses(s.guesses || []);
        setWon(s.won || false);
        setScore(s.score || 0);
        setDifficulty(s.difficulty || 'medium');
        setAnswer(s.answer || null);
        setRevealedHints(s.revealedHints || 0);
        setRevealImage(true);
      }
    } catch { /* ignore */ }
  }, []);

  const startGame = async () => {
    setLoading(true);
    try {
      const data = await wordleApi.getFaceReveal();
      setImageUrl(data.image);
      setPlayerNames(data.playerNames);
      setHints(data.hints);
      setRevealedHints(0);
      setGuesses([]);
      setGameOver(false);
      setWon(false);
      setAnswer(null);
      setRevealImage(false);
      setPhase('play');
    } catch { /* silent */ }
    finally { setLoading(false); }
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
    setSubmitting(true); setSuggestions([]); setInput('');

    try {
      const result = await wordleApi.submitFaceRevealGuess(gname, guessNum, difficulty);
      const newGuesses = [...guesses, gname];
      setGuesses(newGuesses);

      if (result.isCorrect) {
        const finalScore = result.pointsEarned * streak;
        setWon(true); setGameOver(true); setScore(finalScore); setRevealImage(true);
        if (result.answer) setAnswer(result.answer);
        setPhase('done');
        localStorage.setItem(`face-reveal-${todayKey()}`, JSON.stringify({
          phase: 'done', guesses: newGuesses, won: true,
          score: finalScore, difficulty, answer: result.answer, revealedHints,
        }));
      } else if (guessNum >= MAX_GUESSES || result.answer) {
        setGameOver(true); setRevealImage(true);
        if (result.answer) setAnswer(result.answer);
        setPhase('done');
        localStorage.setItem(`face-reveal-${todayKey()}`, JSON.stringify({
          phase: 'done', guesses: newGuesses, won: false,
          score: 0, difficulty, answer: result.answer, revealedHints,
        }));
      } else {
        setRevealedHints(p => Math.min(p + 1, hints.length));
      }
    } catch { /* silent */ }
    finally {
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [guesses, input, submitting, gameOver, difficulty, hints.length, streak, revealedHints]);

  const handleShare = async () => {
    const cfg = DIFFICULTIES[difficulty];
    const lines = guesses.map((_, i) => i === guesses.length - 1 && won ? '🟩' : '🟥').join('');
    const text = `👁️ Cricket Face Reveal — ${cfg.label}\n${won ? `✅ Got it in ${guesses.length}/${MAX_GUESSES}` : `❌ X/${MAX_GUESSES}`}\n${lines}\n\nScore: ${score} pts\ncricketclash.app/face-reveal`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { /* ignore */ }
  };

  const cfg = DIFFICULTIES[difficulty];

  // ── DIFFICULTY SELECT ──────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="text-6xl mb-4">👁️</div>
            <h1 className="text-5xl font-display font-black gradient-text mb-2">Face Reveal</h1>
            <p className="text-gray-400 font-body">Identify the cricketer from a partial photo — no blur, just a slice of their face</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {(Object.entries(DIFFICULTIES) as [Difficulty, DifficultyConfig][]).map(([key, d]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDifficulty(key)}
                className={cn(
                  'p-5 rounded-2xl border-2 text-left transition-all',
                  difficulty === key
                    ? 'border-amber-500/60 bg-amber-500/10'
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

                {/* Mini visual showing which region is revealed */}
                <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 bg-gray-800 mb-3 relative">
                  <div className="absolute inset-0 bg-gray-700" />
                  {d.regions.map((r, i) => (
                    <div
                      key={i}
                      className="absolute bg-amber-400/60"
                      style={{
                        top: `${r.top}%`,
                        left: `${r.leftPercent}%`,
                        width: `${r.rightPercent - r.leftPercent}%`,
                        height: `${r.bottom - r.top}%`,
                      }}
                    />
                  ))}
                </div>

                <p className="text-white font-display font-bold text-sm mb-0.5">{d.points} pts · {d.label}</p>
                <p className="text-xs text-gray-400 font-body">{d.description}</p>
              </motion.button>
            ))}
          </div>

          {/* How to play */}
          <div className="glass rounded-2xl p-5 mb-6">
            <button
              onClick={() => setShowHow(s => !s)}
              className="w-full flex items-center justify-between text-sm text-gray-400 hover:text-white font-body transition-colors"
            >
              <span>How it works</span>
              {showHow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showHow && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <ul className="mt-4 space-y-2 text-sm text-gray-300 font-body">
                    <li>👁️ A portion of the cricketer's photo is revealed — no blur, just a clean crop</li>
                    <li>😊 <strong className="text-white">Easy</strong> — left half of the face</li>
                    <li>🤔 <strong className="text-white">Medium</strong> — eyes strip only</li>
                    <li>😰 <strong className="text-white">Hard</strong> — forehead strip only</li>
                    <li>💀 <strong className="text-white">Expert</strong> — lips strip only</li>
                    <li>💡 A text hint unlocks after each wrong guess</li>
                    <li>🏆 Fewer guesses = more points</li>
                    <li>📅 New player every day at midnight</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={startGame}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-xl shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            {loading
              ? <Loader2 className="w-6 h-6 animate-spin" />
              : <><Eye className="w-5 h-5" /> Start {cfg.label} Challenge</>
            }
          </motion.button>
        </div>
      </div>
    );
  }

  // ── GAME OVER / DONE ───────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'glass rounded-3xl p-8 text-center border-2',
              won ? 'border-green-500/30' : 'border-white/10'
            )}
          >
            <div className="text-5xl mb-3">{won ? '🏆' : '😔'}</div>
            <h2 className="text-3xl font-display font-black text-white mb-1">
              {won ? `Identified in ${guesses.length} guess${guesses.length > 1 ? 'es' : ''}!` : 'Better luck tomorrow!'}
            </h2>

            {won && score > 0 && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 mt-3 mb-1">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-display font-bold">+{score} points</span>
              </div>
            )}

            {/* Full revealed image */}
            {(imageUrl || answer) && (
              <div className="mt-5 mb-5">
                <div className="w-36 h-44 mx-auto rounded-2xl overflow-hidden border-4 border-amber-500/40 mb-3">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Player" className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center text-4xl">
                      {answer?.name?.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                  )}
                </div>
                <p className="text-3xl font-display font-black text-amber-400 mb-2">{answer?.name}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-body">
                  {[answer?.country, answer?.role, answer?.specialty].filter(Boolean).map((tag: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-gray-300">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Guess log */}
            {guesses.length > 0 && (
              <div className="space-y-1.5 mb-5">
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
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-sm"
              >
                <Share2 className="w-4 h-4" />
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={() => { setPhase('select'); setRevealImage(false); }}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-display font-bold text-sm hover:bg-white/10 transition-all"
              >
                Change Difficulty
              </button>
              <Link
                href="/wordle"
                className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-display font-bold text-sm hover:bg-amber-500/25 transition-all"
              >
                🏏 Try Wordle
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500 font-body">
              <Clock className="w-3.5 h-3.5" />
              <span>Next challenge in {timer}</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-body font-semibold">Next challenge in {timer}</span>
          </div>
          <h1 className="text-4xl font-display font-black gradient-text mb-1">Face Reveal</h1>
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
            <span className="text-xs text-gray-500 font-body">{cfg.points} pts · {cfg.description}</span>
          </div>
        </div>

        {/* Player Image — masked with SVG, zero blur */}
        <div className="mb-6 mx-auto relative" style={{ maxWidth: 300 }}>
          <div className={cn(
            'rounded-2xl overflow-hidden border-2 bg-gray-900 aspect-[3/4] relative',
            difficulty === 'easy'   ? 'border-green-500/30' :
            difficulty === 'medium' ? 'border-yellow-500/30' :
            difficulty === 'hard'   ? 'border-orange-500/30' :
                                       'border-red-500/30'
          )}>
            {imageUrl ? (
              <MaskedPlayerImage
                imageUrl={imageUrl}
                difficulty={difficulty}
                revealed={revealImage}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <EyeOff className="w-12 h-12 text-gray-600" />
              </div>
            )}
          </div>

          {/* Glow ring */}
          <div className={cn(
            'absolute -inset-1 rounded-2xl -z-10',
            difficulty === 'easy'   ? 'shadow-lg shadow-green-500/15' :
            difficulty === 'medium' ? 'shadow-lg shadow-yellow-500/15' :
            difficulty === 'hard'   ? 'shadow-lg shadow-orange-500/20' :
                                       'shadow-lg shadow-red-500/20'
          )} />
        </div>

        {/* What region is visible — visual legend */}
        {!revealImage && (
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="text-xs text-gray-400 font-body">Showing:</span>
              <span className="text-xs text-amber-400 font-display font-bold">{cfg.description}</span>
            </div>
          </div>
        )}

        {/* Progressive Hints */}
        {revealedHints > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Hints Unlocked ({revealedHints}/{hints.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {hints.slice(0, revealedHints).map(hint => (
                <motion.div
                  key={hint.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-xl p-3 border border-amber-500/20 text-center"
                >
                  <div className="text-lg mb-0.5">{hint.emoji}</div>
                  <div className="text-[10px] text-gray-400 font-body">{hint.label}</div>
                  <div className="text-xs text-amber-300 font-display font-bold mt-0.5">{hint.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Guess History */}
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
                <span className="ml-auto text-xs text-gray-500">Guess {i + 1}</span>
              </div>
            ))}
          </div>
        )}

        {/* Attempt dots */}
        {!gameOver && (
          <div className="flex items-center justify-center gap-2 mb-5">
            {Array.from({ length: MAX_GUESSES }).map((_, i) => (
              <div key={i} className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                i < guesses.length ? 'bg-amber-400 scale-110' : 'bg-white/10'
              )} />
            ))}
            <span className="text-xs text-gray-500 font-body ml-2">
              {MAX_GUESSES - guesses.length} guess{MAX_GUESSES - guesses.length !== 1 ? 'es' : ''} left
            </span>
          </div>
        )}

        {/* Input */}
        {!gameOver && (
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitGuess();
                    if (e.key === 'Escape') setSuggestions([]);
                  }}
                  placeholder="Name the player…"
                  className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border-2 border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 font-body text-sm transition-all"
                  disabled={submitting}
                  autoComplete="off"
                />

                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 right-0 mt-1 z-30 glass-dark rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                    >
                      {suggestions.map(name => (
                        <button
                          key={name}
                          onClick={() => { setSuggestions([]); submitGuess(name); }}
                          className="w-full text-left px-4 py-2.5 text-white font-body text-sm hover:bg-amber-500/10 hover:text-amber-300 transition-colors border-b border-white/5 last:border-0"
                        >
                          {name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => submitGuess()}
                disabled={!input.trim() || submitting}
                className={cn(
                  'px-5 py-3.5 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-1.5 flex-shrink-0',
                  input.trim() && !submitting
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                )}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guess'}
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-500 font-body text-center">
              Correct now = <span className="text-amber-400 font-semibold">{cfg.points} pts</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
