"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Pure utility functions for ball-by-ball scoring logic.
 * No side effects — easy to unit test independently.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLegalDelivery = isLegalDelivery;
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
 * Strike rotates after a legal delivery if the runs scored off the bat are odd
 * AND it is not the last ball of the over (end-of-over rotation is handled separately).
 */
function shouldRotateStrike(runsScored, legal, isEndOfOver) {
    if (!legal)
        return false;
    if (isEndOfOver)
        return false; // end-of-over swap handled separately
    return runsScored % 2 === 1;
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
function calculateExtrasBreakdown(extraType, extraRuns) {
    const result = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
    if (!extraType)
        return result;
    switch (extraType) {
        case 'wide':
            result.wides = 1 + (extraRuns || 0); // 1 penalty + any additional
            break;
        case 'noball':
            result.noBalls = 1; // just the penalty run in the no-balls bucket
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
        // wide always adds at least 1; extraRuns represents total wide runs (already includes the 1)
        return (extraRuns > 0 ? extraRuns : 1);
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