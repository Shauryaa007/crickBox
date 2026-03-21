/**
 * statsCalculator.js — Utility functions for calculating derived player statistics.
 */

export function calculateStrikeRate(runs, balls) {
    if (balls === 0) return 0;
    return ((runs / balls) * 100).toFixed(1);
}

export function calculateAverage(runs, innings, notOuts = 0) {
    const dismissals = innings - notOuts;
    if (dismissals === 0) return runs > 0 ? '∞' : '0.00';
    return (runs / dismissals).toFixed(2);
}

export function calculateBowlingAverage(runsConceded, wickets) {
    if (wickets === 0) return '—';
    return (runsConceded / wickets).toFixed(2);
}

export function calculateEconomy(runsConceded, ballsBowled) {
    if (ballsBowled === 0) return '0.00';
    const overs = ballsBowled / 6;
    return (runsConceded / overs).toFixed(2);
}

/**
 * Update a player's stats based on match performance
 */
export function mergeMatchStatsIntoPlayer(player, matchBattingStats, matchBowlingStats) {
    const updated = { ...player };
    updated.matchesPlayed = (updated.matchesPlayed || 0) + 1;

    if (matchBattingStats) {
        updated.runsScored = (updated.runsScored || 0) + matchBattingStats.runs;
        updated.sixes = (updated.sixes || 0) + matchBattingStats.sixes;
        updated.fours = (updated.fours || 0) + matchBattingStats.fours;
        updated.bestScore = Math.max(updated.bestScore || 0, matchBattingStats.runs);
    }

    if (matchBowlingStats) {
        updated.wicketsTaken = (updated.wicketsTaken || 0) + matchBowlingStats.wickets;
        updated.bestWickets = Math.max(updated.bestWickets || 0, matchBowlingStats.wickets);
    }

    return updated;
}
