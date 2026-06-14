"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function CoinCelebrationModal({ coins, message, onContinue }: { coins: number; message: string; onContinue: () => void }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative z-10 w-full max-w-sm glass-dark rounded-3xl p-8 border border-amber-500/30 text-center shadow-2xl shadow-amber-500/20"
        >
          {/* Floating coins animation */}
          <div className="relative mb-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: -80 - i * 15,
                  x: (i % 2 === 0 ? 1 : -1) * (20 + i * 12),
                }}
                transition={{ delay: i * 0.12, duration: 1.2, ease: 'easeOut' }}
                className="absolute top-8 left-1/2 -translate-x-1/2 text-2xl pointer-events-none select-none"
              >
                🪙
              </motion.div>
            ))}

            <motion.div
              animate={{ rotate: [0, -8, 8, -5, 5, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/50"
            >
              <span className="text-4xl">🪙</span>
            </motion.div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-display font-black text-white mb-2"
          >
            Welcome Bonus!
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="text-6xl font-display font-black text-amber-400 mb-3"
          >
            +{coins.toLocaleString()}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-300 font-body text-sm mb-8 leading-relaxed"
          >
            {message}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onContinue}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-lg shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
          >
            Let's Go! 🏏
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bonus, setBonus] = useState<{ coins: number; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result?.firstLoginBonus) {
        setBonus(result.firstLoginBonus);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {bonus && (
        <CoinCelebrationModal
          coins={bonus.coins}
          message={bonus.message}
          onContinue={() => {
            setBonus(null);
            router.push('/');
          }}
        />
      )}

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
              <h1 className="text-3xl font-display font-black gradient-text">Welcome Back</h1>
              <p className="text-gray-400 font-body mt-2">Sign in to continue your journey</p>
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
                    placeholder="Enter your password"
                    required
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
                <LogIn className="w-5 h-5" />
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              </motion.button>
            </form>

            {/* Footer */}
            <p className="text-center text-gray-400 font-body mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
