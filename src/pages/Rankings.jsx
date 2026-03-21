import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { calculateAverage } from '../lib/statsCalculator';

export default function Rankings() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { documents: players, loading, fetchAll } = useFirestore('players');
    const [activeTab, setActiveTab] = useState('batters');

    useEffect(() => {
        fetchAll(user?.uid);
    }, [user]);

    // Batter rankings — sorted by runs scored
    const batterRankings = [...players]
        .filter(p => (p.matchesPlayed || 0) > 0)
        .sort((a, b) => {
            const runsA = a.runsScored || 0;
            const runsB = b.runsScored || 0;
            if (runsB !== runsA) return runsB - runsA;
            // Tiebreak: best score
            return (b.bestScore || 0) - (a.bestScore || 0);
        });

    // Bowler rankings — sorted by wickets taken
    const bowlerRankings = [...players]
        .filter(p => (p.matchesPlayed || 0) > 0)
        .sort((a, b) => {
            const wktsA = a.wicketsTaken || 0;
            const wktsB = b.wicketsTaken || 0;
            if (wktsB !== wktsA) return wktsB - wktsA;
            // Tiebreak: best wickets in a match
            return (b.bestWickets || 0) - (a.bestWickets || 0);
        });

    const getRankBadge = (index) => {
        if (index === 0) return { bg: 'bg-amber-500/20 border-amber-500/50', text: 'text-amber-400', icon: '🥇' };
        if (index === 1) return { bg: 'bg-surface-400/20 border-surface-400/50', text: 'text-surface-300', icon: '🥈' };
        if (index === 2) return { bg: 'bg-orange-600/20 border-orange-600/50', text: 'text-orange-400', icon: '🥉' };
        return { bg: 'bg-surface-800 border-surface-700', text: 'text-surface-400', icon: null };
    };

    const renderBatterList = () => {
        if (batterRankings.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="text-5xl mb-3">🏏</div>
                    <h3 className="text-lg font-bold text-surface-300 mb-1">No batting data yet</h3>
                    <p className="text-sm text-surface-500">Play some matches to see rankings</p>
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 text-[10px] text-surface-500 font-medium px-3 py-1">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">PLAYER</div>
                    <div className="text-center col-span-1">M</div>
                    <div className="text-center col-span-2">RUNS</div>
                    <div className="text-center col-span-1">HS</div>
                    <div className="text-center col-span-1">4s</div>
                    <div className="text-center col-span-1">6s</div>
                    <div className="text-center col-span-1">Avg</div>
                </div>

                {batterRankings.map((player, index) => {
                    const badge = getRankBadge(index);
                    const matches = player.matchesPlayed || 0;
                    const innings = player.innings || 0;
                    const notOuts = player.notOuts || 0;
                    const runs = player.runsScored || 0;
                    const avg = calculateAverage(runs, innings, notOuts);

                    return (
                        <div
                            key={player.id}
                            onClick={() => navigate(`/player/${player.id}`)}
                            className={`grid grid-cols-12 items-center px-3 py-3 rounded-xl border cursor-pointer
                                transition-all hover:ring-1 hover:ring-primary-500/30 ${badge.bg} ${index < 3 ? 'animate-fade-in' : ''}`}
                        >
                            <div className={`col-span-1 text-sm font-bold ${badge.text}`}>
                                {badge.icon || (index + 1)}
                            </div>
                            <div className="col-span-4 min-w-0">
                                <span className="font-semibold text-sm text-white truncate block">
                                    {player.name}
                                </span>
                            </div>
                            <div className="text-center text-xs text-surface-400 col-span-1">{matches}</div>
                            <div className="text-center text-sm font-bold text-primary-400 col-span-2">{runs}</div>
                            <div className="text-center text-xs text-amber-400 col-span-1">{player.bestScore || 0}</div>
                            <div className="text-center text-xs text-blue-400 col-span-1">{player.fours || 0}</div>
                            <div className="text-center text-xs text-primary-300 col-span-1">{player.sixes || 0}</div>
                            <div className="text-center text-xs text-surface-300 col-span-1">{avg}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderBowlerList = () => {
        if (bowlerRankings.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="text-5xl mb-3">🎳</div>
                    <h3 className="text-lg font-bold text-surface-300 mb-1">No bowling data yet</h3>
                    <p className="text-sm text-surface-500">Play some matches to see rankings</p>
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-10 text-[10px] text-surface-500 font-medium px-3 py-1">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">PLAYER</div>
                    <div className="text-center col-span-1">M</div>
                    <div className="text-center col-span-2">WKTS</div>
                    <div className="text-center col-span-2">BEST</div>
                </div>

                {bowlerRankings.map((player, index) => {
                    const badge = getRankBadge(index);
                    const matches = player.matchesPlayed || 0;
                    const wickets = player.wicketsTaken || 0;

                    return (
                        <div
                            key={player.id}
                            onClick={() => navigate(`/player/${player.id}`)}
                            className={`grid grid-cols-10 items-center px-3 py-3 rounded-xl border cursor-pointer
                                transition-all hover:ring-1 hover:ring-primary-500/30 ${badge.bg} ${index < 3 ? 'animate-fade-in' : ''}`}
                        >
                            <div className={`col-span-1 text-sm font-bold ${badge.text}`}>
                                {badge.icon || (index + 1)}
                            </div>
                            <div className="col-span-4 min-w-0">
                                <span className="font-semibold text-sm text-white truncate block">
                                    {player.name}
                                </span>
                            </div>
                            <div className="text-center text-xs text-surface-400 col-span-1">{matches}</div>
                            <div className="text-center text-sm font-bold text-red-400 col-span-2">{wickets}</div>
                            <div className="text-center text-xs text-orange-400 col-span-2">{player.bestWickets || 0}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 max-w-lg mx-auto">
            <div className="mb-4">
                <h1 className="text-xl font-black text-white">Rankings</h1>
                <p className="text-xs text-surface-400">Player leaderboard based on performance</p>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-1 mb-4 bg-surface-800/50 rounded-xl p-1">
                <button
                    onClick={() => setActiveTab('batters')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'batters'
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'text-surface-400 hover:text-white'
                    }`}
                >
                    🏏 Batters
                </button>
                <button
                    onClick={() => setActiveTab('bowlers')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'bowlers'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'text-surface-400 hover:text-white'
                    }`}
                >
                    🎳 Bowlers
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="text-4xl animate-bounce">🏏</div>
                    <p className="text-surface-400 mt-2">Loading rankings...</p>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {activeTab === 'batters' ? renderBatterList() : renderBowlerList()}
                </div>
            )}
        </div>
    );
}
