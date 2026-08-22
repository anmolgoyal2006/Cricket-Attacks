"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Pure utility functions for ball-by-ball scoring logic.
 * No side effects — easy to unit test independently.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLegalDelivery = isLegalDelivery;
exports.calculateRunsRun = calculateRunsRun;
exports.shouldRotateStrike = shouldRotateStrike;
exports.calculateOverBall = calculateOverBall;
exports.calculateExtrasBreakdown = calculateExtrasBreakdown;
exports.totalDeliveryRuns = totalDeliveryRuns;
/**
 * A delivery is illegal (does not count as a legal ball) if it is a wide or no-ball.
 */
function isLegalDelivery(extraType) {
    return extraType !== 'wide' && extraType !== 'noball';
}
/**
 * Total runs physically RUN by the batters during a delivery.
 * The automatic 1-run penalty for a wide or no-ball is NOT run between wickets,
 * so it never contributes here (and therefore never rotates strike).
 *
 *   wide   → extraRuns only (overthrow runs); the 1-run penalty is not run
 *   noball → bat runs + any additional field runs (batters ran them all)
 *   bye    → extraRuns (batters ran these)
 *   legbye → extraRuns (batters ran these)
 *   normal → runsScored
 */
function calculateRunsRun(runsScored, extraType, extraRuns) {
    switch (extraType) {
        case 'wide':
            return extraRuns || 0;
        case 'noball':
            return (runsScored || 0) + (extraRuns || 0);
        case 'bye':
        case 'legbye':
            return extraRuns || 0;
        default:
            return runsScored || 0;
    }
}
/**
 * Strike rotates whenever the batters completed an ODD number of runs during
 * the delivery AND it is not the last ball of the over (the end-of-over swap
 * handles that case separately).
 *
 * Real-cricket behaviour (fixed — previously illegal deliveries never rotated):
 *  - Odd BAT runs off a NO-BALL rotate strike (illegal delivery, but batters still ran).
 *  - Odd BYES / LEG-BYES rotate strike (runsScored is 0 there; batters ran extraRuns).
 *  - Wide/no-ball PENALTY runs never rotate strike on their own (nobody ran them).
 */
function shouldRotateStrike(runsRun, isEndOfOver) {
    if (isEndOfOver)
        return false; // end-of-over swap handled separately
    return (runsRun || 0) % 2 === 1;
}
/**
 * Given the previous ball's position, returns the next over + ballNumber.
 * ballNumber is the count of LEGAL deliveries in the current over (1–6).
 * Illegal deliveries do not advance ballNumber.
 *
 * Returns { over, ballNumber, isEndOfOver }
 *   isEndOfOver = true when the 6th legal ball of an over has just been bowled.
 */
function calculateOverBall(currentOver, currentBallsInOver, // 0-indexed count of legal balls bowled in current over
legal) {
    if (!legal) {
        // No advancement
        return {
            over: currentOver,
            ballsInCurrentOver: currentBallsInOver,
            oversCompleted: currentOver,
            isEndOfOver: false,
        };
    }
    const newBallsInOver = currentBallsInOver + 1;
    if (newBallsInOver >= 6) {
        // Over complete
        return {
            over: currentOver + 1,
            ballsInCurrentOver: 0,
            oversCompleted: currentOver + 1,
            isEndOfOver: true,
        };
    }
    return {
        over: currentOver,
        ballsInCurrentOver: newBallsInOver,
        oversCompleted: currentOver,
        isEndOfOver: false,
    };
}
/**
 * Returns which extras bucket to increment and by how much.
 * Cricket rules:
 *   wide   → 1 penalty run always + extraRuns (overthrows).
 *            wides bucket = 1 + extraRuns
 *   noball → 1 penalty run + runsScored (bat) + extraRuns (field).
 *            noBalls bucket = 1 (penalty only; bat runs go to totalRuns via runsScored)
 *   bye    → extraRuns (no bat runs, not charged to bowler)
 *   legbye → extraRuns (no bat runs, not charged to bowler)
 */
function calculateExtrasBreakdown(extraType, extraRuns, noballExtraKind) {
    const result = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
    if (!extraType)
        return result;
    switch (extraType) {
        case 'wide':
            result.wides = 1 + (extraRuns || 0);
            break;
        case 'noball':
            result.noBalls = 1;
            if (extraRuns && extraRuns > 0) {
                if (noballExtraKind === 'bye') {
                    result.byes = extraRuns;
                }
                else if (noballExtraKind === 'legbye') {
                    result.legByes = extraRuns;
                }
                else {
                    result.noBalls = 1 + extraRuns;
                }
            }
            break;
        case 'bye':
            result.byes = extraRuns || 0;
            break;
        case 'legbye':
            result.legByes = extraRuns || 0;
            break;
    }
    return result;
}
/**
 * Total runs added to the innings for a given delivery.
 * Cricket rules per extra type:
 *   wide  → 1 run (penalty) + any additional overthrow runs (extraRuns)
 *   noball → 1 run (penalty) + bat runs + any additional (extraRuns)
 *   bye/legbye → extraRuns only (bat runs don't count)
 *
 * NOTE: the 'penalty' run for wides/no-balls is already captured in
 * calculateExtrasBreakdown (wides = extraRuns||1, noBalls = 1+extraRuns).
 * So total innings runs = runsScored + sum(extrasBreakdown).
 * We use this simpler form: runsScored + extraRuns for bat+field runs,
 * but wides must add the base 1-run penalty when extraRuns === 0.
 */
function totalDeliveryRuns(runsScored, extraRuns, extraType) {
    if (extraType === 'wide') {
        return 1 + (extraRuns || 0);
    }
    if (extraType === 'noball') {
        // no-ball penalty (1) + bat runs + any additional field runs
        return 1 + (runsScored || 0) + (extraRuns || 0);
    }
    // bye / legbye: extraRuns are the runs (no bat runs count)
    // normal delivery: runsScored
    return (runsScored || 0) + (extraRuns || 0);
}
//# sourceMappingURL=scoringLogic.js.map