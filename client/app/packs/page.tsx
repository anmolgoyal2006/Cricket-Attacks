"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, ChevronRight, AlertCircle, Trophy, Star } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import { packsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PackResult {
  _id: string;
  name: string;
  role: string;
  country: string;
  batting: number;
  bowling: number;
  fielding: number;
  captaincy: number;
  pressure: number;
  overall: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legend';
  specialty: string;
  image: string;
  formats: Record<string, any>;
  isNew: boolean;
}

const PACK_TYPES = [
  {
    type: 'basic',
    name: 'Daily Free Pack',
    subtitle: '3 cards · Free every 24h',
    gradient: 'from-amber-500 via-orange-500 to-red-600',
    glow: 'shadow-amber-500/50',
    cardCount: 3,
    cost: 0,
    badge: 'FREE',
    badgeColor: 'bg-green-500',
  },
  {
    type: 'premium',
    name: 'Premium Pack',
    subtitle: '5 cards · Better odds',
    gradient: 'from-purple-500 via-violet-600 to-blue-700',
    glow: 'shadow-purple-500/50',
    cardCount: 5,
    cost: 500,
    badge: '500 🪙',
    badgeColor: 'bg-purple-600',
  },
  {
    type: 'legendary',
    name: 'Legendary Pack',
    subtitle: '7 cards · Best Legend odds',
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    glow: 'shadow-yellow-500/50',
    cardCount: 7,
    cost: 1000,
    badge: '1000 🪙',
    badgeColor: 'bg-amber-600',
  },
];

const RARITY_ORDER = { Legend: 0, Epic: 1, Rare: 2, Common: 3 };

export default function PacksPage() {
  const { user, refreshUser } = useAuth();
  const [isOpening, setIsOpening]     = useState(false);
  const [openingType, setOpeningType] = useState('');
  const [revealedCards, setRevealedCards] = useState<PackResult[]>([]);
  const [showCards, setShowCards]     = useState(false);
  const [error, setError]             = useState('');
  const [coins, setCoins]             = useState(user?.coins ?? 0);

  const handleOpen = async (packType: string) => {
    setError('');
    setIsOpening(true);
    setOpeningType(packType);

    try {
      const data = await packsApi.openPack(packType);

      // Sort by rarity (best first) for the reveal
      const sorted = [...(data.results as PackResult[])].sort(
        (a, b) => (RARITY_ORDER[a.rarity] ?? 3) - (RARITY_ORDER[b.rarity] ?? 3)
      );

      setTimeout(() => {
        setRevealedCards(sorted);
        setCoins(data.coins);
        setShowCards(true);
        setIsOpening(false);
        refreshUser();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to open pack');
      setIsOpening(false);
    }
  };

  const resetPack = () => {
    setShowCards(false);
    setRevealedCards([]);
    setError('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Sign in to open packs</h2>
          <p className="text-gray-400 font-body mb-6">Create an account to start collecting cards</p>
          <Link href="/login">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── OPENING ANIMATION ──────────────────────────────────────────────────────
  if (isOpening) {
    const pack = PACK_TYPES.find(p => p.type === openingType) || PACK_TYPES[0];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.15, 1], opacity: 1, rotate: [0, 8, -8, 0] }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
          className={cn('w-64 h-80 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-2xl', pack.gradient, pack.glow)}
        >
          <motion.div
            animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-24 h-24 text-white" />
          </motion.div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-2xl font-display font-black text-amber-400"
        >
          Opening {pack.name}…
        </motion.p>
      </div>
    );
  }

  // ── CARDS REVEALED ─────────────────────────────────────────────────────────
  if (showCards) {
    const hasLegend = revealedCards.some(c => c.rarity === 'Legend');
    const hasEpic   = revealedCards.some(c => c.rarity === 'Epic');

    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="text-5xl mb-3">
              {hasLegend ? '🌟' : hasEpic ? '💎' : '🎉'}
            </div>
            <h2 className="text-4xl font-display font-black text-white mb-1">
              Pack Opened!
            </h2>
            <p className="text-gray-400 font-body">
              {revealedCards.length} new cards added to your collection
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-display font-bold">{coins} coins remaining</span>
            </div>
          </motion.div>

          {/* Cards grid — staggered reveal */}
          <div className={cn(
            'grid gap-6 mb-10 justify-items-center',
            revealedCards.length <= 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : revealedCards.length <= 5
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7'
          )}>
            {revealedCards.map((card, index) => (
              <motion.div
                key={card._id || index}
                initial={{ opacity: 0, rotateY: -90, scale: 0.6 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                transition={{
                  delay: index * 0.18,
                  duration: 0.7,
                  type: 'spring',
                  stiffness: 120,
                }}
                className="relative"
              >
                <PlayerCard
                  player={{
                    _id: card._id,
                    name: card.name,
                    role: card.role,
                    country: card.country,
                    batting: card.batting,
                    bowling: card.bowling,
                    fielding: card.fielding,
                    captaincy: card.captaincy,
                    pressure: card.pressure,
                    overall: card.overall,
                    specialty: card.specialty,
                    rarity: card.rarity,
                    image: card.image,
                    formats: card.formats,
                  }}
                />
                {/* NEW / DUPE badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.18 + 0.5, type: 'spring' }}
                  className={cn(
                    'absolute -top-2 -right-2 z-30 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg',
                    card.isNew ? 'bg-green-500' : 'bg-blue-500'
                  )}
                >
                  {card.isNew ? '✨ NEW' : '🔁 DUPE'}
                </motion.div>

                {/* Legend/Epic glow pulse */}
                {(card.rarity === 'Legend' || card.rarity === 'Epic') && (
                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      'absolute -inset-2 rounded-2xl -z-10 blur-md',
                      card.rarity === 'Legend'
                        ? 'bg-amber-500/40'
                        : 'bg-purple-500/30'
                    )}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Summary bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: revealedCards.length * 0.18 + 0.3 }}
            className="glass rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-center gap-4"
          >
            {(['Legend', 'Epic', 'Rare', 'Common'] as const).map(rarity => {
              const count = revealedCards.filter(c => c.rarity === rarity).length;
              if (!count) return null;
              const colors: Record<string, string> = {
                Legend: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
                Epic:   'text-purple-400 bg-purple-500/15 border-purple-500/30',
                Rare:   'text-blue-400 bg-blue-500/15 border-blue-500/30',
                Common: 'text-gray-400 bg-white/5 border-white/10',
              };
              return (
                <div key={rarity} className={cn('px-3 py-1 rounded-full border text-xs font-body font-semibold flex items-center gap-1.5', colors[rarity])}>
                  {rarity === 'Legend' && <Star className="w-3 h-3" />}
                  {count}× {rarity}
                </div>
              );
            })}
            <span className="text-xs text-gray-500 font-body">
              {revealedCards.filter(c => c.isNew).length} new · {revealedCards.filter(c => !c.isNew).length} dupes
            </span>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/collection">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-lg shadow-2xl shadow-amber-500/40 flex items-center gap-2"
              >
                <span>View Collection</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={resetPack}
              className="px-8 py-4 rounded-xl bg-white/5 border-2 border-white/20 text-white font-display font-bold text-lg hover:bg-white/10 hover:border-white/30 transition-all flex items-center gap-2"
            >
              <Gift className="w-5 h-5" />
              <span>Open Another Pack</span>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── PACK SELECTION ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-400 font-body font-semibold">Expand Your Collection</span>
          </motion.div>

          <h1 className="text-5xl font-display font-black gradient-text mb-4">Open Packs</h1>
          <p className="text-gray-300 font-body text-lg">Pull random cricket cards — the rarer the pack, the better the odds</p>

          <div className="flex items-center justify-center mt-4 gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-display font-bold text-lg">{coins} coins</span>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400 font-body">{error}</p>
          </div>
        )}

        {/* Pack cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PACK_TYPES.map((pack, i) => (
            <motion.div
              key={pack.type}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center"
            >
              {/* Pack visual */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative mb-6 cursor-pointer"
                onClick={() => handleOpen(pack.type)}
              >
                <div className={cn(
                  'w-52 h-72 rounded-3xl bg-gradient-to-br shadow-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden',
                  pack.gradient, pack.glow,
                )}>
                  {/* Background shimmer */}
                  <div className="absolute inset-0 bg-white/5 bg-stadium-pattern" />

                  {/* Badge */}
                  <div className={cn('absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-white', pack.badgeColor)}>
                    {pack.badge}
                  </div>

                  <Gift className="w-20 h-20 text-white/90 mb-4" />
                  <h3 className="text-xl font-display font-black text-white text-center leading-tight mb-1">
                    {pack.name}
                  </h3>
                  <p className="text-white/70 text-xs font-body text-center">{pack.subtitle}</p>
                </div>

                {/* Sparkle decorations */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-3 -right-3"
                >
                  <Sparkles className="w-7 h-7 text-amber-300" />
                </motion.div>
              </motion.div>

              {/* Rarity odds */}
              <div className="glass rounded-2xl p-4 w-full mb-4">
                <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3 text-center">Drop Rates</p>
                <div className="space-y-1.5">
                  {pack.type === 'basic' && (
                    <>
                      <OddsRow label="Common" pct="60%" color="text-gray-400" />
                      <OddsRow label="Rare"   pct="25%" color="text-blue-400" />
                      <OddsRow label="Epic"   pct="12%" color="text-purple-400" />
                      <OddsRow label="Legend" pct="3%"  color="text-amber-400" />
                    </>
                  )}
                  {pack.type === 'premium' && (
                    <>
                      <OddsRow label="Common" pct="30%" color="text-gray-400" />
                      <OddsRow label="Rare"   pct="35%" color="text-blue-400" />
                      <OddsRow label="Epic"   pct="25%" color="text-purple-400" />
                      <OddsRow label="Legend" pct="10%" color="text-amber-400" />
                    </>
                  )}
                  {pack.type === 'legendary' && (
                    <>
                      <OddsRow label="Common" pct="10%" color="text-gray-400" />
                      <OddsRow label="Rare"   pct="20%" color="text-blue-400" />
                      <OddsRow label="Epic"   pct="40%" color="text-purple-400" />
                      <OddsRow label="Legend" pct="30%" color="text-amber-400" />
                    </>
                  )}
                </div>
              </div>

              {/* Open button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleOpen(pack.type)}
                disabled={isOpening || (pack.cost > 0 && coins < pack.cost)}
                className={cn(
                  'w-full py-3.5 rounded-2xl font-display font-bold text-base transition-all flex items-center justify-center gap-2',
                  pack.cost === 0
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
                    : pack.type === 'premium'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                    : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50',
                  (pack.cost > 0 && coins < pack.cost) && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Sparkles className="w-4 h-4" />
                {pack.cost === 0 ? 'Open Free Pack' : `Open for ${pack.cost} coins`}
              </motion.button>

              {pack.cost > 0 && coins < pack.cost && (
                <p className="text-xs text-red-400 font-body mt-2 text-center">
                  Need {pack.cost - coins} more coins
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OddsRow({ label, pct, color }: { label: string; pct: string; color: string }) {
  const width = parseInt(pct);
  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-xs font-body w-14 font-semibold', color)}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full', {
            'bg-gray-400':   label === 'Common',
            'bg-blue-500':   label === 'Rare',
            'bg-purple-500': label === 'Epic',
            'bg-amber-400':  label === 'Legend',
          })}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 font-body w-8 text-right">{pct}</span>
    </div>
  );
}
