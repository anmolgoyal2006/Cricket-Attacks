"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Share2, Trophy, Loader2, Search } from 'lucide-react';
import { cardsApi } from '@/lib/api';

type Format = 'odi' | 'test' | 't20' | 'worldCup' | 'knockouts' | 'bilateral';

interface PlayerData {
  _id: string;
  name: string;
  role: string;
  country: string;
  batting: number;
  bowling: number;
  fielding: number;
  overall: number;
  specialty: string;
  rarity: string;
  image: string;
  formats: Record<string, {
    matches: number;
    runs: number;
    avg: number;
    sr: number;
    hundreds: number;
    fifties: number;
    wickets: number;
    economy: number;
  }>;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  image: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ComparePage() {
  const [allCards, setAllCards] = useState<Map<string, PlayerData>>(new Map());
  const [playerA, setPlayerA] = useState<PlayerData | null>(null);
  const [playerB, setPlayerB] = useState<PlayerData | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<Format>('odi');

  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [resultsA, setResultsA] = useState<SearchResult[]>([]);
  const [resultsB, setResultsB] = useState<SearchResult[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [showDropdownA, setShowDropdownA] = useState(false);
  const [showDropdownB, setShowDropdownB] = useState(false);

  const dropdownRefA = useRef<HTMLDivElement>(null);
  const dropdownRefB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardsApi.getAll({ limit: '100', sort: 'name' }).then(data => {
      const map = new Map<string, PlayerData>();
      (data.cards || []).forEach((card: PlayerData) => map.set(card.name.toLowerCase(), card));
      setAllCards(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchA.length < 2) { setResultsA([]); setShowDropdownA(false); return; }
    setLoadingA(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/cricbuzz/players/search?name=${encodeURIComponent(searchA)}`);
        const data = await res.json();
        if (data.success) { setResultsA(data.data); setShowDropdownA(true); }
      } catch { setResultsA([]); }
      setLoadingA(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchA]);

  useEffect(() => {
    if (searchB.length < 2) { setResultsB([]); setShowDropdownB(false); return; }
    setLoadingB(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/cricbuzz/players/search?name=${encodeURIComponent(searchB)}`);
        const data = await res.json();
        if (data.success) { setResultsB(data.data); setShowDropdownB(true); }
      } catch { setResultsB([]); }
      setLoadingB(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchB]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRefA.current && !dropdownRefA.current.contains(e.target as Node)) setShowDropdownA(false);
      if (dropdownRefB.current && !dropdownRefB.current.contains(e.target as Node)) setShowDropdownB(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectPlayer = (slot: 'A' | 'B', result: SearchResult) => {
    const card = allCards.get(result.name.toLowerCase()) || allCards.get(result.name.toLowerCase().split(' ').reverse().join(' '));
    const player: PlayerData = card || {
      _id: result.id,
      name: result.name,
      role: '',
      country: '',
      batting: 75, bowling: 70, fielding: 70, overall: 72,
      specialty: '', rarity: 'common', image: '',
      formats: {},
    };
    if (result.image) player.image = result.image;
    if (slot === 'A') {
      setPlayerA(player);
      setSearchA(result.name);
      setShowDropdownA(false);
    } else {
      setPlayerB(player);
      setSearchB(result.name);
      setShowDropdownB(false);
    }
  };

  const formats: { key: Format; label: string }[] = [
    { key: 'odi', label: 'ODI' },
    { key: 'test', label: 'Test' },
    { key: 't20', label: 'T20I' },
    { key: 'worldCup', label: 'World Cup' },
    { key: 'knockouts', label: 'Knockouts' },
    { key: 'bilateral', label: 'Bilateral' },
  ];

  // ── Scoring helpers ──────────────────────────────────────────────────────
  const isBatsman = (p: PlayerData) =>
    /batsman|wicketkeeper/i.test(p.role);
  const isBowler = (p: PlayerData) =>
    /bowler/i.test(p.role) && !/all.?round/i.test(p.role);

  /**
   * Format-specific batting weights:
   *   Test  → avg 80%,  SR  0%, 100s 20%   (SR irrelevant in Tests)
   *   ODI   → avg 55%, SR 20%, 100s 25%   (SR matters but avg leads)
   *   T20   → avg 25%, SR 55%, 100s 20%   (SR dominates in T20)
   *   rest  → avg 50%, SR 15%, 100s 35%   (knockouts / World Cup / bilateral)
   */
  const battingWeights: Record<string, { avgW: number; srW: number; tonW: number }> = {
    test:      { avgW: 80, srW:  0, tonW: 20 },
    odi:       { avgW: 55, srW: 20, tonW: 25 },
    t20:       { avgW: 25, srW: 55, tonW: 20 },
    worldCup:  { avgW: 50, srW: 15, tonW: 35 },
    knockouts: { avgW: 50, srW: 15, tonW: 35 },
    bilateral: { avgW: 55, srW: 20, tonW: 25 },
  };

  /**
   * Format-specific bowling weights:
   *   Test  → wickets 60%, bowling avg 30%, economy 10%  (wicket hauls matter most)
   *   ODI   → wickets 50%, economy    30%, bowling avg 20%
   *   T20   → wickets 35%, economy    50%, bowling avg 15%  (economy is king)
   *   rest  → wickets 50%, economy    30%, bowling avg 20%
   */
  const bowlingWeights: Record<string, { wktW: number; ecoW: number; bavgW: number }> = {
    test:      { wktW: 60, ecoW: 10, bavgW: 30 },
    odi:       { wktW: 50, ecoW: 30, bavgW: 20 },
    t20:       { wktW: 35, ecoW: 50, bavgW: 15 },
    worldCup:  { wktW: 50, ecoW: 30, bavgW: 20 },
    knockouts: { wktW: 50, ecoW: 30, bavgW: 20 },
    bilateral: { wktW: 50, ecoW: 30, bavgW: 20 },
  };

  /** Returns a 0-100 numeric score for a player in one format */
  const scoreInFormat = (player: PlayerData, fmt: string): number => {
    const s = player.formats[fmt];
    if (!s || s.matches === 0) return 0;

    if (isBatsman(player)) {
      const w = battingWeights[fmt] ?? battingWeights.odi;
      const avgScore = Math.min(s.avg, 80) / 80 * w.avgW;
      const srScore  = w.srW > 0 ? Math.min(s.sr, 180) / 180 * w.srW : 0;
      const tonScore = Math.min(s.hundreds, 50) / 50 * w.tonW;
      return avgScore + srScore + tonScore;
    }

    if (isBowler(player)) {
      const w = bowlingWeights[fmt] ?? bowlingWeights.odi;
      const wktScore  = Math.min(s.wickets, 400) / 400 * w.wktW;
      const ecoScore  = s.economy > 0 ? Math.max(0, (12 - s.economy) / 9) * w.ecoW : 0;
      const bavgScore = s.avg > 0     ? Math.max(0, (60 - s.avg) / 45)    * w.bavgW : 0;
      return wktScore + ecoScore + bavgScore;
    }

    // All-rounder: batting 60% + bowling 40% using same format weights
    const bw = battingWeights[fmt] ?? battingWeights.odi;
    const ew = bowlingWeights[fmt] ?? bowlingWeights.odi;
    const avgScore = Math.min(s.avg, 60) / 60 * (bw.avgW * 0.6 * 0.6);
    const srScore  = bw.srW > 0 ? Math.min(s.sr, 180) / 180 * (bw.srW * 0.6 * 0.6) : 0;
    const tonScore = Math.min(s.hundreds, 20) / 20 * (bw.tonW * 0.6 * 0.6);
    const wktScore = Math.min(s.wickets, 200) / 200 * (ew.wktW * 0.4 * 0.6);
    const ecoScore = s.economy > 0 ? Math.max(0, (12 - s.economy) / 9) * (ew.ecoW * 0.4 * 0.6) : 0;
    return avgScore + srScore + tonScore + wktScore + ecoScore;
  };

  /** Weighted total across ODI (40%) + Test (40%) + T20 (20%) */
  const overallScore = (player: PlayerData): number => {
    return scoreInFormat(player, 'odi')  * 0.4
         + scoreInFormat(player, 'test') * 0.4
         + scoreInFormat(player, 't20')  * 0.2;
  };

  const calculateWinner = () => {
    if (!playerA || !playerB) return null;

    const scoreA = overallScore(playerA);
    const scoreB = overallScore(playerB);

    // Per-format verdicts using the same scoring
    const fmtVerdict = (fmt: string) => {
      const sA = scoreInFormat(playerA, fmt);
      const sB = scoreInFormat(playerB, fmt);
      if (sA === 0 && sB === 0) return 'No data';
      return sA >= sB ? playerA.name : playerB.name;
    };

    // Determine winning reason
    const battingEdge = (p: PlayerData, opp: PlayerData, fmt: string) => {
      const s = p.formats[fmt]; const o = opp.formats[fmt];
      if (!s || !o) return false;
      return s.avg > o.avg && s.sr >= o.sr;
    };
    const bowlingEdge = (p: PlayerData, opp: PlayerData, fmt: string) => {
      const s = p.formats[fmt]; const o = opp.formats[fmt];
      if (!s || !o) return false;
      return s.wickets > o.wickets;
    };

    const winner = scoreA >= scoreB ? playerA : playerB;
    const loser  = scoreA >= scoreB ? playerB : playerA;
    const wScore = scoreA >= scoreB ? scoreA : scoreB;
    const lScore = scoreA >= scoreB ? scoreB : scoreA;
    const margin = wScore - lScore;
    const verdict = margin < 3
      ? 'Extremely close — virtually equal!'
      : margin < 10
      ? `${winner.name} edges it`
      : `${winner.name} clearly better`;

    return {
      winner, loser,
      scoreA: +scoreA.toFixed(1),
      scoreB: +scoreB.toFixed(1),
      margin: +margin.toFixed(1),
      verdict,
      fmtVerdicts: {
        odi:       fmtVerdict('odi'),
        test:      fmtVerdict('test'),
        t20:       fmtVerdict('t20'),
        worldCup:  fmtVerdict('worldCup'),
        knockouts: fmtVerdict('knockouts'),
      },
    };
  };

  const result = calculateWinner();

  const getComparison = (valueA: number, valueB: number, lowerIsBetter = false) => {
    if (lowerIsBetter) {
      // both zero means no data — treat as equal
      if (valueA === 0 && valueB === 0) return 'equal';
      if (valueA === 0) return 'worse';
      if (valueB === 0) return 'better';
      if (valueA < valueB) return 'better';
      if (valueB < valueA) return 'worse';
      return 'equal';
    }
    if (valueA > valueB) return 'better';
    if (valueB > valueA) return 'worse';
    return 'equal';
  };

  const renderStat = (label: string, valueA: number | string, valueB: number | string, lowerIsBetter = false) => {
    const isNumeric = typeof valueA === 'number' && typeof valueB === 'number';
    const comparison = isNumeric ? getComparison(valueA, valueB, lowerIsBetter) : 'equal';
    return (
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center py-3 border-b border-white/10 last:border-0">
        <div className={`text-right ${comparison === 'better' ? 'text-green-400 font-bold' : comparison === 'worse' ? 'text-gray-500' : 'text-white'}`}>
          <span className="text-lg font-display">{valueA}</span>
        </div>
        <div className="text-center min-w-[120px]">
          <span className="text-sm text-gray-400 font-body">{label}</span>
        </div>
        <div className={`text-left ${comparison === 'worse' ? 'text-green-400 font-bold' : comparison === 'better' ? 'text-gray-500' : 'text-white'}`}>
          <span className="text-lg font-display">{valueB}</span>
        </div>
      </div>
    );
  };

  const renderSearchSlot = (slot: 'A' | 'B') => {
    const isA = slot === 'A';
    const search = isA ? searchA : searchB;
    const results = isA ? resultsA : resultsB;
    const loading = isA ? loadingA : loadingB;
    const showDropdown = isA ? showDropdownA : showDropdownB;
    const ref = isA ? dropdownRefA : dropdownRefB;

    return (
      <div className="glass rounded-2xl p-6">
        <label className="block text-sm text-gray-400 font-body mb-2">Select Player {slot}</label>
        <div className="relative" ref={ref}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => {
                if (isA) setSearchA(e.target.value);
                else setSearchB(e.target.value);
              }}
              onFocus={() => { if (results.length > 0) { if (isA) setShowDropdownA(true); else setShowDropdownB(true); } }}
              placeholder="Search player..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-body text-lg"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 animate-spin" />
            )}
          </div>

          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 mt-2 w-full rounded-xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden">
              {results.map((r, i) => (
                <button
                  key={r.id + i}
                  onClick={() => selectPlayer(slot, r)}
                  className="w-full text-left px-4 py-3 flex items-center space-x-3 text-white hover:bg-white/10 transition-colors font-body border-b border-white/5 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const parent = img.parentElement!;
                        parent.classList.add('flex', 'items-center', 'justify-center', 'text-xs', 'text-gray-400');
                        if (!parent.querySelector('.initials-fallback')) {
                          const span = document.createElement('span');
                          span.className = 'initials-fallback';
                          span.textContent = r.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                          parent.appendChild(span);
                        }
                      }}
                    />
                  </div>
                  <span className="font-semibold">{r.name}</span>
                </button>
              ))}
            </div>
          )}

          {showDropdown && results.length === 0 && search.length >= 2 && !loading && (
            <div className="absolute z-50 mt-2 w-full rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-4 text-center text-gray-400 font-body text-sm">
              No players found
            </div>
          )}
        </div>

        {(isA ? playerA : playerB) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className={`flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br ${isA ? 'from-blue-500/20 to-blue-700/20 border-blue-500/30' : 'from-orange-500/20 to-orange-700/20 border-orange-500/30'} border`}>
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${isA ? 'from-blue-500 to-blue-700' : 'from-orange-500 to-orange-700'} flex items-center justify-center overflow-hidden`}>
                {(isA ? playerA : playerB)!.image ? (
                  <img
                    src={(isA ? playerA : playerB)!.image}
                    alt={(isA ? playerA : playerB)!.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {(isA ? playerA : playerB)!.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white">{(isA ? playerA : playerB)!.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isA ? 'bg-blue-500/30 text-blue-400' : 'bg-orange-500/30 text-orange-400'} font-body`}>
                    Overall: {(isA ? playerA : playerB)!.overall}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-6"
          >
            <Users className="w-4 h-4 text-purple-400 mr-2" />
            <span className="text-sm text-purple-400 font-body font-semibold">Player Comparison</span>
          </motion.div>
          <h1 className="text-5xl font-display font-black gradient-text mb-4">Compare Players</h1>
          <p className="text-xl text-gray-300 font-body">Settle cricket debates with data</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {renderSearchSlot('A')}
          {renderSearchSlot('B')}
        </div>

        {playerA && playerB && (
          <>
            <div className="glass rounded-2xl p-4 mb-8">
              <div className="flex flex-wrap gap-2">
                {formats.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFormat(key)}
                    className={`px-6 py-3 rounded-lg font-body font-semibold transition-all ${
                      selectedFormat === key
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-8 mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-white text-center mb-2">
                  {formats.find(f => f.key === selectedFormat)?.label} Statistics
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto" />
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-6 pb-4 border-b-2 border-white/20">
                  <div className="text-right">
                    <h3 className="text-xl font-display font-bold text-blue-400">{playerA.name}</h3>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-display font-bold text-orange-400">{playerB.name}</h3>
                  </div>
                </div>

                <div className="space-y-1">
                  {renderStat('Matches',     playerA.formats[selectedFormat]?.matches || 0,   playerB.formats[selectedFormat]?.matches || 0)}
                  {renderStat('Runs',        (playerA.formats[selectedFormat]?.runs || 0).toLocaleString(), (playerB.formats[selectedFormat]?.runs || 0).toLocaleString())}
                  {renderStat('Average ★',   +(playerA.formats[selectedFormat]?.avg || 0).toFixed(2),       +(playerB.formats[selectedFormat]?.avg || 0).toFixed(2))}
                  {renderStat('Strike Rate', +(playerA.formats[selectedFormat]?.sr || 0).toFixed(2),        +(playerB.formats[selectedFormat]?.sr || 0).toFixed(2))}
                  {renderStat('100s / 50s',  `${playerA.formats[selectedFormat]?.hundreds || 0} / ${playerA.formats[selectedFormat]?.fifties || 0}`, `${playerB.formats[selectedFormat]?.hundreds || 0} / ${playerB.formats[selectedFormat]?.fifties || 0}`)}
                  {renderStat('Wickets ★',   playerA.formats[selectedFormat]?.wickets || 0,                 playerB.formats[selectedFormat]?.wickets || 0)}
                  {renderStat('Economy ★',   +(playerA.formats[selectedFormat]?.economy || 0).toFixed(2),   +(playerB.formats[selectedFormat]?.economy || 0).toFixed(2), true)}
                  {renderStat('Best Score',  playerA.formats[selectedFormat]?.bestScore || '—',             playerB.formats[selectedFormat]?.bestScore || '—')}
                </div>

                {/* Format scoring bar */}
                {(() => {
                  const sA = scoreInFormat(playerA, selectedFormat);
                  const sB = scoreInFormat(playerB, selectedFormat);
                  const total = sA + sB;
                  const pctA = total > 0 ? (sA / total) * 100 : 50;
                  const isBowlerMatch = /bowler/i.test(playerA.role) || /bowler/i.test(playerB.role);
                  const weightLabel = isBowlerMatch
                    ? selectedFormat === 'test' ? '★ Test bowling: Wickets 60% · Avg 30% · Eco 10%'
                      : selectedFormat === 't20' ? '★ T20 bowling: Economy 50% · Wickets 35% · Avg 15%'
                      : '★ ODI bowling: Wickets 50% · Economy 30% · Avg 20%'
                    : selectedFormat === 'test' ? '★ Test batting: Average 80% · 100s 20% (SR not counted)'
                      : selectedFormat === 't20' ? '★ T20 batting: Strike Rate 55% · Average 25% · 100s 20%'
                      : '★ ODI batting: Average 55% · 100s 25% · Strike Rate 20%';
                  return (
                    <div className="mt-6 pt-5 border-t border-white/10">
                      <p className="text-xs text-gray-500 font-body text-center mb-2">
                        {weightLabel}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-400 font-display font-bold text-sm w-10 text-right">{sA.toFixed(1)}</span>
                        <div className="flex-1 h-4 rounded-full bg-white/10 overflow-hidden flex">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pctA}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                          />
                          <div className="h-full flex-1 bg-gradient-to-r from-orange-400 to-orange-600" />
                        </div>
                        <span className="text-orange-400 font-display font-bold text-sm w-10">{sB.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500 font-body px-14">
                        <span>{playerA.name.split(' ').pop()}</span>
                        <span>{playerB.name.split(' ').pop()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-8 mb-8"
              >
                <div className="text-center mb-8">
                  <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-display font-black text-white mb-2">Final Verdict</h2>
                  <p className="text-gray-400 font-body text-sm mt-1">{result.verdict}</p>
                  <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mx-auto mt-3" />
                </div>

                <div className="max-w-2xl mx-auto space-y-3">
                  {/* Format verdicts */}
                  {[
                    { key: 'odi',       label: 'ODIs',       color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30',     text: 'text-blue-400' },
                    { key: 'test',      label: 'Tests',      color: 'from-purple-500/10 to-blue-500/10 border-purple-500/30', text: 'text-purple-400' },
                    { key: 't20',       label: 'T20Is',      color: 'from-green-500/10 to-emerald-500/10 border-green-500/30', text: 'text-green-400' },
                    { key: 'worldCup',  label: 'World Cup',  color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/30', text: 'text-amber-400' },
                    { key: 'knockouts', label: 'Knockouts',  color: 'from-orange-500/10 to-red-500/10 border-orange-500/30',  text: 'text-orange-400' },
                  ].map(({ key, label, color, text }) => {
                    const v = result.fmtVerdicts[key as keyof typeof result.fmtVerdicts];
                    const hasData = v !== 'No data';
                    return (
                      <div key={key} className={`p-3 rounded-xl bg-gradient-to-r ${color} border flex items-center justify-between`}>
                        <span className="text-gray-400 font-body text-sm">{label}</span>
                        <span className={`font-display font-bold text-sm ${hasData ? text : 'text-gray-600'}`}>
                          {hasData ? `${v} better` : '— No data —'}
                        </span>
                      </div>
                    );
                  })}

                  {/* Overall score bar */}
                  <div className="pt-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-blue-400 font-display font-bold text-sm w-10 text-right">{result.scoreA}</span>
                      <div className="flex-1 h-5 rounded-full bg-white/10 overflow-hidden flex">
                        {(() => {
                          const total = result.scoreA + result.scoreB;
                          const pctA = total > 0 ? (result.scoreA / total) * 100 : 50;
                          return (
                            <>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pctA}%` }}
                                transition={{ duration: 0.9, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                              />
                              <div className="h-full flex-1 bg-gradient-to-r from-orange-400 to-orange-600" />
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-orange-400 font-display font-bold text-sm w-10">{result.scoreB}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-body px-14">
                      <span>{playerA!.name.split(' ').pop()}</span>
                      <span className="text-gray-600 text-[10px]">Weighted ODI·40% + Test·40% + T20·20%</span>
                      <span>{playerB!.name.split(' ').pop()}</span>
                    </div>
                  </div>

                  {/* Winner card */}
                  <div className="mt-4 p-6 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-600/20 border-2 border-amber-500/50 text-center">
                    <p className="text-gray-300 font-body text-sm mb-1">Overall Winner</p>
                    <h3 className="text-3xl font-display font-black text-amber-400 mb-1">{result.winner.name}</h3>
                    <p className="text-sm text-gray-400 font-body">Score: {result.scoreA} vs {result.scoreB} · Margin: {result.margin} pts</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}