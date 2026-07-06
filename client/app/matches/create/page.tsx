'use client';

/**
 * Cricket Scoring Feature — Phase 4 + Guest Player extension
 * Match creation page — /matches/create
 *
 * Players can be:
 *   1. Registered users — searched by username, linked by account ID
 *   2. Guests — type any name; if they register later their stats get linked
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Shuffle, ChevronRight, AlertCircle,
  Loader2, X, Search, PlusCircle, UserPlus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { scoringApi, CreateMatchPlayerPayload } from '@/lib/scoringApi';
import { cn } from '@/lib/utils';

interface PlayerOption {
  id?: string;         // undefined for guests
  guestName?: string;  // set for guests
  displayName: string; // always set
  isGuest: boolean;
}

const OVERS_PRESETS = [5, 10, 20, 50];

// ── Player selector ───────────────────────────────────────────────────────────
function PlayerSelector({
  label,
  selected,
  onAdd,
  onRemove,
  excludeIds,
}: {
  label: string;
  selected: PlayerOption[];
  onAdd: (p: PlayerOption) => void;
  onRemove: (displayName: string) => void;
  excludeIds: string[];   // registered user ids already in the other team
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerOption[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api<{ users: { _id: string; username: string }[] }>(
          `/auth/users/search?q=${encodeURIComponent(query.trim())}`
        );
        const registered: PlayerOption[] = (data.users || [])
          .filter((u) =>
            !excludeIds.includes(u._id) &&
            !selected.some((s) => s.id === u._id)
          )
          .map((u) => ({ id: u._id, displayName: u.username, isGuest: false }));
        setResults(registered);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, excludeIds, selected]);

  const canAddGuest =
    query.trim().length >= 2 &&
    !selected.some(
      (s) => s.displayName.toLowerCase() === query.trim().toLowerCase()
    );

  const handleAddGuest = () => {
    const name = query.trim();
    onAdd({ guestName: name, displayName: name, isGuest: true });
    setQuery('');
    setResults([]);
  };

  return (
    <div>
      <p className="text-xs text-gray-400 font-body mb-2 uppercase tracking-wider">{label}</p>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((p) => (
            <span key={p.displayName}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body border',
                p.isGuest
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              )}>
              {p.isGuest && <span className="text-[10px] opacity-70">guest</span>}
              {p.displayName}
              <button type="button" onClick={() => onRemove(p.displayName)}
                className="hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canAddGuest) { e.preventDefault(); handleAddGuest(); } }}
          placeholder="Search username or type guest name…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-body text-sm transition-all"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />}
      </div>

      {/* Results + guest option */}
      <AnimatePresence>
        {(results.length > 0 || canAddGuest) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="mt-1 rounded-xl overflow-hidden border border-white/10 bg-gray-950/95 shadow-xl z-10"
          >
            {/* Registered users */}
            {results.slice(0, 5).map((user) => (
              <button key={user.id} type="button"
                onClick={() => { onAdd(user); setQuery(''); setResults([]); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {user.displayName[0].toUpperCase()}
                </div>
                <span className="text-sm font-body text-gray-200">{user.displayName}</span>
                <PlusCircle className="w-4 h-4 text-amber-400 ml-auto" />
              </button>
            ))}

            {/* Guest option — shown when query doesn't match any registered user exactly */}
            {canAddGuest && (
              <button type="button" onClick={handleAddGuest}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-500/10 transition-colors text-left border-t border-white/5"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-body text-blue-300">Add &quot;{query.trim()}&quot; as guest</span>
                  <p className="text-[10px] text-gray-500 font-body">Stats link automatically when they register</p>
                </div>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreateMatchPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState<PlayerOption[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<PlayerOption[]>([]);
  const [oversFormat, setOversFormat] = useState<number>(20);
  const [customOvers, setCustomOvers] = useState('');
  const [useCustomOvers, setUseCustomOvers] = useState(false);
  const [tossWonBy, setTossWonBy] = useState<'teamA' | 'teamB'>('teamA');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [venue, setVenue] = useState('');
  const [individualBattingMode, setIndividualBattingMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const teamARegisteredIds = teamAPlayers.filter((p) => p.id).map((p) => p.id!);
  const teamBRegisteredIds = teamBPlayers.filter((p) => p.id).map((p) => p.id!);

  const finalOvers = useCustomOvers ? parseInt(customOvers, 10) || 0 : oversFormat;

  const validate = (): string | null => {
    if (!teamAName.trim()) return 'Team A name is required';
    if (!teamBName.trim()) return 'Team B name is required';
    if (teamAName.trim() === teamBName.trim()) return 'Team names must be different';
    const minPlayers = individualBattingMode ? 1 : 2;
    if (teamAPlayers.length < minPlayers) return `Team A needs at least ${minPlayers} player${minPlayers > 1 ? 's' : ''}`;
    if (teamBPlayers.length < minPlayers) return `Team B needs at least ${minPlayers} player${minPlayers > 1 ? 's' : ''}`;
    if (finalOvers < 1 || finalOvers > 100) return 'Overs must be between 1 and 100';
    return null;
  };

  const toPayload = (players: PlayerOption[]): CreateMatchPlayerPayload[] =>
    players.map((p) =>
      p.isGuest
        ? { guestName: p.displayName, displayName: p.displayName }
        : { id: p.id!, displayName: p.displayName }
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      const { match } = await scoringApi.createMatch({
        teamA: { name: teamAName.trim(), players: toPayload(teamAPlayers) },
        teamB: { name: teamBName.trim(), players: toPayload(teamBPlayers) },
        oversFormat: finalOvers,
        tossWonBy,
        tossDecision,
        individualBattingMode,
        venue: venue.trim() || undefined,
      });
      await scoringApi.startMatch(match._id);
      router.push(`/matches/${match._id}/score`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create match');
      setSubmitting(false);
    }
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Sign in to score</h2>
          <button onClick={() => router.push('/login')}
            className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold">
            Sign In
          </button>
        </div>
      </div>
    );
  }
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 mb-5">
            <Trophy className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-400 font-body font-semibold">Live Scoring</span>
          </div>
          <h1 className="text-4xl font-display font-black gradient-text mb-2">New Match</h1>
          <p className="text-gray-400 font-body text-sm">
            Players without accounts can be added as guests — their stats link automatically when they register.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400 font-body">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team A */}
            <div className="glass-dark rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-display font-bold text-white">Team A</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 font-body mb-1.5 uppercase tracking-wider">Team Name *</label>
                  <input type="text" value={teamAName} onChange={(e) => setTeamAName(e.target.value)}
                    placeholder="e.g. Mumbai Indians" maxLength={40}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-body text-sm transition-all"
                  />
                </div>
                <PlayerSelector
                  label={`Players (${teamAPlayers.length} added, min ${individualBattingMode ? 1 : 2})`}
                  selected={teamAPlayers}
                  onAdd={(p) => setTeamAPlayers((prev) => [...prev, p])}
                  onRemove={(name) => setTeamAPlayers((prev) => prev.filter((p) => p.displayName !== name))}
                  excludeIds={teamBRegisteredIds}
                />
              </div>
            </div>

            {/* Team B */}
            <div className="glass-dark rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-display font-bold text-white">Team B</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 font-body mb-1.5 uppercase tracking-wider">Team Name *</label>
                  <input type="text" value={teamBName} onChange={(e) => setTeamBName(e.target.value)}
                    placeholder="e.g. Chennai Super Kings" maxLength={40}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-body text-sm transition-all"
                  />
                </div>
                <PlayerSelector
                  label={`Players (${teamBPlayers.length} added, min ${individualBattingMode ? 1 : 2})`}
                  selected={teamBPlayers}
                  onAdd={(p) => setTeamBPlayers((prev) => [...prev, p])}
                  onRemove={(name) => setTeamBPlayers((prev) => prev.filter((p) => p.displayName !== name))}
                  excludeIds={teamARegisteredIds}
                />
              </div>
            </div>
          </div>

          {/* Overs */}
          <div className="glass-dark rounded-2xl p-5 border border-white/10">
            <h2 className="text-base font-display font-bold text-white mb-4">Overs Format</h2>
            <div className="flex flex-wrap gap-3 mb-3">
              {OVERS_PRESETS.map((o) => (
                <button key={o} type="button"
                  onClick={() => { setOversFormat(o); setUseCustomOvers(false); }}
                  className={cn('px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all border',
                    !useCustomOvers && oversFormat === o
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-lg shadow-amber-500/30'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30 hover:text-amber-400'
                  )}>T{o}</button>
              ))}
              <button type="button" onClick={() => setUseCustomOvers(true)}
                className={cn('px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all border',
                  useCustomOvers
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-lg shadow-amber-500/30'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30 hover:text-amber-400'
                )}>Custom</button>
            </div>
            {useCustomOvers && (
              <input type="number" min={1} max={100} value={customOvers}
                onChange={(e) => setCustomOvers(e.target.value)}
                placeholder="Enter number of overs (1–100)"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-body text-sm transition-all"
              />
            )}
          </div>

          {/* Toss */}
          <div className="glass-dark rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Shuffle className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-display font-bold text-white">Toss</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-gray-400 font-body mb-2 uppercase tracking-wider">Toss Won By</p>
                <div className="flex gap-3">
                  {(['teamA', 'teamB'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTossWonBy(t)}
                      className={cn('flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all border',
                        tossWonBy === t
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-md'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30'
                      )}>
                      {t === 'teamA' ? teamAName || 'Team A' : teamBName || 'Team B'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-body mb-2 uppercase tracking-wider">Elected To</p>
                <div className="flex gap-3">
                  {(['bat', 'bowl'] as const).map((d) => (
                    <button key={d} type="button" onClick={() => setTossDecision(d)}
                      className={cn('flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all border capitalize',
                        tossDecision === d
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-md'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30'
                      )}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Venue */}
          <div className="glass-dark rounded-2xl p-5 border border-white/10">
            <h2 className="text-base font-display font-bold text-white mb-3">Venue (optional)</h2>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Wankhede Stadium, Mumbai" maxLength={80}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-body text-sm transition-all"
            />
          </div>

          {/* Individual batting mode */}
          <div className="glass-dark rounded-2xl p-5 border border-white/10">
            <button
              type="button"
              onClick={() => setIndividualBattingMode((v) => !v)}
              className="w-full flex items-center justify-between gap-4"
            >
              <div className="flex-1 text-left">
                <p className="text-base font-display font-bold text-white">Individual batting (no non-striker)</p>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  One batsman faces every ball alone — no strike rotation, no partner. Useful for solo net sessions or 1v1 formats.
                </p>
              </div>
              {/* Toggle pill */}
              <div className={cn(
                'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200',
                individualBattingMode ? 'bg-amber-500' : 'bg-white/20'
              )}>
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                  individualBattingMode ? 'translate-x-5' : 'translate-x-0'
                )} />
              </div>
            </button>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold text-lg shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>Creating match…</span></>
            ) : (
              <><Trophy className="w-5 h-5" /><span>Start Scoring</span><ChevronRight className="w-5 h-5" /></>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
