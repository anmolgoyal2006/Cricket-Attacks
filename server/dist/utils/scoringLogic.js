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
 *   wide  → wide runs (extraRuns) count, no bat runs
 *   noball → no-ball run (1) + any runs scored off the bat also count
 *   bye   → bye runs (extraRuns) count
 *   legbye → leg-bye runs (extraRuns) count
 */
function calculateExtrasBreakdown(extraType, extraRuns) {
    const result = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
    if (!extraType)
        return result;
    switch (extraType) {
        case 'wide':
            result.wides = extraRuns || 1;
            break;
        case 'noball':
            result.noBalls = 1 + (extraRuns || 0); // 1 penalty + any additional
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
 * = runsScored (bat runs) + extraRuns
 * Note: for a wide, bat runs are 0 by convention.
 */
function totalDeliveryRuns(runsScored, extraRuns) {
    return (runsScored || 0) + (extraRuns || 0);
}
//# sourceMappingURL=scoringLogic.js.map