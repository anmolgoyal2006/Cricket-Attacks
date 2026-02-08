"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Sparkles, Swords, Users, Home, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/battle', label: 'Card Battle', icon: Swords },
    { href: '/packs', label: 'Open Packs', icon: Sparkles },
    { href: '/compare', label: 'Compare Players', icon: Users },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-cricket-stadium/95 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-display font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Cricket Clash
              </div>
              <div className="text-xs text-amber-400/70 -mt-1 font-body">Cards</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200",
                    "flex items-center space-x-2 group relative",
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 shadow-lg shadow-amber-500/20"
                      : "text-gray-300 hover:text-amber-400 hover:bg-white/5"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4 transition-transform",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Profile */}
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-200 group border border-amber-500/30">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
              P
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs text-amber-400 font-body font-semibold">Player</div>
              <div className="text-xs text-gray-400 -mt-0.5">1,245 🏆</div>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 pt-1 flex space-x-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 rounded-lg min-w-[70px] transition-all",
                  isActive
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400"
                    : "text-gray-400 hover:text-amber-400"
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-body whitespace-nowrap">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
