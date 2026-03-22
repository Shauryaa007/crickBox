import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import TeamSelector from '../components/match/TeamSelector';
import CoinToss from '../components/match/CoinToss';
import Modal from '../components/common/Modal';

export default function NewMatch() {
    const { user, openAuthModal } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { documents: players, fetchAll: fetchPlayers } = useFirestore('players');
    const { add: addMatch } = useFirestore('matches');

    const [step, setStep] = useState(1);
    const [teams, setTeams] = useState(null);
    const [totalOvers, setTotalOvers] = useState(5);
    const [tossWinner, setTossWinner] = useState('');
    const [tossDecision, setTossDecision] = useState('');
    const [openingBatsman1, setOpeningBatsman1] = useState('');
    const [openingBatsman2, setOpeningBatsman2] = useState('');
    const [openingBowler, setOpeningBowler] = useState('');
    const [manualOversModalOpen, setManualOversModalOpen] = useState(false);

    useEffect(() => {
        fetchPlayers();
    }, [fetchPlayers]);

    // Handle rematch teams from navigation state
    useEffect(() => {
        if (location.state?.rematchTeams && step === 1 && !teams) {
            setTeams(location.state.rematchTeams);
            setStep(2);
            // Clear location state so refreshing doesn't automatically trigger it again
            window.history.replaceState({}, document.title);
        }
    }, [location.state, step, teams]);

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

    if (!user) {
        return (
            <div className="min-h-screen pt-20 pb-24 px-4 max-w-lg mx-auto flex flex-col items-center justify-center">
                <div className="text-5xl mb-4">🔒</div>
                <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
                <p className="text-surface-400 text-center mb-6">You must be signed in to create and start a new match.</p>
                <button onClick={openAuthModal} className="btn-primary px-6 py-3">Sign In to Continue</button>
            </div>
        );
    }

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
                        <div className="grid grid-cols-4 gap-2">
                            {[2, 3, 5, 10, 15, 20].map(o => (
                                <button
                                    key={o}
                                    onClick={() => setTotalOvers(o)}
                                    className={`py-3 rounded-xl text-sm font-bold transition-all
                    ${totalOvers === o
                                            ? 'bg-primary-600 text-white shadow-lg'
                                            : 'bg-surface-700 text-surface-400 hover:text-white'}`}
                                >
                                    {o}
                                </button>
                            ))}
                            <button
                                onClick={() => setManualOversModalOpen(true)}
                                className={`py-3 rounded-xl text-sm font-bold transition-all
                    ${![2, 3, 5, 10, 15, 20].includes(totalOvers)
                                        ? 'bg-primary-600 text-white shadow-lg'
                                        : 'bg-surface-700 text-surface-400 hover:text-white'}`}
                            >
                                Manual
                            </button>
                        </div>
                    </div>

                    {/* Manual Overs Modal */}
                    <Modal
                        isOpen={manualOversModalOpen}
                        onClose={() => setManualOversModalOpen(false)}
                        title="Set Custom Overs"
                    >
                        <div className="space-y-6 py-2">
                            <div className="flex items-center justify-center gap-6">
                                <button
                                    onClick={() => setTotalOvers(Math.max(1, totalOvers - 1))}
                                    className="w-14 h-14 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-2xl font-bold text-white hover:bg-surface-700 active:scale-95 transition-all shadow-lg"
                                >
                                    −
                                </button>
                                <div className="text-center">
                                    <input
                                        type="number"
                                        value={totalOvers}
                                        onChange={(e) => setTotalOvers(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-24 bg-transparent border-b-2 border-primary-500 text-5xl font-black text-center py-2 focus:outline-none text-white appearance-none"
                                        style={{ MozAppearance: 'textfield' }}
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-surface-500 mt-2 uppercase tracking-[0.2em]">Overs</p>
                                </div>
                                <button
                                    onClick={() => setTotalOvers(totalOvers + 1)}
                                    className="w-14 h-14 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-2xl font-bold text-white hover:bg-surface-700 active:scale-95 transition-all shadow-lg"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={() => setManualOversModalOpen(false)}
                                className="btn-primary w-full py-4 text-lg font-black tracking-wide"
                            >
                                DONE
                            </button>
                        </div>
                    </Modal>

                    {/* Toss */}
                    <div className="card space-y-3">
                        {tossDecision ? (
                            <div className="text-center py-4 animate-fade-in">
                                <h3 className="text-lg font-bold text-primary-400 mb-2">
                                    {tossWinner === 'A' ? teams.teamAName : teams.teamBName} won the toss and chose to {tossDecision === 'bat' ? 'BAT' : 'BOWL'}.
                                </h3>
                                <button 
                                    onClick={() => { setTossWinner(''); setTossDecision(''); }} 
                                    className="text-xs text-surface-400 hover:text-white underline mt-2"
                                >
                                    Re-Toss
                                </button>
                                <div className="text-xs text-surface-400 pt-4 mt-4 border-t border-surface-800">
                                    <span className="font-semibold text-white">{battingTeamName}</span> will bat first
                                </div>
                            </div>
                        ) : (
                            <CoinToss 
                                teamAName={teams.teamAName} 
                                teamBName={teams.teamBName} 
                                onTossComplete={(w, d) => {
                                    setTossWinner(w);
                                    setTossDecision(d);
                                }} 
                            />
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                            ← Back
                        </button>
                        <button 
                            onClick={() => setStep(3)} 
                            disabled={!tossDecision}
                            className="btn-primary flex-1 py-3 disabled:opacity-40"
                        >
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
