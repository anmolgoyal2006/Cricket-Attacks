"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Trophy, Sparkles, Swords, Users, Home, LogIn, UserPlus,
  LogOut, Hash, HelpCircle, Gamepad2, ChevronDown, Eye, ClipboardList, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const GAME_ITEMS = [
  {
    href: '/wordle',
    label: 'Cricket Wordle',
    icon: Hash,
    desc: 'Deduce the daily mystery player',
    badge: 'Daily',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    iconBg: 'from-amber-400 to-orange-500',
  },
  {
    href: '/quiz',
    label: 'Cricket Quiz',
    icon: HelpCircle,
    desc: 'Quotes, stats & trivia — test your cricket IQ',
    badge: 'Quiz',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    iconBg: 'from-purple-500 to-blue-600',
  },
  {
    href: '/face-reveal',
    label: 'Face Reveal',
    icon: Eye,
    desc: 'Identify cricketers from hidden photos',
    badge: 'Daily',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    iconBg: 'from-cyan-500 to-teal-600',
  },
];

// Cricket scoring/viewing items — merged into one "Cricket" dropdown
const CRICKET_ITEMS = [
  {
    href: '/matches',
    label: 'Live Matches',
    icon: Radio,
    desc: 'Watch live scores and scorecards',
    badge: 'Live',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    iconBg: 'from-red-500 to-orange-600',
  },
  {
    href: '/matches/create',
    label: 'Score a Match',
    icon: ClipboardList,
    desc: 'Create a match and score ball by ball',
    badge: 'Scorer',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    iconBg: 'from-amber-400 to-orange-500',
  },
];

const MAIN_NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/battle', label: 'Battle', icon: Swords },
  { href: '/packs', label: 'Packs', icon: Sparkles },
  { href: '/compare', label: 'Compare', icon: Users },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [gamesOpen, setGamesOpen] = useState(false);
  const [cricketOpen, setCricketOpen] = useState(false);
  const [navBottom, setNavBottom] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cricketDropdownRef = useRef<HTMLDivElement>(null);

  const isGamesActive = GAME_ITEMS.some((g) => pathname === g.href);
  const isCricketActive = CRICKET_ITEMS.some((c) => pathname === c.href || pathname.startsWith('/matches'));

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGamesOpen(false);
      }
      if (cricketDropdownRef.current && !cricketDropdownRef.current.contains(e.target as Node)) {
        setCricketOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function updateNavBottom() {
      if (navRef.current) {
        setNavBottom(navRef.current.getBoundingClientRect().bottom);
      }
    }
    updateNavBottom();
    window.addEventListener('resize', updateNavBottom);
    return () => window.removeEventListener('resize', updateNavBottom);
  }, []);

  // Close on route change
  useEffect(() => {
    setGamesOpen(false);
    setCricketOpen(false);
  }, [pathname]);

  return (
    <nav ref={navRef} className="sticky top-0 z-50 bg-cricket-stadium/95 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200',
                    'flex items-center gap-1.5 group relative',
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400'
                      : 'text-gray-300 hover:text-amber-400 hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('w-4 h-4 transition-transform', isActive ? 'scale-110' : 'group-hover:scale-110')} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* Games Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => { setGamesOpen((o) => !o); setCricketOpen(false); }}
                className={cn(
                  'px-3 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200',
                  'flex items-center gap-1.5 group relative',
                  isGamesActive || gamesOpen
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400'
                    : 'text-gray-300 hover:text-amber-400 hover:bg-white/5'
                )}
              >
                <Gamepad2 className={cn('w-4 h-4 transition-transform', (isGamesActive || gamesOpen) ? 'scale-110' : 'group-hover:scale-110')} />
                <span>Games</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', gamesOpen ? 'rotate-180' : '')} />
                {isGamesActive && (
                  <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
                )}
              </button>
              {gamesOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-gray-950/95 backdrop-blur-xl z-50">
                  <div className="p-2">
                    {GAME_ITEMS.map((game) => {
                      const Icon = game.icon;
                      const isActive = pathname === game.href;
                      return (
                        <Link key={game.href} href={game.href}
                          className={cn('flex items-center gap-3 p-3 rounded-xl transition-all',
                            isActive ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-white/5 border border-transparent'
                          )}
                        >
                          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', game.iconBg)}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-display font-bold text-white">{game.label}</span>
                              <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-body', game.badgeColor)}>{game.badge}</span>
                            </div>
                            <p className="text-xs text-gray-400 font-body mt-0.5">{game.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="px-4 pb-3 pt-1 border-t border-white/5">
                    <p className="text-xs text-gray-500 font-body">More games coming soon 🏏</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cricket Dropdown — Live Matches + Score a Match merged into one */}
            <div className="relative" ref={cricketDropdownRef}>
              <button
                onClick={() => { setCricketOpen((o) => !o); setGamesOpen(false); }}
                className={cn(
                  'px-3 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200',
                  'flex items-center gap-1.5 group relative',
                  isCricketActive || cricketOpen
                    ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400'
                    : 'text-gray-300 hover:text-red-400 hover:bg-white/5'
                )}
              >
                <Radio className={cn('w-4 h-4 transition-transform', (isCricketActive || cricketOpen) ? 'scale-110' : 'group-hover:scale-110')} />
                <span>Cricket</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', cricketOpen ? 'rotate-180' : '')} />
                {isCricketActive && (
                  <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-orange-500 rounded-full" />
                )}
              </button>
              {cricketOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-gray-950/95 backdrop-blur-xl z-50">
                  <div className="p-2">
                    {CRICKET_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.href} href={item.href}
                          className={cn('flex items-center gap-3 p-3 rounded-xl transition-all',
                            isActive ? 'bg-red-500/10 border border-red-500/20' : 'hover:bg-white/5 border border-transparent'
                          )}
                        >
                          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', item.iconBg)}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-display font-bold text-white">{item.label}</span>
                              <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-body', item.badgeColor)}>{item.badge}</span>
                            </div>
                            <p className="text-xs text-gray-400 font-body mt-0.5">{item.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <>
                <div className="hidden lg:flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <span className="text-sm text-amber-400 font-display font-bold">{user.trophies}</span>
                  <Trophy className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all group border border-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs text-amber-400 font-body font-semibold">{user.displayName}</div>
                    <div className="text-xs text-gray-400 -mt-0.5">Lvl {user.level}</div>
                  </div>
                  <LogOut className="w-4 h-4 text-gray-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-amber-400 hover:bg-white/10 transition-all font-body text-sm flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-body text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden pb-3 pt-1 flex items-center overflow-x-auto scrollbar-hide gap-1">
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn('flex flex-col items-center justify-center px-3 py-2 rounded-lg min-w-[60px] transition-all',
                  isActive ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400' : 'text-gray-400 hover:text-amber-400'
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-body whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}

          {/* Cricket dropdown trigger — mobile */}
          <div className="relative" ref={cricketDropdownRef}>
            <button
              onClick={() => { setCricketOpen((o) => !o); setGamesOpen(false); }}
              className={cn('flex flex-col items-center justify-center px-3 py-2 rounded-lg min-w-[60px] transition-all',
                isCricketActive || cricketOpen ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400' : 'text-gray-400 hover:text-red-400'
              )}
            >
              <Radio className="w-5 h-5 mb-1" />
              <span className="text-xs font-body whitespace-nowrap flex items-center gap-0.5">
                Cricket <ChevronDown className={cn('w-3 h-3 transition-transform', cricketOpen ? 'rotate-180' : '')} />
              </span>
            </button>
            {cricketOpen && (
              <div className="fixed left-4 right-4 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-gray-950/95 backdrop-blur-xl z-50" style={{ top: navBottom + 8 }}>
                <div className="p-2">
                  {CRICKET_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href}
                        className={cn('flex items-center gap-3 p-3 rounded-xl transition-all',
                          isActive ? 'bg-red-500/10 border border-red-500/20' : 'hover:bg-white/5 border border-transparent'
                        )}
                      >
                        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', item.iconBg)}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-display font-bold text-white">{item.label}</span>
                            <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-body', item.badgeColor)}>{item.badge}</span>
                          </div>
                          <p className="text-xs text-gray-400 font-body mt-0.5">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Games dropdown trigger — mobile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setGamesOpen((o) => !o); setCricketOpen(false); }}
              className={cn('flex flex-col items-center justify-center px-3 py-2 rounded-lg min-w-[60px] transition-all',
                isGamesActive || gamesOpen ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400' : 'text-gray-400 hover:text-amber-400'
              )}
            >
              <Gamepad2 className="w-5 h-5 mb-1" />
              <span className="text-xs font-body whitespace-nowrap flex items-center gap-0.5">
                Games <ChevronDown className={cn('w-3 h-3 transition-transform', gamesOpen ? 'rotate-180' : '')} />
              </span>
            </button>
            {gamesOpen && (
              <div className="fixed left-4 right-4 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-gray-950/95 backdrop-blur-xl z-50" style={{ top: navBottom + 8 }}>
                <div className="p-2">
                  {GAME_ITEMS.map((game) => {
                    const Icon = game.icon;
                    const isActive = pathname === game.href;
                    return (
                      <Link key={game.href} href={game.href}
                        className={cn('flex items-center gap-3 p-3 rounded-xl transition-all',
                          isActive ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-white/5 border border-transparent'
                        )}
                      >
                        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', game.iconBg)}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-display font-bold text-white">{game.label}</span>
                            <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-body', game.badgeColor)}>{game.badge}</span>
                          </div>
                          <p className="text-xs text-gray-400 font-body mt-0.5">{game.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="px-4 pb-3 pt-1 border-t border-white/5">
                  <p className="text-xs text-gray-500 font-body">More games coming soon 🏏</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
