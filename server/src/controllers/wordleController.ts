import { Request, Response, NextFunction } from 'express';
import Player from '../models/Player';
import { AuthRequest } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';

// ---------------------------------------------------------------------------
// Static enrichment: cricket-knowledge fields keyed by player name (lowercase)
// These supplement DB records that may not have the new fields yet
// ---------------------------------------------------------------------------
const ENRICHMENT: Record<string, {
  battingHand: string;
  bowlingStyle: string;
  iplTeam: string;
  debutYear: number;
  age: number;
}> = {
  'virat kohli':        { battingHand: 'Right-handed', bowlingStyle: 'Medium',        iplTeam: 'RCB',        debutYear: 2008, age: 35 },
  'rohit sharma':       { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'MI',         debutYear: 2007, age: 36 },
  'ms dhoni':           { battingHand: 'Right-handed', bowlingStyle: 'Medium',         iplTeam: 'CSK',        debutYear: 2004, age: 42 },
  'sachin tendulkar':   { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'MI',         debutYear: 1989, age: 51 },
  'sourav ganguly':     { battingHand: 'Left-handed',  bowlingStyle: 'Medium',         iplTeam: 'N/A',        debutYear: 1992, age: 51 },
  'rahul dravid':       { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'N/A',        debutYear: 1996, age: 51 },
  'virender sehwag':    { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'DD',         debutYear: 1999, age: 45 },
  'yuvraj singh':       { battingHand: 'Left-handed',  bowlingStyle: 'Left-arm Spin',  iplTeam: 'PBKS',       debutYear: 2000, age: 42 },
  'harbhajan singh':    { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'MI',         debutYear: 1998, age: 43 },
  'zaheer khan':        { battingHand: 'Left-handed',  bowlingStyle: 'Left-arm Fast',  iplTeam: 'DD',         debutYear: 2000, age: 45 },
  'anil kumble':        { battingHand: 'Right-handed', bowlingStyle: 'Leg Spin',       iplTeam: 'RCB',        debutYear: 1990, age: 53 },
  'kapil dev':          { battingHand: 'Right-handed', bowlingStyle: 'Fast-medium',    iplTeam: 'N/A',        debutYear: 1978, age: 65 },
  'jasprit bumrah':     { battingHand: 'Right-handed', bowlingStyle: 'Fast',           iplTeam: 'MI',         debutYear: 2016, age: 30 },
  'ravindra jadeja':    { battingHand: 'Left-handed',  bowlingStyle: 'Left-arm Spin',  iplTeam: 'CSK',        debutYear: 2009, age: 35 },
  'r ashwin':           { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'CSK',        debutYear: 2010, age: 37 },
  'shubman gill':       { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'GT',         debutYear: 2019, age: 24 },
  'hardik pandya':      { battingHand: 'Right-handed', bowlingStyle: 'Fast-medium',    iplTeam: 'MI',         debutYear: 2016, age: 30 },
  'kl rahul':           { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'LSG',        debutYear: 2014, age: 32 },
  // Pakistan
  'babar azam':         { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'N/A',        debutYear: 2015, age: 29 },
  'shaheen afridi':     { battingHand: 'Left-handed',  bowlingStyle: 'Left-arm Fast',  iplTeam: 'N/A',        debutYear: 2018, age: 24 },
  'wasim akram':        { battingHand: 'Left-handed',  bowlingStyle: 'Left-arm Fast',  iplTeam: 'N/A',        debutYear: 1984, age: 57 },
  'waqar younis':       { battingHand: 'Right-handed', bowlingStyle: 'Fast',           iplTeam: 'N/A',        debutYear: 1989, age: 52 },
  'shoaib akhtar':      { battingHand: 'Right-handed', bowlingStyle: 'Fast',           iplTeam: 'N/A',        debutYear: 1997, age: 48 },
  'imran khan':         { battingHand: 'Right-handed', bowlingStyle: 'Fast-medium',    iplTeam: 'N/A',        debutYear: 1971, age: 71 },
  'shahid afridi':      { battingHand: 'Right-handed', bowlingStyle: 'Leg Spin',       iplTeam: 'N/A',        debutYear: 1996, age: 43 },
  'inzamam-ul-haq':     { battingHand: 'Right-handed', bowlingStyle: 'Medium',         iplTeam: 'N/A',        debutYear: 1991, age: 54 },
  // Australia
  'ricky ponting':      { battingHand: 'Right-handed', bowlingStyle: 'Medium',         iplTeam: 'N/A',        debutYear: 1995, age: 49 },
  'steve waugh':        { battingHand: 'Right-handed', bowlingStyle: 'Medium',         iplTeam: 'N/A',        debutYear: 1985, age: 59 },
  'adam gilchrist':     { battingHand: 'Left-handed',  bowlingStyle: 'Off Spin',       iplTeam: 'PBKS',       debutYear: 1996, age: 52 },
  'glenn mcgrath':      { battingHand: 'Right-handed', bowlingStyle: 'Fast-medium',    iplTeam: 'N/A',        debutYear: 1993, age: 54 },
  'shane warne':        { battingHand: 'Right-handed', bowlingStyle: 'Leg Spin',       iplTeam: 'N/A',        debutYear: 1992, age: 54 },
  'steve smith':        { battingHand: 'Right-handed', bowlingStyle: 'Leg Spin',       iplTeam: 'RR',         debutYear: 2010, age: 35 },
  'david warner':       { battingHand: 'Left-handed',  bowlingStyle: 'Off Spin',       iplTeam: 'SRH',        debutYear: 2009, age: 37 },
  'pat cummins':        { battingHand: 'Right-handed', bowlingStyle: 'Fast',           iplTeam: 'KKR',        debutYear: 2011, age: 31 },
  'mitchell starc':     { battingHand: 'Left-handed',  bowlingStyle: 'Left-arm Fast',  iplTeam: 'KKR',        debutYear: 2010, age: 34 },
  // England
  'joe root':           { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'N/A',        debutYear: 2012, age: 33 },
  'ben stokes':         { battingHand: 'Left-handed',  bowlingStyle: 'Fast-medium',    iplTeam: 'RR',         debutYear: 2011, age: 33 },
  'james anderson':     { battingHand: 'Right-handed', bowlingStyle: 'Fast-medium',    iplTeam: 'N/A',        debutYear: 2003, age: 41 },
  'kevin pietersen':    { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'RCB',        debutYear: 2004, age: 44 },
  'andrew flintoff':    { battingHand: 'Right-handed', bowlingStyle: 'Fast-medium',    iplTeam: 'CSK',        debutYear: 1998, age: 46 },
  // West Indies
  'brian lara':         { battingHand: 'Left-handed',  bowlingStyle: 'Leg Spin',       iplTeam: 'N/A',        debutYear: 1990, age: 55 },
  'chris gayle':        { battingHand: 'Left-handed',  bowlingStyle: 'Off Spin',       iplTeam: 'PBKS',       debutYear: 1999, age: 44 },
  'curtly ambrose':     { battingHand: 'Right-handed', bowlingStyle: 'Fast',           iplTeam: 'N/A',        debutYear: 1988, age: 60 },
  // South Africa
  'ab de villiers':     { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'RCB',        debutYear: 2004, age: 40 },
  'dale steyn':         { battingHand: 'Right-handed', bowlingStyle: 'Fast',           iplTeam: 'RCB',        debutYear: 2004, age: 41 },
  'jacques kallis':     { battingHand: 'Right-handed', bowlingStyle: 'Fast-medium',    iplTeam: 'KKR',        debutYear: 1995, age: 48 },
  'hashim amla':        { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'N/A',        debutYear: 2004, age: 41 },
  // New Zealand
  'kane williamson':    { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'GT',         debutYear: 2010, age: 33 },
  'brendon mccullum':   { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'KKR',        debutYear: 2002, age: 42 },
  'ross taylor':        { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'N/A',        debutYear: 2006, age: 40 },
  // Sri Lanka
  'kumar sangakkara':   { battingHand: 'Left-handed',  bowlingStyle: 'Left-arm Spin',  iplTeam: 'CSK',        debutYear: 2000, age: 46 },
  'mahela jayawardene': { battingHand: 'Right-handed', bowlingStyle: 'Off Spin',       iplTeam: 'MI',         debutYear: 1997, age: 47 },
  'muttiah muralitharan':{ battingHand: 'Right-handed', bowlingStyle: 'Off Spin',      iplTeam: 'CSK',        debutYear: 1992, age: 52 },
  'lasith malinga':     { battingHand: 'Right-handed', bowlingStyle: 'Fast-medium',    iplTeam: 'MI',         debutYear: 2004, age: 40 },
  // Bangladesh
  'shakib al hasan':    { battingHand: 'Left-handed',  bowlingStyle: 'Left-arm Spin',  iplTeam: 'KKR',        debutYear: 2006, age: 37 },
};

// Debut era bucket
function debutEra(year: number): string {
  if (year < 2000) return 'Pre-2000s';
  if (year < 2010) return '2000s';
  if (year < 2020) return '2010s';
  return '2020s';
}

// Age bucket
function ageBucket(age: number): string {
  if (age < 25) return 'Under 25';
  if (age < 30) return '25–29';
  if (age < 35) return '30–34';
  if (age < 40) return '35–39';
  return '40+';
}

// Deterministic daily index
function getDailyIndex(total: number): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  let hash = seed;
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = (hash >>> 16) ^ hash;
  return Math.abs(hash) % total;
}

function getTodayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Merge DB player with enrichment
function enrichPlayer(player: any) {
  const key = player.name.toLowerCase().trim();
  const extra = ENRICHMENT[key] || {};
  return {
    ...player,
    battingHand: player.battingHand || extra.battingHand || 'Right-handed',
    bowlingStyle: player.bowlingStyle || extra.bowlingStyle || 'Medium',
    iplTeam: player.iplTeam || extra.iplTeam || 'N/A',
    debutYear: player.debutYear || extra.debutYear || 2000,
    age: player.age || extra.age || 30,
  };
}

// Build the 7 progressive clues — ordered from broad → specific
function buildClues(player: any) {
  const p = enrichPlayer(player);
  return [
    { id: 1,  category: 'country',     label: 'Country',       value: p.country,             emoji: '🌍', type: 'text' },
    { id: 2,  category: 'role',        label: 'Role',          value: p.role,                emoji: '🏏', type: 'text' },
    { id: 3,  category: 'battingHand', label: 'Batting Hand',  value: p.battingHand,          emoji: '🖐️', type: 'text' },
    { id: 4,  category: 'bowlingStyle',label: 'Bowling Style', value: p.bowlingStyle,         emoji: '🎳', type: 'text' },
    { id: 5,  category: 'iplTeam',     label: 'IPL Team',      value: p.iplTeam,              emoji: '🏟️', type: 'text' },
    { id: 6,  category: 'debutEra',    label: 'Debut Era',     value: debutEra(p.debutYear),  emoji: '📅', type: 'text' },
    { id: 7,  category: 'specialty',   label: 'Specialty',     value: p.specialty,            emoji: '⚡', type: 'text' },
  ];
}

// Compare two values for a hint
function compareField(
  field: string,
  guessVal: any,
  targetVal: any
): { value: any; match: string; arrow?: string } {
  // Numeric comparisons
  if (field === 'age') {
    const g = Number(guessVal), t = Number(targetVal);
    if (g === t) return { value: guessVal, match: 'correct' };
    if (Math.abs(g - t) <= 3) return { value: guessVal, match: 'close' };
    return { value: guessVal, match: g > t ? 'lower' : 'higher' };
  }
  if (field === 'debutYear') {
    const g = Number(guessVal), t = Number(targetVal);
    if (g === t) return { value: debutEra(g), match: 'correct' };
    if (debutEra(g) === debutEra(t)) return { value: debutEra(g), match: 'correct' };
    return { value: debutEra(g), match: g > t ? 'lower' : 'higher' };
  }
  if (['batting', 'bowling', 'overall'].includes(field)) {
    const g = Number(guessVal), t = Number(targetVal);
    if (g === t) return { value: g, match: 'correct' };
    if (Math.abs(g - t) <= 8) return { value: g, match: 'close' };
    return { value: g, match: g > t ? 'lower' : 'higher' };
  }
  // Text comparisons
  const gStr = String(guessVal || '').toLowerCase().trim();
  const tStr = String(targetVal || '').toLowerCase().trim();
  if (gStr === tStr) return { value: guessVal, match: 'correct' };
  // Partial match for bowling style (e.g. both spinners)
  if (field === 'bowlingStyle') {
    const spinTypes = ['off spin', 'leg spin', 'left-arm spin'];
    const fastTypes = ['fast', 'fast-medium', 'left-arm fast', 'medium-fast', 'medium'];
    const gSpin = spinTypes.some(s => gStr.includes(s.split(' ')[0]));
    const tSpin = spinTypes.some(s => tStr.includes(s.split(' ')[0]));
    if (gSpin && tSpin) return { value: guessVal, match: 'close' };
    if (!gSpin && !tSpin) return { value: guessVal, match: 'close' };
  }
  return { value: guessVal, match: 'wrong' };
}

// GET /api/wordle/daily
export async function getDailyWordle(req: Request, res: Response, next: NextFunction) {
  try {
    const allPlayers = await Player.find({}).sort({ _id: 1 }).lean();
    const total = allPlayers.length;
    if (total === 0) return res.status(404).json({ error: 'No players found' });

    const idx = getDailyIndex(total);
    const dailyPlayer = allPlayers[idx % total];
    const clues = buildClues(dailyPlayer);
    const playerNames = allPlayers.map((p) => p.name);

    res.json({
      date: getTodayKey(),
      clues,
      playerNames,
      totalClues: clues.length,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/wordle/guess  — { guess: string, guessNumber: number }
export async function submitWordleGuess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { guess, guessNumber } = req.body;

    if (!guess || typeof guess !== 'string') throw new BadRequestError('guess is required');
    if (!guessNumber || guessNumber < 1 || guessNumber > 6) throw new BadRequestError('guessNumber must be 1–6');

    const allFull = await Player.find({}).sort({ _id: 1 }).lean();
    const total = allFull.length;
    if (total === 0) return res.status(404).json({ error: 'No players found' });

    const idx = getDailyIndex(total);
    const rawTarget = allFull[idx % total];
    const target = enrichPlayer(rawTarget);

    const isCorrect = target.name.toLowerCase().trim() === guess.toLowerCase().trim();
    const isLastGuess = guessNumber >= 6;

    const rawGuessed = allFull.find(
      (p) => p.name.toLowerCase().trim() === guess.toLowerCase().trim()
    );
    const guessed = rawGuessed ? enrichPlayer(rawGuessed) : null;

    let hintRow: Record<string, any> = {};
    if (guessed) {
      hintRow = {
        country:      compareField('country',     guessed.country,      target.country),
        role:         compareField('role',         guessed.role,         target.role),
        battingHand:  compareField('battingHand',  guessed.battingHand,  target.battingHand),
        bowlingStyle: compareField('bowlingStyle', guessed.bowlingStyle, target.bowlingStyle),
        iplTeam:      compareField('iplTeam',      guessed.iplTeam,      target.iplTeam),
        debutYear:    compareField('debutYear',    guessed.debutYear,    target.debutYear),
        specialty:    compareField('specialty',    guessed.specialty,    target.specialty),
      };
    }

    const response: any = {
      isCorrect,
      guessNumber,
      hintRow: guessed ? hintRow : null,
      playerFound: !!guessed,
    };

    if (isCorrect || isLastGuess) {
      response.answer = {
        name:        target.name,
        country:     target.country,
        role:        target.role,
        battingHand: target.battingHand,
        bowlingStyle:target.bowlingStyle,
        iplTeam:     target.iplTeam,
        debutEra:    debutEra(target.debutYear),
        specialty:   target.specialty,
        overall:     target.overall,
        image:       target.image,
        rarity:      target.rarity,
      };
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
}

// GET /api/wordle/face-reveal  — daily player for face reveal mode
export async function getDailyFaceReveal(req: Request, res: Response, next: NextFunction) {
  try {
    const allFull = await Player.find({}).sort({ _id: 1 }).lean();
    const total = allFull.length;
    if (total === 0) return res.status(404).json({ error: 'No players found' });

    // Use next day's index so face reveal has a different player than wordle
    const today = new Date();
    const seed = (today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()) + 1337;
    let hash = seed;
    hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
    hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
    hash = (hash >>> 16) ^ hash;
    const idx = Math.abs(hash) % total;
    const player = enrichPlayer(allFull[idx]);

    // Progressive hints (revealed after each wrong guess)
    const hints = [
      { id: 1, label: 'Country',     value: player.country,             emoji: '🌍' },
      { id: 2, label: 'Role',        value: player.role,                emoji: '🏏' },
      { id: 3, label: 'IPL Team',    value: player.iplTeam,             emoji: '🏟️' },
      { id: 4, label: 'Debut Era',   value: debutEra(player.debutYear), emoji: '📅' },
      { id: 5, label: 'Specialty',   value: player.specialty,           emoji: '⚡' },
    ];

    res.json({
      date: getTodayKey(),
      image: player.image,
      playerNames: allFull.map(p => p.name),
      hints,
      totalHints: hints.length,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/wordle/face-reveal/guess
export async function submitFaceRevealGuess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { guess, guessNumber, difficulty } = req.body;
    if (!guess || typeof guess !== 'string') throw new BadRequestError('guess is required');

    const allFull = await Player.find({}).sort({ _id: 1 }).lean();
    const total = allFull.length;
    if (total === 0) return res.status(404).json({ error: 'No players found' });

    const today = new Date();
    const seed = (today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()) + 1337;
    let hash = seed;
    hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
    hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
    hash = (hash >>> 16) ^ hash;
    const idx = Math.abs(hash) % total;
    const target = enrichPlayer(allFull[idx]);

    const isCorrect = target.name.toLowerCase().trim() === guess.toLowerCase().trim();

    // Points by difficulty
    const POINTS: Record<string, number> = { easy: 5, medium: 10, hard: 20, expert: 40 };
    const pointsEarned = isCorrect ? (POINTS[difficulty] || 10) : 0;

    const response: any = { isCorrect, pointsEarned };
    if (isCorrect || guessNumber >= 5) {
      response.answer = {
        name:     target.name,
        country:  target.country,
        role:     target.role,
        iplTeam:  target.iplTeam,
        specialty:target.specialty,
        image:    target.image,
      };
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
}
