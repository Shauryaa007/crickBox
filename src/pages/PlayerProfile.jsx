import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirestore } from '../hooks/useFirestore';
import { calculateStrikeRate, calculateAverage, calculateBowlingAverage, calculateEconomy } from '../lib/statsCalculator';

export default function PlayerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getById } = useFirestore('players');
    const [player, setPlayer] = useState(null);

    useEffect(() => {
        const load = async () => {
            const p = await getById(id);
            if (p) setPlayer(p);
        };
        load();
    }, [id]);

    if (!player) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-4xl animate-bounce">🏏</div>
            </div>
        );
    }

    const stats = [
        { label: 'Matches', value: player.matchesPlayed || 0, color: 'text-white', icon: '🏏' },
        { label: 'Innings', value: player.innings || 0, color: 'text-surface-300', icon: '🏟️' },
        { label: 'Runs', value: player.runsScored || 0, color: 'text-primary-400', icon: '🏃' },
        { label: 'Avg', value: calculateAverage(player.runsScored || 0, player.innings || 0, player.notOuts || 0), color: 'text-amber-400', icon: '📈' },
        { label: 'SR', value: calculateStrikeRate(player.runsScored || 0, player.ballsFaced || 0), color: 'text-blue-400', icon: '⚡' },
        { label: 'Wickets', value: player.wicketsTaken || 0, color: 'text-red-400', icon: '🎳' },
        { label: 'Econ', value: calculateEconomy(player.runsConceded || 0, player.ballsBowled || 0), color: 'text-orange-400', icon: '📉' },
        { label: 'Best Score', value: player.bestScore || 0, color: 'text-amber-300', icon: '⭐' },
        { label: 'Best Wkts', value: player.bestWickets ? `${player.bestWickets}/${player.bestWicketsRuns || 0}` : '0', color: 'text-red-300', icon: '🔥' },
    ];

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 max-w-lg mx-auto">
            {/* Header with back button */}
            <button
                onClick={() => navigate(-1)}
                className="text-surface-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1"
            >
                ← Back
            </button>

            {/* Player card */}
            <div className="card-glow mb-6 text-center py-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 mx-auto
            flex items-center justify-center text-3xl font-black text-white mb-3 shadow-xl shadow-primary-500/20">
                        {player.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <h1 className="text-2xl font-black text-white">{player.name}</h1>
                    <p className="text-sm text-surface-400 mt-1">
                        {player.matchesPlayed || 0} matches played
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            <h2 className="font-bold text-white mb-3">Career Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="card text-center py-4">
                        <div className="text-xl mb-1">{stat.icon}</div>
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-surface-400 mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
