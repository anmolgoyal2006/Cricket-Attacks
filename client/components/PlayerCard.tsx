"use client";

import { cn } from '@/lib/utils';
import { TrendingUp, Target, Shield, Crown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlayerCardPlayer {
  _id?: string;
  id?: number;
  name: string;
  role: string;
  country: string;
  batting: number;
  bowling: number;
  fielding: number;
  captaincy?: number;
  pressure?: number;
  overall: number;
  specialty: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legend';
  image: string;
  formats?: Record<string, any>;
}

interface PlayerCardProps {
  player: PlayerCardPlayer;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
  delay?: number;
}

const rarityColors = {
  Common: 'from-gray-500 to-gray-700',
  Rare:   'from-blue-500 to-blue-700',
  Epic:   'from-purple-500 to-purple-700',
  Legend: 'from-amber-400 to-orange-600',
};

const rarityBorder = {
  Common: 'border-gray-500/40',
  Rare:   'border-blue-500/40',
  Epic:   'border-purple-500/40',
  Legend: 'border-amber-500/50',
};

const rarityGlow = {
  Common: 'shadow-gray-500/20',
  Rare:   'shadow-blue-500/30',
  Epic:   'shadow-purple-500/40',
  Legend: 'shadow-amber-500/50',
};

export default function PlayerCard({
  player, onClick, className, animate = false, delay = 0,
}: PlayerCardProps) {
  const CardWrapper = animate ? motion.div : 'div';
  const cardProps = animate
    ? {
        initial: { opacity: 0, y: 50, rotateY: -15 },
        animate: { opacity: 1, y: 0, rotateY: 0 },
        transition: { duration: 0.6, delay, type: 'spring', stiffness: 100 },
      }
    : {};

  const initials = player.name
    ? player.name.split(' ').map(n => n[0]).join('')
    : '?';

  return (
    <CardWrapper
      {...cardProps}
      className={cn('group relative w-full max-w-[260px] cursor-pointer', className)}
      onClick={onClick}
    >
      {/* Card shell — auto height so nothing gets clipped */}
      <div
        className={cn(
          'relative w-full rounded-2xl overflow-hidden flex flex-col',
          'bg-gradient-to-br from-cricket-stadium via-gray-900 to-black',
          'border-2 transition-all duration-300',
          rarityBorder[player.rarity],
          'hover:border-white/40',
          'shadow-2xl hover:shadow-3xl',
          rarityGlow[player.rarity],
          'hover:scale-[1.03] hover:-rotate-[0.5deg]',
        )}
      >
        {/* ── Top bar: rarity badge + overall rating ── */}
        <div className="relative flex items-start justify-between px-3 pt-3 pb-0 z-20">
          {/* Rarity badge */}
          <div
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white',
              'bg-gradient-to-r shadow-sm',
              rarityColors[player.rarity],
            )}
          >
            {player.rarity.toUpperCase()}
          </div>

          {/* Overall circle */}
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-amber-400 to-orange-600',
              'shadow-lg shadow-amber-500/40 border-2 border-white/20 flex-shrink-0',
            )}
          >
            <span className="text-xl font-display font-black text-white leading-none">
              {player.overall || '—'}
            </span>
          </div>
        </div>

        {/* ── Player avatar ── */}
        <div className="relative flex items-center justify-center pt-2 pb-3 px-4">
          {/* Gradient backdrop behind avatar */}
          <div
            className={cn(
              'w-28 h-28 rounded-full flex items-center justify-center',
              'bg-gradient-to-br shadow-2xl border-4 border-white/20 flex-shrink-0',
              rarityColors[player.rarity],
            )}
          >
            <span className="text-4xl font-display font-black text-white select-none">
              {initials}
            </span>
          </div>
          {/* Subtle vignette from bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>

        {/* ── Info section ── */}
        <div className="relative z-10 px-4 pb-4 bg-gradient-to-t from-black via-black/90 to-transparent flex-1 flex flex-col">
          {/* Name */}
          <h3 className="text-base font-display font-bold text-white leading-tight mb-1 truncate">
            {player.name || 'Unknown'}
          </h3>

          {/* Role + Country */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-body truncate max-w-[60%]">
              {player.role || 'Cricketer'}
            </span>
            {player.country && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 font-body border border-green-500/20 truncate max-w-[40%]">
                {player.country}
              </span>
            )}
          </div>

          {/* Specialty */}
          {player.specialty && (
            <div className="mb-3 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <p className="text-[11px] text-amber-400 font-body font-semibold text-center truncate">
                ⚡ {player.specialty}
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-5 gap-1">
            {[
              { icon: <TrendingUp className="w-3 h-3 text-amber-400" />, label: 'BAT', val: player.batting },
              { icon: <Target className="w-3 h-3 text-blue-400" />,     label: 'BWL', val: player.bowling },
              { icon: <Shield className="w-3 h-3 text-green-400" />,    label: 'FLD', val: player.fielding },
              { icon: <Crown className="w-3 h-3 text-purple-400" />,    label: 'CAP', val: player.captaincy ?? 70 },
              { icon: <Zap className="w-3 h-3 text-red-400" />,         label: 'PRE', val: player.pressure ?? 80 },
            ].map(s => (
              <div
                key={s.label}
                className="flex flex-col items-center p-1 rounded-lg bg-white/5 border border-white/10"
              >
                {s.icon}
                <span className="text-[9px] text-gray-400 font-body mt-0.5">{s.label}</span>
                <span className="text-xs font-display font-bold text-white leading-none mt-0.5">
                  {s.val || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shine on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
      </div>
    </CardWrapper>
  );
}
