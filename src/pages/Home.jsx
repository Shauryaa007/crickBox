import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { useEffect, useState } from 'react';

export default function Home() {
    const { user } = useAuth();
    const { documents: matches, fetchAll } = useFirestore('matches');
    const [recentMatches, setRecentMatches] = useState([]);

    useEffect(() => {
        fetchAll(user?.uid);
    }, [user]);

    useEffect(() => {
        setRecentMatches(matches.slice(0, 3));
    }, [matches]);

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 max-w-lg mx-auto">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900/80 via-surface-800 to-surface-900 p-6 mb-6 border border-primary-800/30">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <div className="text-5xl mb-3">🏏</div>
                    <h1 className="text-2xl font-black text-white mb-1">CricScorer</h1>
                    <p className="text-surface-300 text-sm mb-5">
                        Real-time cricket match scoring with umpire-like precision
                    </p>
                    <Link
                        to="/new-match"
                        className="btn-primary px-6 py-3.5 text-base inline-flex items-center gap-2"
                    >
                        <span className="text-xl">⚡</span>
                        Start New Match
                    </Link>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="card text-center py-4">
                    <div className="text-2xl font-black text-primary-400">
                        {matches.filter(m => m.status === 'completed').length}
                    </div>
                    <div className="text-[10px] text-surface-400 mt-1">Matches</div>
                </div>
                <div className="card text-center py-4">
                    <div className="text-2xl font-black text-amber-400">
                        {matches.filter(m => m.status === 'live').length}
                    </div>
                    <div className="text-[10px] text-surface-400 mt-1">Live</div>
                </div>
                <div className="card text-center py-4">
                    <div className="text-2xl font-black text-blue-400">
                        {matches.length}
                    </div>
                    <div className="text-[10px] text-surface-400 mt-1">Total</div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Link
                    to="/new-match"
                    className="card hover:border-primary-500/50 transition-all group p-5"
                >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🆕</div>
                    <h3 className="font-bold text-white text-sm">New Match</h3>
                    <p className="text-xs text-surface-400 mt-0.5">Start scoring</p>
                </Link>
                <Link
                    to="/players"
                    className="card hover:border-blue-500/50 transition-all group p-5"
                >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👥</div>
                    <h3 className="font-bold text-white text-sm">Players</h3>
                    <p className="text-xs text-surface-400 mt-0.5">Manage roster</p>
                </Link>
            </div>

            {/* Recent matches */}
            {recentMatches.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-white">Recent Matches</h2>
                        <Link to="/history" className="text-xs text-primary-400 hover:text-primary-300">
                            View All →
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {recentMatches.map((match) => (
                            <div key={match.id} className="card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold text-white text-sm">
                                            {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
                                        </span>
                                        <div className="text-xs text-surface-400 mt-0.5">
                                            {match.overs} overs • {match.status}
                                        </div>
                                    </div>
                                    {match.status === 'live' && (
                                        <span className="badge-live text-[10px]">LIVE</span>
                                    )}
                                    {match.status === 'completed' && match.scorecard?.result && (
                                        <span className="text-xs text-primary-400">{match.scorecard.result}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {matches.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-5xl mb-3">🏟️</div>
                    <h3 className="text-lg font-bold text-surface-300 mb-1">No matches yet</h3>
                    <p className="text-sm text-surface-500 mb-4">
                        Add players and start your first match!
                    </p>
                    <Link to="/players" className="btn-primary px-5 py-2.5 text-sm">
                        Add Players First
                    </Link>
                </div>
            )}
        </div>
    );
}
