import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { getOversString } from '../lib/matchEngine';

export default function MatchHistory() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { documents: matches, loading, fetchAll } = useFirestore('matches');

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const getTeamAName = (match) => {
        return match.currentState?.teamAName || match.teamA?.name || 'Team A';
    };

    const getTeamBName = (match) => {
        return match.currentState?.teamBName || match.teamB?.name || 'Team B';
    };

    const handleMatchClick = (match) => {
        if (match.status === 'completed') {
            navigate(`/match-details/${match.id}`);
        } else if (match.status === 'live') {
            navigate(`/match/${match.id}`);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 max-w-lg mx-auto">
            <div className="mb-4">
                <h1 className="text-xl font-black text-white">Match History</h1>
                <p className="text-xs text-surface-400">{matches.length} matches played</p>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="text-4xl animate-bounce">🏏</div>
                    <p className="text-surface-400 mt-2">Loading matches...</p>
                </div>
            ) : matches.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-5xl mb-3">📊</div>
                    <h3 className="text-lg font-bold text-surface-300 mb-1">No matches yet</h3>
                    <p className="text-sm text-surface-500">Start a match to see history here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {matches.map((match) => {
                        const state = match.currentState;
                        const isLive = match.status === 'live';
                        const isCompleted = match.status === 'completed';
                        const teamAName = getTeamAName(match);
                        const teamBName = getTeamBName(match);

                        // Determine scores for both teams
                        const firstBatIsA = match.firstBattingTeam === 'A';
                        const firstBattingName = firstBatIsA ? teamAName : teamBName;
                        const secondBattingName = firstBatIsA ? teamBName : teamAName;

                        return (
                            <div
                                key={match.id}
                                className={`card animate-fade-in ${isCompleted ? 'cursor-pointer hover:ring-1 hover:ring-primary-500/40 transition-all' : isLive ? 'cursor-pointer hover:ring-1 hover:ring-red-500/40 transition-all' : ''}`}
                                onClick={() => handleMatchClick(match)}
                            >
                                {/* Status bar */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {isLive && (
                                            <span className="badge-live flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse-fast" />
                                                LIVE
                                            </span>
                                        )}
                                        {isCompleted && (
                                            <span className="badge bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                                Completed
                                            </span>
                                        )}
                                        <span className="text-xs text-surface-500">
                                            {match.overs} overs
                                        </span>
                                    </div>
                                    {match.createdAt && (
                                        <span className="text-xs text-surface-500">
                                            {new Date(match.createdAt?.seconds * 1000).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                {/* Teams & Scores */}
                                <div className="space-y-2">
                                    {/* First batting team */}
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">
                                            {firstBattingName}
                                        </span>
                                        {state?.firstInningsScore && (
                                            <span className="font-bold text-white">
                                                {state.firstInningsScore.runs}/{state.firstInningsScore.wickets}
                                                <span className="text-xs text-surface-400 ml-1">
                                                    ({getOversString(state.firstInningsScore.balls)})
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    {/* Second batting team */}
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">
                                            {secondBattingName}
                                        </span>
                                        {isCompleted && state?.innings === 2 && (
                                            <span className="font-bold text-white">
                                                {state.runs}/{state.wickets}
                                                <span className="text-xs text-surface-400 ml-1">
                                                    ({getOversString(state.balls)})
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Result */}
                                {state?.result && (
                                    <div className="mt-3 pt-3 border-t border-surface-700">
                                        <p className="text-sm font-semibold text-primary-400">
                                            🏆 {state.result}
                                        </p>
                                    </div>
                                )}

                                {/* Click hint for completed */}
                                {isCompleted && (
                                    <div className="mt-2 text-[10px] text-surface-500 text-right">
                                        Tap for full scorecard →
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
