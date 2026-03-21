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
    
    // Always increment matches played if they are in the squad/XI
    updated.matchesPlayed = (updated.matchesPlayed || 0) + 1;

    if (matchBattingStats) {
        // Only increment innings if they actually batted (faced a ball or were out)
        if (matchBattingStats.balls > 0 || matchBattingStats.isOut) {
            updated.innings = (updated.innings || 0) + 1;
        }
        
        updated.runsScored = (updated.runsScored || 0) + matchBattingStats.runs;
        updated.ballsFaced = (updated.ballsFaced || 0) + (matchBattingStats.balls || 0);
        updated.sixes = (updated.sixes || 0) + (matchBattingStats.sixes || 0);
        updated.fours = (updated.fours || 0) + (matchBattingStats.fours || 0);
        
        if (!matchBattingStats.isOut && (matchBattingStats.balls > 0)) {
            updated.notOuts = (updated.notOuts || 0) + 1;
        }

        // Update best score
        const currentBest = updated.bestScore || 0;
        if (matchBattingStats.runs > currentBest) {
            updated.bestScore = matchBattingStats.runs;
        }
    }

    if (matchBowlingStats) {
        updated.wicketsTaken = (updated.wicketsTaken || 0) + matchBowlingStats.wickets;
        updated.runsConceded = (updated.runsConceded || 0) + (matchBowlingStats.runs || 0);
        updated.ballsBowled = (updated.ballsBowled || 0) + (matchBowlingStats.balls || 0);

        // Update best wickets
        // For bowling, "better" means more wickets, then fewer runs conceded
        const currentBestWkts = updated.bestWickets || 0;
        const currentBestRuns = updated.bestWicketsRuns || 999;

        if (matchBowlingStats.wickets > currentBestWkts) {
            updated.bestWickets = matchBowlingStats.wickets;
            updated.bestWicketsRuns = matchBowlingStats.runs;
        } else if (matchBowlingStats.wickets === currentBestWkts && matchBowlingStats.wickets > 0) {
            if (matchBowlingStats.runs < currentBestRuns) {
                updated.bestWicketsRuns = matchBowlingStats.runs;
            }
        }
    }

    return updated;
}
