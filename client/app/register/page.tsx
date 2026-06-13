"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, UserPlus, Eye, EyeOff, AlertCircle, Sparkles, Gift, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const RARITY_STYLES: Record<string, { border: string; glow: string; badge: string; label: string }> = {
  Legend: {
    border: 'border-yellow-400/60',
    glow: 'shadow-yellow-500/40',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    label: '👑 Legend',
  },
  Epic: {
    border: 'border-purple-400/60',
    glow: 'shadow-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    label: '💜 Epic',
  },
  Rare: {
    border: 'border-blue-400/60',
    glow: 'shadow-blue-500/40',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    label: '💎 Rare',
  },
  Common: {
    border: 'border-white/20',
    glow: 'shadow-white/10',
    badge: 'bg-white/10 text-gray-300 border-white/20',
    label: 'Common',
  },
};

interface BonusCard {
  _id: string;
  name: string;
  rarity: string;
  overall: number;
  country: string;
  role: string;
  image: string;
}

function WelcomeModal({ cards, onContinue }: { cards: BonusCard[]; onContinue: () => void }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const allRevealed = cards.every((_, i) => revealed[i]);

  const reveal = (i: number) => setRevealed((prev) => ({ ...prev, [i]: true }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        className="w-full max-w-lg glass-dark rounded-3xl p-8 border border-white/10 text-center"
      >
        {/* Header */}
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Gift className="w-7 h-7 text-amber-400" />
          <h2 className="text-3xl font-display font-black gradient-text">Welcome Gift!</h2>
          <Gift className="w-7 h-7 text-amber-400" />
        </div>
        <p className="text-gray-400 font-body mb-8 text-sm">
          You've received free bonus cards to kick off your collection. Tap each card to reveal it!
        </p>

        {/* Cards */}
        <div className={cn('grid gap-4 mb-8', cards.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {cards.map((card, i) => {
            const style = RARITY_STYLES[card.rarity] ?? RARITY_STYLES.Common;
            const isRevealed = revealed[i];

            return (
              <motion.button
                key={card._id}
                onClick={() => reveal(i)}
                disabled={isRevealed}
                className={cn(
                  'relative rounded-2xl overflow-hidden border-2 aspect-[3/4] transition-all cursor-pointer',
                  isRevealed
                    ? `${style.border} shadow-xl ${style.glow}`
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                )}
                whileHover={!isRevealed ? { scale: 1.03 } : {}}
                whileTap={!isRevealed ? { scale: 0.97 } : {}}
              >
                <AnimatePresence mode="wait">
                  {!isRevealed ? (
                    <motion.div
                      key="back"
                      initial={{ rotateY: 0 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"
                    >
                      <div className="text-5xl mb-3">🎁</div>
                      <p className="text-xs text-gray-400 font-body">Tap to reveal</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="front"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      {/* Card image */}
                      <div className="flex-1 relative overflow-hidden">
                        <img
                          src={card.image}
                          alt={card.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://via.placeholder.com/300x400/1e3a8a/ffffff?text=' +
                              encodeURIComponent(card.name);
                          }}
                        />
                        {/* Sparkles overlay on reveal */}
                        <motion.div
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 0 }}
                          transition={{ delay: 0.5, duration: 0.6 }}
                          className="absolute inset-0 bg-white/30 pointer-events-none"
                        />
                      </div>
                      {/* Card info footer */}
                      <div className="bg-black/70 backdrop-blur-sm p-2 text-left">
                        <p className="text-white font-display font-bold text-sm leading-tight truncate">{card.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={cn(
                              'text-xs px-1.5 py-0.5 rounded-md border font-body',
                              style.badge
                            )}
                          >
                            {style.label}
                          </span>
                          <span className="text-amber-400 font-display font-bold text-sm">{card.overall}</span>
                        </div>
                        <p className="text-gray-400 font-body text-xs mt-0.5 truncate">
                          {card.country} · {card.role}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* CTA */}
        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'w-full py-3.5 rounded-xl font-display font-bold text-lg flex items-center justify-center space-x-2 transition-all',
            allRevealed
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50'
              : 'bg-white/5 border border-white/10 text-gray-400'
          )}
        >
          <Sparkles className="w-5 h-5" />
          <span>{allRevealed ? 'Start Playing!' : `Reveal all cards first (${Object.keys(revealed).length}/${cards.length})`}</span>
          {allRevealed && <ArrowRight className="w-5 h-5" />}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeCards, setWelcomeCards] = useState<BonusCard[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await register(username, email, password);
      if (result.welcomeBonus && result.welcomeBonus.length > 0) {
        setWelcomeCards(result.welcomeBonus);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Welcome bonus modal */}
      <AnimatePresence>
        {welcomeCards && (
          <WelcomeModal
            cards={welcomeCards}
            onContinue={() => router.push('/')}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-dark rounded-3xl p-8 border border-white/10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-display font-black gradient-text">Join the Clash</h1>
              <p className="text-gray-400 font-body mt-2">Create your account and start collecting</p>
            </div>

            {/* Welcome bonus teaser */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center space-x-3">
              <Gift className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300 font-body">
                <strong>New player bonus:</strong> Get a free 💎 Rare + 👑 Legend card on signup!
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400 font-body">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-300 font-body mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="CricketStar"
                  required
                  minLength={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-body transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 font-body mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-body transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 font-body mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-body transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-lg shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              </motion.button>
            </form>

            {/* Footer */}
            <p className="text-center text-gray-400 font-body mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
