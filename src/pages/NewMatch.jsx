import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import TeamSelector from '../components/match/TeamSelector';

export default function NewMatch() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { documents: players, fetchAll: fetchPlayers } = useFirestore('players');
    const { add: addMatch } = useFirestore('matches');

    const [step, setStep] = useState(1);
    const [teams, setTeams] = useState(null);
    const [totalOvers, setTotalOvers] = useState(5);
    const [tossWinner, setTossWinner] = useState('A');
    const [tossDecision, setTossDecision] = useState('bat');
    const [openingBatsman1, setOpeningBatsman1] = useState('');
    const [openingBatsman2, setOpeningBatsman2] = useState('');
    const [openingBowler, setOpeningBowler] = useState('');

    useEffect(() => {
        fetchPlayers(user?.uid);
    }, [user]);

    const getPlayerName = (id) => {
        const p = players.find(pl => pl.id === id);
        return p ? p.name : 'Unknown';
    };

    const handleTeamsSelected = (teamData) => {
        setTeams(teamData);
        setStep(2);
    };

    const battingTeamIds = teams
        ? (tossDecision === 'bat'
            ? (tossWinner === 'A' ? teams.teamA : teams.teamB)
            : (tossWinner === 'A' ? teams.teamB : teams.teamA))
        : [];

    const bowlingTeamIds = teams
        ? (tossDecision === 'bat'
            ? (tossWinner === 'A' ? teams.teamB : teams.teamA)
            : (tossWinner === 'A' ? teams.teamA : teams.teamB))
        : [];

    const battingTeamName = teams
        ? (tossDecision === 'bat'
            ? (tossWinner === 'A' ? teams.teamAName : teams.teamBName)
            : (tossWinner === 'A' ? teams.teamBName : teams.teamAName))
        : '';

    const bowlingTeamName = teams
        ? (tossDecision === 'bat'
            ? (tossWinner === 'A' ? teams.teamBName : teams.teamAName)
            : (tossWinner === 'A' ? teams.teamAName : teams.teamBName))
        : '';

    const handleStartMatch = async () => {
        const matchData = {
            teamA: { name: teams.teamAName, playerIds: teams.teamA },
            teamB: { name: teams.teamBName, playerIds: teams.teamB },
            overs: totalOvers,
            status: 'live',
            toss: { winner: tossWinner, decision: tossDecision },
            firstBattingTeam: battingTeamIds === teams.teamA ? 'A' : 'B',
            openingBatsman1,
            openingBatsman2,
            openingBowler,
            createdBy: user?.uid || 'anonymous',
        };

        const matchId = await addMatch(matchData);
        if (matchId) {
            navigate(`/match/${matchId}`);
        }
    };

    const canStartMatch = openingBatsman1 && openingBatsman2 && openingBowler
        && openingBatsman1 !== openingBatsman2;

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 max-w-lg mx-auto">
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center flex-1 gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${step >= s
                                ? 'bg-primary-600 text-white'
                                : 'bg-surface-700 text-surface-400'}`}>
                            {step > s ? '✓' : s}
                        </div>
                        {s < 3 && (
                            <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary-500' : 'bg-surface-700'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step titles */}
            <div className="mb-4">
                <h1 className="text-xl font-black text-white">
                    {step === 1 && 'Select Teams'}
                    {step === 2 && 'Match Settings'}
                    {step === 3 && 'Select Openers'}
                </h1>
                <p className="text-xs text-surface-400">
                    {step === 1 && 'Choose players and divide into teams'}
                    {step === 2 && 'Configure match parameters'}
                    {step === 3 && 'Pick opening batsmen and bowler'}
                </p>
            </div>

            {/* Step 1: Team Selection */}
            {step === 1 && (
                players.length < 4 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-3">👥</div>
                        <h3 className="text-lg font-bold text-surface-300 mb-2">Need more players</h3>
                        <p className="text-sm text-surface-500 mb-4">
                            Add at least 4 players to create a match (2 per team minimum)
                        </p>
                        <button
                            onClick={() => navigate('/players')}
                            className="btn-primary px-5 py-2.5 text-sm"
                        >
                            Go to Players
                        </button>
                    </div>
                ) : (
                    <TeamSelector players={players} onTeamsSelected={handleTeamsSelected} />
                )
            )}

            {/* Step 2: Match Settings */}
            {step === 2 && teams && (
                <div className="space-y-6 animate-fade-in">
                    {/* Overs */}
                    <div className="card">
                        <label className="block text-sm font-medium text-surface-300 mb-3">
                            Number of Overs
                        </label>
                        <div className="flex items-center gap-4">
                            {[2, 3, 5, 8, 10, 15, 20].map(o => (
                                <button
                                    key={o}
                                    onClick={() => setTotalOvers(o)}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all
                    ${totalOvers === o
                                            ? 'bg-primary-600 text-white shadow-lg'
                                            : 'bg-surface-700 text-surface-400 hover:text-white'}`}
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                        <div className="mt-3">
                            <input
                                type="number"
                                value={totalOvers}
                                onChange={(e) => setTotalOvers(Math.max(1, parseInt(e.target.value) || 1))}
                                className="input text-sm"
                                placeholder="Custom overs"
                                min={1}
                            />
                        </div>
                    </div>

                    {/* Toss */}
                    <div className="card space-y-3">
                        <h3 className="text-sm font-medium text-surface-300">Toss</h3>
                        <div>
                            <label className="text-xs text-surface-400 mb-1 block">Toss Winner</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTossWinner('A')}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all
                    ${tossWinner === 'A'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-surface-700 text-surface-400'}`}
                                >
                                    {teams.teamAName}
                                </button>
                                <button
                                    onClick={() => setTossWinner('B')}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all
                    ${tossWinner === 'B'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-surface-700 text-surface-400'}`}
                                >
                                    {teams.teamBName}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-surface-400 mb-1 block">Chose to</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTossDecision('bat')}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all
                    ${tossDecision === 'bat'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-surface-700 text-surface-400'}`}
                                >
                                    🏏 Bat
                                </button>
                                <button
                                    onClick={() => setTossDecision('bowl')}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all
                    ${tossDecision === 'bowl'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-surface-700 text-surface-400'}`}
                                >
                                    🎳 Bowl
                                </button>
                            </div>
                        </div>
                        <div className="text-xs text-surface-400 pt-1">
                            <span className="font-semibold text-white">{battingTeamName}</span> will bat first
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                            ← Back
                        </button>
                        <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3">
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Opening Selection */}
            {step === 3 && teams && (
                <div className="space-y-6 animate-fade-in">
                    {/* Opening Batsmen */}
                    <div className="card space-y-3">
                        <h3 className="text-sm font-medium text-surface-300">
                            Opening Batsmen ({battingTeamName})
                        </h3>
                        <div>
                            <label className="text-xs text-surface-400 mb-1 block">Striker</label>
                            <select
                                value={openingBatsman1}
                                onChange={(e) => setOpeningBatsman1(e.target.value)}
                                className="input text-sm"
                            >
                                <option value="">Select striker...</option>
                                {battingTeamIds
                                    .filter(id => id !== openingBatsman2)
                                    .map(id => (
                                        <option key={id} value={id}>{getPlayerName(id)}</option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-surface-400 mb-1 block">Non-Striker</label>
                            <select
                                value={openingBatsman2}
                                onChange={(e) => setOpeningBatsman2(e.target.value)}
                                className="input text-sm"
                            >
                                <option value="">Select non-striker...</option>
                                {battingTeamIds
                                    .filter(id => id !== openingBatsman1)
                                    .map(id => (
                                        <option key={id} value={id}>{getPlayerName(id)}</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Opening Bowler */}
                    <div className="card space-y-3">
                        <h3 className="text-sm font-medium text-surface-300">
                            Opening Bowler ({bowlingTeamName})
                        </h3>
                        <select
                            value={openingBowler}
                            onChange={(e) => setOpeningBowler(e.target.value)}
                            className="input text-sm"
                        >
                            <option value="">Select bowler...</option>
                            {bowlingTeamIds.map(id => (
                                <option key={id} value={id}>{getPlayerName(id)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">
                            ← Back
                        </button>
                        <button
                            onClick={handleStartMatch}
                            disabled={!canStartMatch}
                            className="btn-primary flex-1 py-3 disabled:opacity-40"
                        >
                            🏏 Start Match!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
