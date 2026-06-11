"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTierInfo } from './RankBadge';
import { ChevronUp } from 'lucide-react';

interface RankProgressProps {
  currentTier: string;
  nextTier: string | null;
  progress: number;
  eloToNext: number;
  elo: number;
  className?: string;
}

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];

const TIER_COLORS: Record<string, string> = {
  Bronze: 'bg-orange-700',
  Silver: 'bg-gray-400',
  Gold: 'bg-amber-500',
  Platinum: 'bg-cyan-500',
  Diamond: 'bg-sky-400',
  Master: 'bg-purple-500',
};

export default function RankProgress({ currentTier, nextTier, progress, eloToNext, elo, className }: RankProgressProps) {
  const currentInfo = getTierInfo(currentTier);

  if (!nextTier) {
    return (
      <div className={cn('glass rounded-2xl p-4', className)}>
        <div className="text-center">
          <span className="text-3xl">{currentInfo.icon}</span>
          <h3 className="text-lg font-display font-bold text-white mt-2">Master Tier</h3>
          <p className="text-sm text-amber-400 font-body">Maximum rank achieved!</p>
          <p className="text-2xl font-display font-black text-white mt-2">{elo} ELO</p>
        </div>
      </div>
    );
  }

  const currentIdx = TIERS.indexOf(currentTier);
  const nextIdx = TIERS.indexOf(nextTier);

  return (
    <div className={cn('glass rounded-2xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{currentInfo.icon}</span>
          <span className="text-sm font-display font-bold text-white">{currentTier}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-display font-bold text-gray-400">{nextTier}</span>
          <ChevronUp className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      <div className="w-full h-3 rounded-full bg-gray-700 overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full rounded-full', TIER_COLORS[currentTier] || 'bg-amber-500')}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 font-body">{elo} ELO</span>
        <span className="text-amber-400 font-body font-semibold">{eloToNext} to {nextTier}</span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        {TIERS.slice(0, currentIdx + 2).map((tier, i) => {
          const info = getTierInfo(tier);
          const isActive = i <= currentIdx;
          const isCurrent = tier === currentTier;
          return (
            <div key={tier} className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                isActive ? info.color : 'bg-gray-700',
                isCurrent && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-gray-900'
              )}>
                <span className="text-[10px]">{info.icon}</span>
              </div>
              <span className={cn('text-[8px] font-body', isActive ? 'text-white' : 'text-gray-600')}>
                {tier === 'Platinum' ? 'Plat' : tier}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
