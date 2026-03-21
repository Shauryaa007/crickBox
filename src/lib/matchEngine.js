/**
 * matchEngine.js — Pure functions for cricket match state transitions.
 * This is the heart of the scoring system.
 *
 * State shape:
 * {
 *   runs, wickets, balls, totalOvers,
 *   currentBatsmanId, nonStrikerId, currentBowlerId,
 *   isPowerplay, innings,
 *   battingStats: { [playerId]: { runs, balls, fours, sixes, isOut, dismissalType } },
 *   bowlingStats: { [playerId]: { overs, balls, runs, wickets, noBalls, wides } },
 *   currentOverBalls: [],  // array of ball results for display
 *   teamAPlayerIds: [], teamBPlayerIds: [],
 *   battingTeam: 'A' | 'B',
 *   target: null | number,  // set after first innings
 *   matchStatus: 'live' | 'innings_break' | 'completed',
 *   result: null | string,
 * }
 */

export const ACTION_TYPES = {
    RUN: 'RUN',
    WICKET: 'WICKET',
    NO_BALL: 'NO_BALL',
    WIDE: 'WIDE',
    TOGGLE_POWERPLAY: 'TOGGLE_POWERPLAY',
};

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function getOversDisplay(balls) {
    const completedOvers = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${completedOvers}.${remainingBalls}`;
}

function shouldSwapStrike(runs) {
    return runs % 2 === 1;
}

function swapStrike(state) {
    const temp = state.currentBatsmanId;
    state.currentBatsmanId = state.nonStrikerId;
    state.nonStrikerId = temp;
}

function isOverComplete(state) {
    return state.balls > 0 && state.balls % 6 === 0;
}

function isInningsComplete(state) {
    const totalBalls = state.totalOvers * 6;
    const totalPlayers = state.battingTeam === 'A'
        ? state.teamAPlayerIds.length
        : state.teamBPlayerIds.length;
    const maxWickets = totalPlayers - 1;

    if (state.balls >= totalBalls) return true;
    if (state.wickets >= maxWickets) return true;

    // Second innings: target reached
    if (state.innings === 2 && state.target !== null && state.runs >= state.target) {
        return true;
    }

    return false;
}

function applyPowerplayMultiplier(runs, isPowerplay) {
    if (!isPowerplay) return runs;
    return runs * 2;
}

function addBallToOver(state, result) {
    state.currentOverBalls.push(result);
}

function checkAndHandleOverComplete(state) {
    if (isOverComplete(state)) {
        swapStrike(state); // swap at end of over
        state.needsBowlerChange = true;
        state.currentOverBalls = [];
    }
}

function checkAndHandleInningsComplete(state) {
    if (isInningsComplete(state)) {
        if (state.innings === 1) {
            state.matchStatus = 'innings_break';
            state.target = state.runs + 1;
            state.firstInningsScore = {
                runs: state.runs,
                wickets: state.wickets,
                balls: state.balls,
            };
        } else {
            state.matchStatus = 'completed';
            const totalPlayers = state.battingTeam === 'A'
                ? state.teamAPlayerIds.length
                : state.teamBPlayerIds.length;
            const maxWickets = totalPlayers - 1;

            if (state.runs >= state.target) {
                const wicketsRemaining = maxWickets - state.wickets;
                state.result = `${state.battingTeam === 'A' ? 'Team A' : 'Team B'} won by ${wicketsRemaining} wickets`;
            } else {
                const runDiff = state.target - 1 - state.runs;
                state.result = `${state.battingTeam === 'A' ? 'Team B' : 'Team A'} won by ${runDiff} runs`;
            }
        }
    }
}

function updateBattingStats(state, batsmanId, runs, isBoundaryFour, isBoundarySix) {
    if (!state.battingStats[batsmanId]) {
        state.battingStats[batsmanId] = {
            runs: 0, balls: 0, fours: 0, sixes: 0,
            isOut: false, dismissalType: null,
        };
    }
    const stats = state.battingStats[batsmanId];
    stats.runs += runs;
    stats.balls += 1;
    if (isBoundaryFour) stats.fours += 1;
    if (isBoundarySix) stats.sixes += 1;
}

function updateBowlingStats(state, bowlerId, runs, isWicket, isNoBall, isWide) {
    if (!state.bowlingStats[bowlerId]) {
        state.bowlingStats[bowlerId] = {
            balls: 0, runs: 0, wickets: 0, noBalls: 0, wides: 0, overs: '0.0',
        };
    }
    const stats = state.bowlingStats[bowlerId];
    stats.runs += runs;
    if (isWicket) stats.wickets += 1;
    if (isNoBall) {
        stats.noBalls += 1;
    } else if (isWide) {
        stats.wides += 1;
    } else {
        stats.balls += 1;
        stats.overs = getOversDisplay(stats.balls);
    }
}

/**
 * Main action handler. Returns { newState, statsDelta }
 */
export function applyAction(currentState, action) {
    const state = deepClone(currentState);
    state.needsBowlerChange = false;
    state.needsNewBatsman = false;

    switch (action.type) {
        case ACTION_TYPES.RUN: {
            const rawRuns = action.payload.runs;
            const actualRuns = applyPowerplayMultiplier(rawRuns, state.isPowerplay);
            const isFour = rawRuns === 4;
            const isSix = rawRuns === 6;

            state.runs += actualRuns;
            state.balls += 1;

            updateBattingStats(state, state.currentBatsmanId, actualRuns, isFour, isSix);
            updateBowlingStats(state, state.currentBowlerId, actualRuns, false, false, false);

            addBallToOver(state, isSix ? '6' : isFour ? '4' : rawRuns === 0 ? '•' : String(rawRuns));

            if (shouldSwapStrike(rawRuns)) {
                swapStrike(state);
            }

            checkAndHandleOverComplete(state);
            checkAndHandleInningsComplete(state);
            break;
        }

        case ACTION_TYPES.WICKET: {
            const powerplayDeduction = state.isPowerplay ? 5 : 0;
            state.runs = Math.max(0, state.runs - powerplayDeduction);
            state.wickets += 1;
            state.balls += 1;

            // Mark batsman out
            const outBatsmanId = action.payload.outBatsmanId || state.currentBatsmanId;
            if (!state.battingStats[outBatsmanId]) {
                state.battingStats[outBatsmanId] = {
                    runs: 0, balls: 0, fours: 0, sixes: 0,
                    isOut: false, dismissalType: null,
                };
            }
            state.battingStats[outBatsmanId].isOut = true;
            state.battingStats[outBatsmanId].dismissalType = action.payload.dismissalType || 'out';
            state.battingStats[outBatsmanId].balls += 1;

            updateBowlingStats(state, state.currentBowlerId, -powerplayDeduction, true, false, false);

            addBallToOver(state, 'W');

            // Need new batsman
            const totalPlayers = state.battingTeam === 'A'
                ? state.teamAPlayerIds.length
                : state.teamBPlayerIds.length;
            if (state.wickets < totalPlayers - 1) {
                state.needsNewBatsman = true;
                // If the out batsman was the striker, replace striker
                if (outBatsmanId === state.currentBatsmanId) {
                    state.currentBatsmanId = action.payload.newBatsmanId || null;
                } else {
                    state.nonStrikerId = action.payload.newBatsmanId || null;
                }
            }

            checkAndHandleOverComplete(state);
            checkAndHandleInningsComplete(state);
            break;
        }

        case ACTION_TYPES.NO_BALL: {
            const extraRuns = action.payload.runs || 0;
            const noBallRun = 1;
            const totalRuns = noBallRun + extraRuns;
            const actualRuns = state.isPowerplay ? totalRuns * 2 : totalRuns;

            state.runs += actualRuns;
            // No ball doesn't count as legal delivery, don't increment balls

            updateBattingStats(state, state.currentBatsmanId, extraRuns, false, false);
            // Remove the ball count since NB is not legal
            state.battingStats[state.currentBatsmanId].balls -= 1;
            updateBowlingStats(state, state.currentBowlerId, actualRuns, false, true, false);

            addBallToOver(state, `NB+${extraRuns}`);

            if (shouldSwapStrike(extraRuns)) {
                swapStrike(state);
            }
            break;
        }

        case ACTION_TYPES.WIDE: {
            const wideRun = 1;
            const extraRuns = action.payload.runs || 0;
            const totalRuns = wideRun + extraRuns;
            const actualRuns = state.isPowerplay ? totalRuns * 2 : totalRuns;

            state.runs += actualRuns;
            // Wide doesn't count as legal delivery

            updateBowlingStats(state, state.currentBowlerId, actualRuns, false, false, true);

            addBallToOver(state, extraRuns > 0 ? `WD+${extraRuns}` : 'WD');

            if (shouldSwapStrike(extraRuns)) {
                swapStrike(state);
            }
            break;
        }

        case ACTION_TYPES.TOGGLE_POWERPLAY: {
            state.isPowerplay = !state.isPowerplay;
            break;
        }

        default:
            break;
    }

    return { newState: state };
}

/**
 * Create the initial match state
 */
export function createInitialState({
    teamAPlayerIds,
    teamBPlayerIds,
    openingBatsman1Id,
    openingBatsman2Id,
    openingBowlerId,
    totalOvers,
    teamAName = 'Team A',
    teamBName = 'Team B',
}) {
    const battingStats = {};
    battingStats[openingBatsman1Id] = {
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissalType: null,
    };
    battingStats[openingBatsman2Id] = {
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissalType: null,
    };

    const bowlingStats = {};
    bowlingStats[openingBowlerId] = {
        balls: 0, runs: 0, wickets: 0, noBalls: 0, wides: 0, overs: '0.0',
    };

    return {
        runs: 0,
        wickets: 0,
        balls: 0,
        totalOvers,
        innings: 1,
        currentBatsmanId: openingBatsman1Id,
        nonStrikerId: openingBatsman2Id,
        currentBowlerId: openingBowlerId,
        isPowerplay: false,
        battingStats,
        bowlingStats,
        currentOverBalls: [],
        teamAPlayerIds,
        teamBPlayerIds,
        teamAName,
        teamBName,
        battingTeam: 'A',
        bowlingTeam: 'B',
        target: null,
        firstInningsScore: null,
        matchStatus: 'live',
        result: null,
        needsBowlerChange: false,
        needsNewBatsman: false,
    };
}

/**
 * Create state for the second innings
 */
export function createSecondInningsState(prevState, {
    openingBatsman1Id,
    openingBatsman2Id,
    openingBowlerId,
}) {
    const battingStats = {};
    battingStats[openingBatsman1Id] = {
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissalType: null,
    };
    battingStats[openingBatsman2Id] = {
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissalType: null,
    };

    const bowlingStats = {};
    bowlingStats[openingBowlerId] = {
        balls: 0, runs: 0, wickets: 0, noBalls: 0, wides: 0, overs: '0.0',
    };

    return {
        ...prevState,
        runs: 0,
        wickets: 0,
        balls: 0,
        innings: 2,
        currentBatsmanId: openingBatsman1Id,
        nonStrikerId: openingBatsman2Id,
        currentBowlerId: openingBowlerId,
        isPowerplay: false,
        battingStats,
        bowlingStats,
        currentOverBalls: [],
        battingTeam: prevState.bowlingTeam,
        bowlingTeam: prevState.battingTeam,
        matchStatus: 'live',
        result: null,
        needsBowlerChange: false,
        needsNewBatsman: false,
    };
}

export function getOversString(balls) {
    return getOversDisplay(balls);
}

export function getRunRate(runs, balls) {
    if (balls === 0) return '0.00';
    const overs = balls / 6;
    return (runs / overs).toFixed(2);
}

export function getRequiredRunRate(target, currentRuns, ballsRemaining) {
    if (ballsRemaining <= 0) return '—';
    const oversRemaining = ballsRemaining / 6;
    const runsNeeded = target - currentRuns;
    return (runsNeeded / oversRemaining).toFixed(2);
}
