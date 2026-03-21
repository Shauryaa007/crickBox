import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { MatchProvider, useMatch } from '../context/MatchContext';
import { createInitialState, createSecondInningsState } from '../lib/matchEngine';
import Scoreboard from '../components/scoring/Scoreboard';
import ScoringControls from '../components/scoring/ScoringControls';
import Modal from '../components/common/Modal';
import { mergeMatchStatsIntoPlayer } from '../lib/statsCalculator';

function LiveMatchInner({ matchDoc, players }) {
    const { matchState, history, updateCurrent } = useMatch();
    const { update: updateMatch } = useFirestore('matches');
    const { update: updatePlayer, getById: getPlayer } = useFirestore('players');
    const { id } = useParams();
    const navigate = useNavigate();

    const [showInningsBreak, setShowInningsBreak] = useState(false);
    const [showMatchResult, setShowMatchResult] = useState(false);
    const [secondInningsSetup, setSecondInningsSetup] = useState(false);
    const [si_bat1, setSi_bat1] = useState('');
    const [si_bat2, setSi_bat2] = useState('');
    const [si_bowl, setSi_bowl] = useState('');

    const getPlayerName = (pid) => {
        const p = players.find(pl => pl.id === pid);
        return p ? p.name : 'Unknown';
    };

    // Save match state to Firestore periodically
    useEffect(() => {
        const save = async () => {
            if (id && matchState) {
                try {
                    await updateMatch(id, {
                        currentState: matchState,
                        history: history.slice(-50), // Keep last 50 for undo
                        status: matchState.matchStatus === 'completed' ? 'completed' : 'live',
                    });
                } catch (e) {
                    console.error('Auto-save failed:', e);
                }
            }
        };
        const timer = setTimeout(save, 1000); // Debounce saves
        return () => clearTimeout(timer);
    }, [matchState, history]);

    // Handle innings break
    useEffect(() => {
        if (matchState.matchStatus === 'innings_break' && !showInningsBreak && !secondInningsSetup) {
            setShowInningsBreak(true);
        }
    }, [matchState.matchStatus]);

    // Handle match completed
    useEffect(() => {
        if (matchState.matchStatus === 'completed' && !showMatchResult) {
            setShowMatchResult(true);
            // Update player stats
            updatePlayerStats();
        }
    }, [matchState.matchStatus]);

    const updatePlayerStats = async () => {
        try {
            const allPlayerIds = [...matchState.teamAPlayerIds, ...matchState.teamBPlayerIds];
            for (const pid of allPlayerIds) {
                const player = await getPlayer(pid);
                if (player) {
                    const batting = matchState.battingStats[pid] || null;
                    const bowling = matchState.bowlingStats[pid] || null;
                    const updated = mergeMatchStatsIntoPlayer(player, batting, bowling);
                    await updatePlayer(pid, updated);
                }
            }
        } catch (e) {
            console.error('Failed to update player stats:', e);
        }
    };

    const startSecondInnings = () => {
        setShowInningsBreak(false);
        setSecondInningsSetup(true);
    };

    const handleSecondInningsStart = () => {
        if (!si_bat1 || !si_bat2 || !si_bowl || si_bat1 === si_bat2) return;
        const newState = createSecondInningsState(matchState, {
            openingBatsman1Id: si_bat1,
            openingBatsman2Id: si_bat2,
            openingBowlerId: si_bowl,
        });
        updateCurrent(newState);
        setSecondInningsSetup(false);
    };

    const secondBattingTeamIds = matchState.battingTeam === 'A'
        ? matchState.teamBPlayerIds
        : matchState.teamAPlayerIds;
    const secondBowlingTeamIds = matchState.battingTeam === 'A'
        ? matchState.teamAPlayerIds
        : matchState.teamBPlayerIds;

    const battingTeamPlayerIds = matchState.battingTeam === 'A'
        ? matchState.teamAPlayerIds
        : matchState.teamBPlayerIds;

    return (
        <div className="min-h-screen pt-16 pb-6 px-3 max-w-lg mx-auto">
            {/* Hide navbar on this page for more space */}
            <style>{`nav, header { display: none !important; }`}</style>

            {/* Minimal top bar */}
            <div className="fixed top-0 left-0 right-0 z-50 glass px-4 py-2">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="text-surface-400 hover:text-white text-sm"
                    >
                        ← Back
                    </button>
                    <span className="text-xs font-semibold text-surface-300">
                        {matchState.teamAName} vs {matchState.teamBName}
                    </span>
                    <div className="w-12" /> {/* spacer */}
                </div>
            </div>

            {/* Scoreboard */}
            <Scoreboard players={players} />

            {/* Scoring controls */}
            <div className="mt-3">
                <ScoringControls
                    players={players}
                    battingTeamPlayerIds={battingTeamPlayerIds}
                />
            </div>

            {/* Innings Break Modal */}
            <Modal
                isOpen={showInningsBreak}
                onClose={() => { }}
                title="🏏 Innings Break!"
                size="lg"
            >
                <div className="space-y-4 text-center">
                    <div className="text-4xl font-black text-white">
                        {matchState.firstInningsScore?.runs}/{matchState.firstInningsScore?.wickets}
                    </div>
                    <p className="text-surface-300">
                        Target: <span className="text-amber-400 font-bold">{matchState.target}</span> runs
                    </p>
                    <button onClick={startSecondInnings} className="btn-primary w-full py-4 text-lg">
                        Start 2nd Innings →
                    </button>
                </div>
            </Modal>

            {/* Second Innings Setup */}
            {secondInningsSetup && (
                <div className="fixed inset-0 z-50 bg-surface-950/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="card w-full max-w-md space-y-4 animate-bounce-in">
                        <h3 className="text-lg font-bold text-white text-center">2nd Innings Setup</h3>
                        <p className="text-xs text-surface-400 text-center">
                            {matchState.battingTeam === 'A' ? matchState.teamBName : matchState.teamAName} batting now
                        </p>
                        <div>
                            <label className="text-xs text-surface-400 mb-1 block">Striker</label>
                            <select value={si_bat1} onChange={e => setSi_bat1(e.target.value)} className="input text-sm">
                                <option value="">Select...</option>
                                {secondBattingTeamIds.filter(id => id !== si_bat2).map(id => (
                                    <option key={id} value={id}>{getPlayerName(id)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-surface-400 mb-1 block">Non-Striker</label>
                            <select value={si_bat2} onChange={e => setSi_bat2(e.target.value)} className="input text-sm">
                                <option value="">Select...</option>
                                {secondBattingTeamIds.filter(id => id !== si_bat1).map(id => (
                                    <option key={id} value={id}>{getPlayerName(id)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-surface-400 mb-1 block">Opening Bowler</label>
                            <select value={si_bowl} onChange={e => setSi_bowl(e.target.value)} className="input text-sm">
                                <option value="">Select...</option>
                                {secondBowlingTeamIds.map(id => (
                                    <option key={id} value={id}>{getPlayerName(id)}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleSecondInningsStart}
                            disabled={!si_bat1 || !si_bat2 || !si_bowl || si_bat1 === si_bat2}
                            className="btn-primary w-full py-3 disabled:opacity-40"
                        >
                            Start Innings
                        </button>
                    </div>
                </div>
            )}

            {/* Match Result Modal */}
            <Modal
                isOpen={showMatchResult}
                onClose={() => setShowMatchResult(false)}
                title="🏆 Match Complete!"
                size="lg"
            >
                <div className="space-y-4 text-center">
                    <div className="text-6xl mb-2">🏆</div>
                    <p className="text-lg font-bold text-primary-400">
                        {matchState.result}
                    </p>
                    <div className="card bg-surface-900 space-y-2 text-left text-sm">
                        <div className="flex justify-between">
                            <span className="text-surface-400">1st Innings</span>
                            <span className="text-white font-bold">
                                {matchState.firstInningsScore?.runs}/{matchState.firstInningsScore?.wickets}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-surface-400">2nd Innings</span>
                            <span className="text-white font-bold">
                                {matchState.runs}/{matchState.wickets}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="btn-secondary flex-1 py-3"
                        >
                            Home
                        </button>
                        <button
                            onClick={() => navigate('/history')}
                            className="btn-primary flex-1 py-3"
                        >
                            View History
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function LiveMatch() {
    const { id } = useParams();
    const { user } = useAuth();
    const { getById, loading } = useFirestore('matches');
    const { documents: players, fetchAll: fetchPlayers } = useFirestore('players');
    const [matchDoc, setMatchDoc] = useState(null);
    const [initialState, setInitialState] = useState(null);

    useEffect(() => {
        fetchPlayers(user?.uid);
    }, [user]);

    useEffect(() => {
        const load = async () => {
            const doc = await getById(id);
            if (doc) {
                setMatchDoc(doc);
                // Restore state or create new
                if (doc.currentState) {
                    setInitialState(doc.currentState);
                } else {
                    const state = createInitialState({
                        teamAPlayerIds: doc.teamA.playerIds,
                        teamBPlayerIds: doc.teamB.playerIds,
                        openingBatsman1Id: doc.openingBatsman1,
                        openingBatsman2Id: doc.openingBatsman2,
                        openingBowlerId: doc.openingBowler,
                        totalOvers: doc.overs,
                        teamAName: doc.teamA.name,
                        teamBName: doc.teamB.name,
                    });
                    // Determine batting order from toss
                    if (doc.firstBattingTeam === 'B') {
                        state.battingTeam = 'B';
                        state.bowlingTeam = 'A';
                    }
                    setInitialState(state);
                }
            }
        };
        if (id) load();
    }, [id]);

    if (!initialState || players.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl animate-bounce">🏏</div>
                    <p className="text-surface-400 mt-3">Loading match...</p>
                </div>
            </div>
        );
    }

    return (
        <MatchProvider initialState={initialState}>
            <LiveMatchInner matchDoc={matchDoc} players={players} />
        </MatchProvider>
    );
}
