"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Quote,
  CheckCircle2,
  XCircle,
  Share2,
  RotateCcw,
  Trophy,
  Loader2,
  Zap,
  Star,
  ChevronRight,
  Coins,
} from 'lucide-react';
import { quizApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  quote: string;
  options: string[];
  category: string;
  difficulty: string;
}

type GamePhase = 'intro' | 'playing' | 'result';
type AnswerState = 'idle' | 'correct' | 'wrong';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/40',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  hard: 'bg-red-500/20 text-red-400 border-red-500/40',
};

const DIFFICULTY_COINS: Record<string, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
};

const SCORE_MESSAGES = [
  { min: 0, max: 3, emoji: '😬', message: "Needs more cricket trivia!" },
  { min: 4, max: 6, emoji: '🏏', message: "Not bad, cricket fan!" },
  { min: 7, max: 8, emoji: '🏆', message: "Excellent! Cricket guru!" },
  { min: 9, max: 10, emoji: '🌟', message: "LEGENDARY! Perfect score!" },
];

function getScoreMessage(score: number, total: number) {
  const pct = (score / total) * 10;
  return (
    SCORE_MESSAGES.find((m) => pct >= m.min && pct <= m.max) ||
    SCORE_MESSAGES[SCORE_MESSAGES.length - 1]
  );
}

export default function QuizPage() {
  const { user, refreshUser } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [score, setScore] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; question: string; answer: string }[]>([]);

  const currentQuestion = questions[currentIdx];

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quizApi.getQuestions(10);
      setQuestions(data.questions);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStart = async () => {
    await loadQuestions();
    setCurrentIdx(0);
    setScore(0);
    setTotalCoins(0);
    setResults([]);
    setSelectedAnswer(null);
    setAnswerState('idle');
    setCorrectAnswer(null);
    setExplanation(null);
    setGamePhase('playing');
  };

  const handleAnswer = async (answer: string) => {
    if (answerState !== 'idle' || submitting) return;
    setSelectedAnswer(answer);
    setSubmitting(true);

    try {
      const result = await quizApi.submitAnswer(currentQuestion.id, answer);
      setAnswerState(result.isCorrect ? 'correct' : 'wrong');
      setCorrectAnswer(result.correctAnswer);
      setExplanation(result.explanation);
      setCoinsEarned(result.coinsEarned);

      if (result.isCorrect) {
        setScore((s) => s + 1);
        setTotalCoins((c) => c + result.coinsEarned);
      }

      setResults((prev) => [
        ...prev,
        {
          correct: result.isCorrect,
          question: currentQuestion.quote.slice(0, 60) + '...',
          answer: result.correctAnswer,
        },
      ]);

      // Auto-advance after 2.5s
      setTimeout(() => {
        if (currentIdx + 1 >= questions.length) {
          setGamePhase('result');
          if (user && result.coinsEarned > 0) refreshUser();
        } else {
          setCurrentIdx((i) => i + 1);
          setSelectedAnswer(null);
          setAnswerState('idle');
          setCorrectAnswer(null);
          setExplanation(null);
          setCoinsEarned(0);
        }
      }, 2500);
    } catch {
      setAnswerState('idle');
      setSelectedAnswer(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const percentage = Math.round((score / questions.length) * 100);
    const msg = getScoreMessage(score, questions.length);
    const resultLines = results
      .map((r) => (r.correct ? '🟩' : '🟥'))
      .join('');

    const text = `🏏 Cricket "Who Said This?" Quiz\n${msg.emoji} ${score}/${questions.length} (${percentage}%)\n\n${resultLines}\n\nThink you know your cricket quotes?\ncricketclash.app/quiz`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // ---- INTRO ----
  if (gamePhase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-10"
          >
            <div className="text-7xl mb-6">🗣️</div>
            <h1 className="text-5xl font-display font-black gradient-text mb-4">
              Who Said This?
            </h1>
            <p className="text-gray-300 font-body text-lg mb-6 leading-relaxed">
              Famous cricket quotes, spicy press conference moments, and legendary trash talk —
              can you match the words to the cricketer?
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="glass-dark rounded-xl p-4">
                <div className="text-2xl mb-2">❓</div>
                <div className="text-lg font-display font-bold text-white">10</div>
                <div className="text-xs text-gray-400 font-body">Questions</div>
              </div>
              <div className="glass-dark rounded-xl p-4">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-lg font-display font-bold text-white">Easy–Hard</div>
                <div className="text-xs text-gray-400 font-body">Difficulty Mix</div>
              </div>
              <div className="glass-dark rounded-xl p-4">
                <div className="text-2xl mb-2">🪙</div>
                <div className="text-lg font-display font-bold text-amber-400">
                  {user ? 'Up to 300' : 'Play Free'}
                </div>
                <div className="text-xs text-gray-400 font-body">{user ? 'Coins to earn' : 'No login needed'}</div>
              </div>
            </div>

            <div className="mb-8 text-left glass-dark rounded-xl p-5 space-y-2 text-sm text-gray-300 font-body">
              <p>🟢 Easy questions = <strong className="text-white">10 coins</strong></p>
              <p>🟡 Medium questions = <strong className="text-white">20 coins</strong></p>
              <p>🔴 Hard questions = <strong className="text-white">30 coins</strong></p>
              {!user && (
                <p className="text-amber-400 text-xs mt-2">
                  💡 Sign in to earn coins for correct answers!
                </p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Quote className="w-5 h-5" />
                  <span>Start Quiz</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---- RESULT ----
  if (gamePhase === 'result') {
    const msg = getScoreMessage(score, questions.length);
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-8 text-center"
          >
            <div className="text-6xl mb-4">{msg.emoji}</div>
            <h2 className="text-4xl font-display font-black text-white mb-2">{msg.message}</h2>
            <p className="text-gray-400 font-body mb-6">
              {score}/{questions.length} correct · {percentage}%
            </p>

            {/* Score bar */}
            <div className="w-full h-4 rounded-full bg-white/10 mb-6 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-600"
              />
            </div>

            {/* Coins earned */}
            {totalCoins > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 mb-6"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-display font-bold text-lg">
                  +{totalCoins} coins earned!
                </span>
              </motion.div>
            )}

            {/* Results breakdown */}
            <div className="space-y-2 mb-6 text-left max-h-60 overflow-y-auto custom-scrollbar">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start space-x-3 p-3 rounded-xl text-sm',
                    r.correct
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  )}
                >
                  <span className="text-lg flex-shrink-0">{r.correct ? '✅' : '❌'}</span>
                  <div className="min-w-0">
                    <p className="text-gray-300 font-body text-xs truncate">"{r.question}"</p>
                    <p
                      className={cn(
                        'font-display font-bold text-sm mt-0.5',
                        r.correct ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {r.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Copied!' : 'Share Score'}</span>
              </button>
              <button
                onClick={handleStart}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-display font-bold hover:bg-white/10 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---- PLAYING ----
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const progress = ((currentIdx) / questions.length) * 100;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400 font-body">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full border font-body',
                  DIFFICULTY_COLORS[currentQuestion.difficulty] || DIFFICULTY_COLORS.medium
                )}
              >
                {currentQuestion.difficulty}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 font-body">
                {currentQuestion.category}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-display font-bold">{score}</span>
              {user && (
                <>
                  <Zap className="w-4 h-4 text-amber-400 ml-2" />
                  <span className="text-amber-400 font-display font-bold text-sm">+{totalCoins}</span>
                </>
              )}
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-600"
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Quote Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.35 }}
          >
            <div className="glass rounded-2xl p-8 mb-6 relative">
              <Quote className="w-8 h-8 text-amber-400/40 absolute top-6 left-6" />
              <div className="pt-4 pb-2">
                <p className="text-xl sm:text-2xl font-display font-semibold text-white leading-relaxed text-center italic px-6">
                  "{currentQuestion.quote}"
                </p>
              </div>
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xs text-amber-400 font-body">
                    Worth {DIFFICULTY_COINS[currentQuestion.difficulty] || 20} coins
                  </span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                let style =
                  'glass border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 text-white cursor-pointer';

                if (answerState !== 'idle') {
                  if (option === correctAnswer) {
                    style = 'bg-green-500/20 border-green-500 text-green-300 cursor-default';
                  } else if (option === selectedAnswer && !correctAnswer?.includes(option)) {
                    style = 'bg-red-500/20 border-red-500 text-red-400 cursor-default';
                  } else {
                    style = 'glass border-white/5 text-gray-500 cursor-default opacity-60';
                  }
                }

                return (
                  <motion.button
                    key={option}
                    whileHover={answerState === 'idle' ? { scale: 1.02 } : {}}
                    whileTap={answerState === 'idle' ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(option)}
                    disabled={answerState !== 'idle' || submitting}
                    className={cn(
                      'w-full px-6 py-4 rounded-xl border-2 text-left font-display font-semibold text-lg transition-all flex items-center justify-between',
                      style
                    )}
                  >
                    <span>{option}</span>
                    {answerState !== 'idle' && option === correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                    {answerState !== 'idle' &&
                      option === selectedAnswer &&
                      option !== correctAnswer && (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'mt-6 p-5 rounded-xl border-l-4',
                    answerState === 'correct'
                      ? 'bg-green-500/10 border-green-500 border-l-green-400'
                      : 'bg-red-500/10 border-red-500 border-l-red-400'
                  )}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {answerState === 'correct' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span
                      className={cn(
                        'font-display font-bold',
                        answerState === 'correct' ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {answerState === 'correct' ? `Correct! +${coinsEarned > 0 ? coinsEarned + ' coins' : ''}` : `It was ${correctAnswer}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 font-body leading-relaxed">{explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
