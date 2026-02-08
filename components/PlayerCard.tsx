"use client";

import { Player } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { TrendingUp, Target, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
  delay?: number;
}

const rarityColors = {
  Common: 'from-gray-500 to-gray-700',
  Rare: 'from-blue-500 to-blue-700',
  Epic: 'from-purple-500 to-purple-700',
  Legend: 'from-amber-400 to-orange-600',
};

const rarityGlow = {
  Common: 'shadow-gray-500/20',
  Rare: 'shadow-blue-500/30',
  Epic: 'shadow-purple-500/40',
  Legend: 'shadow-amber-500/50',
};

export default function PlayerCard({ player, onClick, className, animate = false, delay = 0 }: PlayerCardProps) {
  const CardWrapper = animate ? motion.div : 'div';
  const cardProps = animate ? {
    initial: { opacity: 0, y: 50, rotateY: -15 },
    animate: { opacity: 1, y: 0, rotateY: 0 },
    transition: { duration: 0.6, delay, type: "spring", stiffness: 100 }
  } : {};

  return (
    <CardWrapper
      {...cardProps}
      className={cn(
        "group relative w-full max-w-[280px] aspect-[2/3] cursor-pointer perspective-1000",
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        "relative w-full h-full rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-cricket-stadium via-gray-900 to-black",
        "border-2 border-white/10 hover:border-white/30",
        "shadow-2xl hover:shadow-3xl transition-all duration-300",
        rarityGlow[player.rarity],
        "transform hover:scale-105 hover:-rotate-1",
        "before:absolute before:inset-0 before:bg-stadium-pattern before:opacity-30"
      )}>
        {/* Rarity Badge */}
        <div className={cn(
          "absolute top-3 left-3 z-20 px-3 py-1 rounded-full text-xs font-bold",
          "bg-gradient-to-r backdrop-blur-sm shadow-lg",
          rarityColors[player.rarity],
          "text-white"
        )}>
          {player.rarity.toUpperCase()}
        </div>

        {/* Overall Rating */}
        <div className="absolute top-3 right-3 z-20">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/50 border-2 border-white/20">
            <span className="text-2xl font-display font-black text-white">{player.overall}</span>
          </div>
        </div>

        {/* Player Image */}
        <div className="relative w-full h-[55%] mt-12 flex items-end justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
          <div className={cn(
            "w-48 h-48 rounded-full flex items-center justify-center text-6xl font-bold",
            "bg-gradient-to-br", rarityColors[player.rarity],
            "shadow-2xl border-4 border-white/20 mb-4"
          )}>
            {player.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>

        {/* Card Info */}
        <div className="relative z-10 px-4 pb-4 bg-gradient-to-t from-black via-black/95 to-transparent pt-6">
          <h3 className="text-xl font-display font-bold text-white mb-1 leading-tight">
            {player.name}
          </h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-body">{player.role}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-cricket-field/30 text-green-400 font-body">
              {player.country}
            </span>
          </div>

          {/* Specialty */}
          <div className="mb-3 px-2 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-400 font-body font-semibold text-center">
              ⚡ {player.specialty}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
              <TrendingUp className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-xs text-gray-400 font-body">BAT</span>
              <span className="text-lg font-display font-bold text-white">{player.batting}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
              <Target className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-xs text-gray-400 font-body">BOWL</span>
              <span className="text-lg font-display font-bold text-white">{player.bowling}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
              <Shield className="w-4 h-4 text-green-400 mb-1" />
              <span className="text-xs text-gray-400 font-body">FIELD</span>
              <span className="text-lg font-display font-bold text-white">{player.fielding}</span>
            </div>
          </div>
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </CardWrapper>
  );
}
