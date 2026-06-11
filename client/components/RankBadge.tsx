"use client";

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const TIER_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  Bronze:    { color: 'from-orange-700 to-amber-800',    bg: 'bg-orange-900/30',    icon: '🟤', label: 'Bronze' },
  Silver:    { color: 'from-gray-300 to-gray-500',        bg: 'bg-gray-500/30',      icon: '🥈', label: 'Silver' },
  Gold:      { color: 'from-amber-400 to-yellow-600',    bg: 'bg-amber-500/30',     icon: '🥇', label: 'Gold' },
  Platinum:  { color: 'from-cyan-400 to-blue-600',       bg: 'bg-cyan-500/30',      icon: '💎', label: 'Platinum' },
  Diamond:   { color: 'from-sky-300 to-indigo-600',      bg: 'bg-sky-500/30',       icon: '🔷', label: 'Diamond' },
  Master:    { color: 'from-red-400 to-purple-700',      bg: 'bg-purple-600/30',    icon: '👑', label: 'Master' },
};

interface RankBadgeProps {
  tier: string;
  elo?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export default function RankBadge({ tier, elo, size = 'md', animated = false, className }: RankBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.Bronze;

  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-3xl',
    lg: 'w-32 h-32 text-4xl',
  };

  const content = (
    <>
      <div className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg border-2 border-white/20',
        sizeClasses[size],
        config.color
      )}>
        <span className="select-none">{config.icon}</span>
      </div>
      <span className={cn(
        'font-display font-bold',
        size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg',
        'text-white'
      )}>
        {config.label}
      </span>
      {elo !== undefined && (
        <span className={cn(
          'font-display font-bold',
          size === 'sm' ? 'text-[10px]' : 'text-xs',
          'text-gray-400'
        )}>
          {elo} ELO
        </span>
      )}
    </>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={cn('flex flex-col items-center gap-1', className)}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {content}
    </div>
  );
}

export function getTierInfo(tier: string) {
  return TIER_CONFIG[tier] || TIER_CONFIG.Bronze;
}
