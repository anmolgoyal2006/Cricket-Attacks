/**
 * Cricket Scoring Feature — Phase 5
 * Client-side commentary text generator.
 * Produces a short human-readable string for each ball event.
 * Designed to be easily extended with richer templates later.
 */

import { BallRecord } from './scoringApi';

const RUN_LINES: Record<number, string[]> = {
  0: ['Dot ball.', 'Defended solidly.', 'Good length delivery, no run.'],
  1: ['Pushed for a single.', 'Quick single taken.', 'Rotates the strike.'],
  2: ['Running hard, two taken.', 'Good running — two runs!', 'Placed well, two more.'],
  3: ['Three runs! Fine placement.', 'Well-run three.'],
  4: ['FOUR! Cracked through the covers.', 'FOUR! Elegant drive.', 'FOUR! Cuts away.', 'BOUNDARY! Beautifully timed.'],
  5: ['Five runs — overthrows add up.'],
  6: ['SIX! Launched into the stands.', 'SIX! Massive hit!', 'MAXIMUM! Over the rope.'],
};

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Resolve the display name for a player field — handles both registered and guest */
function playerName(
  ref: { username?: string } | null | undefined,
  guestFallback: string | null | undefined,
  defaultName: string
): string {
  return ref?.username ?? guestFallback ?? defaultName;
}

export function generateCommentary(ball: BallRecord): string {
  const batter = playerName(ball.batsmanOnStrikeId as { username?: string } | null, ball.guestBatsman, 'Batsman');
  const bowler = playerName(ball.bowlerId as { username?: string } | null, ball.guestBowler, 'Bowler');

  if (ball.isWicket) {
    const dismissed = playerName(
      ball.dismissedPlayerId as { username?: string } | null,
      ball.guestDismissed,
      batter
    );
    const fielder = playerName(ball.fielderId as { username?: string } | null, ball.guestFielder, undefined as unknown as string);
    const type = ball.wicketType ?? 'out';
    switch (type) {
      case 'bowled':    return `OUT! ${dismissed} is bowled by ${bowler}!`;
      case 'caught':    return `CAUGHT! ${dismissed} caught${fielder ? ` by ${fielder}` : ''} off ${bowler}.`;
      case 'lbw':       return `LBW! ${dismissed} trapped in front by ${bowler}.`;
      case 'runout':    return `RUN OUT! ${dismissed} is short of the crease!`;
      case 'stumped':   return `STUMPED! ${dismissed} is stumped${fielder ? ` by ${fielder}` : ''}.`;
      case 'hitwicket': return `HIT WICKET! ${dismissed} hits his own stumps.`;
      default:          return `WICKET! ${dismissed} is out — ${type}.`;
    }
  }

  const extraType = ball.extraType?.toLowerCase();
  if (extraType === 'wide') {
    return `Wide ball. ${ball.extraRuns > 1 ? `+${ball.extraRuns} runs.` : '+1.'}`;
  }
  if (extraType === 'noball' || extraType === 'noBall') {
    return `No ball from ${bowler}!${ball.runsScored > 0 ? ` ${ball.runsScored} off the bat as well.` : ''}`;
  }
  if (extraType === 'bye') {
    return `Bye${ball.extraRuns > 1 ? ` — ${ball.extraRuns} byes` : ''}.`;
  }
  if (extraType === 'legbye' || extraType === 'legBye') {
    return `Leg bye${ball.extraRuns > 1 ? ` — ${ball.extraRuns} runs` : ''}.`;
  }

  const lines = RUN_LINES[ball.runsScored] ?? [`${ball.runsScored} runs.`];
  return pick(lines);
}

/** Short label for over-pill display, e.g. "W", "4", "·", "Wd" */
export function ballPillLabel(ball: BallRecord): string {
  if (ball.isWicket) return 'W';
  const et = ball.extraType?.toLowerCase();
  if (et === 'wide') return 'Wd';
  if (et === 'noball' || et === 'noBall') return 'Nb';
  if (et === 'bye') return 'B';
  if (et === 'legbye' || et === 'legBye') return 'Lb';
  return ball.runsScored === 0 ? '·' : String(ball.runsScored);
}

/** Tailwind classes for a ball pill based on its type */
export function ballPillClass(ball: BallRecord): string {
  if (ball.isWicket)
    return 'bg-red-500/30 border-red-500/60 text-red-300';
  const et = ball.extraType?.toLowerCase();
  if (et === 'wide' || et === 'noball' || et === 'noBall')
    return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
  if (et === 'bye' || et === 'legbye' || et === 'legBye')
    return 'bg-blue-500/15 border-blue-500/30 text-blue-300';
  if (ball.runsScored === 4) return 'bg-blue-500/25 border-blue-500/50 text-blue-300';
  if (ball.runsScored === 6) return 'bg-purple-500/25 border-purple-500/50 text-purple-300';
  if (ball.runsScored === 0) return 'bg-white/5 border-white/15 text-gray-500';
  return 'bg-green-500/20 border-green-500/40 text-green-300';
}
