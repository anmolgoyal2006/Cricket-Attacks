/**
 * Throwaway end-to-end check for the ball-recording fast path.
 * Plays real deliveries through the live HTTP API and asserts the scoreboard.
 */
const BASE = 'http://localhost:5000/api';

let token = '';
const j = async (path, opts = {}) => {
  const res = await fetch(BASE + path, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`);
  return data;
};

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { failures++; console.log(`  FAIL ${label}: got ${a}, want ${e}`); }
  else console.log(`  ok   ${label}: ${a}`);
}

(async () => {
  const uniq = process.argv[2];
  const reg = await j('/auth/register', {
    method: 'POST',
    body: { username: `perf${uniq}`, email: `perf${uniq}@t.com`, password: 'Passw0rd!23' },
  });
  token = reg.token;
  console.log('registered', reg.user.username);

  // 4 guests per side; normal mode => all out at 3 wickets
  const team = (p) => ({ name: p, players: [1, 2, 3, 4].map((n) => ({ guestName: `${p}${n}` })) });
  const { match } = await j('/scoring/matches', {
    method: 'POST',
    body: {
      teamA: team('A'), teamB: team('B'),
      oversFormat: 2, tossWonBy: 'teamA', tossDecision: 'bat',
    },
  });
  const id = match._id;
  await j(`/scoring/matches/${id}/start`, { method: 'PATCH' });
  console.log('match', id, 'started\n');

  const P = (t, n) => `guest:${t}${n}`;
  let striker = P('A', 1), nonStriker = P('A', 2), bowler = P('B', 1);
  const nextBat = [P('A', 3), P('A', 4)];

  const timings = [];
  async function ball(body, label) {
    const t0 = Date.now();
    const r = await j(`/scoring/matches/${id}/balls`, {
      method: 'POST',
      body: { batsmanOnStrikeId: striker, nonStrikerId: nonStriker, bowlerId: bowler, ...body },
    });
    timings.push(Date.now() - t0);
    const i = r.innings, f = r.flags;
    console.log(
      `${label.padEnd(22)} ${i.totalRuns}/${i.totalWickets} ` +
      `${i.oversCompleted}.${i.ballsInCurrentOver} ` +
      `extras=${JSON.stringify(i.extras)} ` +
      `${f.isEndOfOver ? 'EOO ' : ''}${f.needsNewBatsman ? 'NEWBAT ' : ''}` +
      `${f.inningsComplete ? 'INNCOMPLETE ' : ''}${f.matchComplete ? 'MATCHDONE ' : ''}`
    );
    if (f.strikeSwapped) [striker, nonStriker] = [nonStriker, striker];
    return r;
  }

  console.log('--- Over 1 ---');
  let r = await ball({ runsScored: 1 }, '1 run (rotate)');
  check('after 1 run', [r.innings.totalRuns, r.innings.ballsInCurrentOver], [1, 1]);
  check('strike rotated', r.flags.strikeSwapped, true);

  r = await ball({ runsScored: 4 }, '4 runs');
  check('after four', r.innings.totalRuns, 5);

  r = await ball({ extraType: 'wide', extraRuns: 0 }, 'wide');
  check('wide: runs', r.innings.totalRuns, 6);
  check('wide: wides bucket', r.innings.extras.wides, 1);
  check('wide: ball not counted', r.innings.ballsInCurrentOver, 2);

  r = await ball({ extraType: 'wide', extraRuns: 2 }, 'wide + 2 overthrow');
  check('wide+2: runs', r.innings.totalRuns, 9);
  check('wide+2: wides bucket', r.innings.extras.wides, 4);

  r = await ball({ extraType: 'noBall', runsScored: 3, extraRuns: 0 }, 'no-ball + 3 bat');
  check('nb: runs (1+3)', r.innings.totalRuns, 13);
  check('nb: noBalls bucket', r.innings.extras.noBalls, 1);
  check('nb: ball not counted', r.innings.ballsInCurrentOver, 2);
  check('nb: odd bat runs rotate', r.flags.strikeSwapped, false); // illegal delivery => no rotation

  r = await ball({ extraType: 'bye', extraRuns: 2 }, 'bye 2');
  check('bye: runs', r.innings.totalRuns, 15);
  check('bye: byes bucket', r.innings.extras.byes, 2);
  check('bye: legal ball', r.innings.ballsInCurrentOver, 3);

  r = await ball({ extraType: 'legBye', extraRuns: 1 }, 'leg-bye 1');
  check('legbye: runs', r.innings.totalRuns, 16);
  check('legbye: legByes bucket', r.innings.extras.legByes, 1);

  r = await ball({ runsScored: 0 }, 'dot');
  check('5 legal balls bowled', r.innings.ballsInCurrentOver, 5);

  // 6th legal ball -> over rollover
  r = await ball({ runsScored: 2 }, '2 runs (6th ball)');
  check('over rolled over', [r.innings.oversCompleted, r.innings.ballsInCurrentOver], [1, 0]);
  check('end-of-over flag', r.flags.isEndOfOver, true);
  check('EOO swaps strike', r.flags.strikeSwapped, true);
  check('runs after over 1', r.innings.totalRuns, 18);

  console.log('\n--- Over 2 (wickets) ---');
  bowler = P('B', 2);
  r = await ball({ isWicket: true, wicketType: 'bowled', dismissedPlayerId: striker }, 'WICKET bowled');
  check('wicket counted', r.innings.totalWickets, 1);
  check('needsNewBatsman', r.flags.needsNewBatsman, true);
  striker = nextBat.shift();

  r = await ball({ isWicket: true, wicketType: 'bowled', dismissedPlayerId: striker }, 'WICKET bowled');
  check('2 wickets', r.innings.totalWickets, 2);
  striker = nextBat.shift();

  // 3rd wicket = all out (4 players, N-1)
  r = await ball({ isWicket: true, wicketType: 'bowled', dismissedPlayerId: striker }, 'WICKET (all out)');
  check('3 wickets', r.innings.totalWickets, 3);
  check('innings complete', r.flags.inningsComplete, true);
  const target = r.innings.totalRuns + 1;
  console.log('  target =', target);

  console.log('\n--- Undo (reverses the all-out wicket) ---');
  const u = await j(`/scoring/matches/${id}/balls/last`, { method: 'DELETE' });
  check('undo: wickets back to 2', u.innings.totalWickets, 2);
  check('undo: match live again', u.matchStatus, 'live');

  console.log('\n--- Scorecard (derived fields) ---');
  const { stats } = await j(`/scoring/matches/${id}/stats`);
  const bat = stats.find((s) => s.guestName === 'A1');
  const bowl = stats.find((s) => s.guestName === 'B1');
  console.log('  A1 batting:', JSON.stringify(bat.battingStats));
  console.log('  B1 bowling:', JSON.stringify(bowl.bowlingStats));
  check('A1 strikeRate consistent',
    Math.round(bat.battingStats.strikeRate * 100) / 100,
    Math.round((bat.battingStats.runs / bat.battingStats.ballsFaced) * 10000) / 100);
  check('B1 oversBowled consistent',
    bowl.bowlingStats.oversBowled, bowl.bowlingStats.ballsBowled / 6);
  check('fieldingStats seeded', typeof bat.fieldingStats?.catches, 'number');

  // partial unique indexes: guests must never carry a null playerId
  const guestWithNullPlayer = stats.filter((s) => s.guestName && s.playerId != null);
  check('no guest doc has playerId', guestWithNullPlayer.length, 0);
  check('all stat docs are guests', stats.every((s) => !!s.guestName), true);

  const avg = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);
  console.log(`\nPOST /balls  n=${timings.length}  avg=${avg}ms  min=${Math.min(...timings)}ms  max=${Math.max(...timings)}ms`);
  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
