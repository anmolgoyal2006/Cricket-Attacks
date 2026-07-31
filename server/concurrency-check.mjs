/**
 * Throwaway concurrency check: fire N balls simultaneously and verify none are lost.
 * Before the fix, the absolute-value innings save clobbered concurrent increments.
 */
const BASE = 'http://localhost:5000/api';
let token = '';
const j = async (path, opts = {}) => {
  const res = await fetch(BASE + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`);
  return data;
};

(async () => {
  const uniq = process.argv[2];
  const N = 20;
  const reg = await j('/auth/register', {
    method: 'POST',
    body: { username: `conc${uniq}`, email: `conc${uniq}@t.com`, password: 'Passw0rd!23' },
  });
  token = reg.token;

  // 12 players/side so 6 concurrent wickets can't end the innings
  const team = (p) => ({ name: p, players: Array.from({ length: 12 }, (_, i) => ({ guestName: `${p}${i + 1}` })) });
  const { match } = await j('/scoring/matches', {
    method: 'POST',
    body: { teamA: team('A'), teamB: team('B'), oversFormat: 20, tossWonBy: 'teamA', tossDecision: 'bat' },
  });
  const id = match._id;
  await j(`/scoring/matches/${id}/start`, { method: 'PATCH' });

  // N simultaneous 1-run balls — each must add exactly 1 run and 1 legal ball
  const results = await Promise.allSettled(
    Array.from({ length: N }, () =>
      j(`/scoring/matches/${id}/balls`, {
        method: 'POST',
        body: {
          batsmanOnStrikeId: 'guest:A1', nonStrikerId: 'guest:A2',
          bowlerId: 'guest:B1', runsScored: 1,
        },
      })
    )
  );

  const ok = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((f) => console.log('  rejected:', f.reason.message.slice(0, 120)));

  const { match: after } = await j(`/scoring/matches/${id}`);
  const s = after.currentInningsSummary;
  const balls = s.oversCompleted * 6 + s.ballsInCurrentOver;

  console.log(`\n${N} concurrent balls -> ${ok} accepted, ${failed.length} rejected`);
  console.log(`scoreboard: ${s.totalRuns} runs, ${balls} legal balls`);

  const runsOk = s.totalRuns === ok;
  const ballsOk = balls === ok;
  console.log(`  runs match accepted count:  ${runsOk ? 'ok' : `FAIL (${s.totalRuns} != ${ok}) — RUNS LOST`}`);
  console.log(`  balls match accepted count: ${ballsOk ? 'ok' : `FAIL (${balls} != ${ok})`}`);
  console.log(runsOk && ballsOk ? '\nNO LOST UPDATES' : '\nLOST UPDATES DETECTED');
  process.exit(runsOk && ballsOk ? 0 : 1);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
