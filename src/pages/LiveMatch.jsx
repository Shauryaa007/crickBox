import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { MatchProvider, useMatch } from '../context/MatchContext';
import { createInitialState, createSecondInningsState, createSuperOverInningsState } from '../lib/matchEngine';
import Scoreboard from '../components/scoring/Scoreboard';
import ScoringControls from '../components/scoring/ScoringControls';
import CoinToss from '../components/match/CoinToss';
import Modal from '../components/common/Modal';
import { mergeMatchStatsIntoPlayer } from '../lib/statsCalculator';

function LiveMatchInner({ matchDoc, players, user }) {
    const { matchState, history, updateCurrent } = useMatch();
    const isAdmin = user && matchDoc?.createdBy === user.uid;
    const { update: updateMatch } = useFirestore('matches');
    const { update: updatePlayer, getById: getPlayer } = useFirestore('players');
    const { id } = useParams();
    const navigate = useNavigate();

    const [showInningsBreak, setShowInningsBreak] = useState(false);
    const [showSuperOverBreak, setShowSuperOverBreak] = useState(false);
    const [showMatchResult, setShowMatchResult] = useState(false);
    const [inningsSetupPhase, setInningsSetupPhase] = useState(0); // 0=none, 2=innings 2, 3=super over 1, 4=super over 2
    const [si_bat1, setSi_bat1] = useState('');
    const [si_bat2, setSi_bat2] = useState('');
    const [si_bowl, setSi_bowl] = useState('');
    const [soTossWinner, setSoTossWinner] = useState('');
    const [soTossDecision, setSoTossDecision] = useState('');
    const statsUpdateAttempted = useRef(false);

    const getPlayerName = (pid) => {
        const p = players.find(pl => pl.id === pid);
        return p ? p.name : 'Unknown';
    };

    // Save match state to Firestore periodically
    useEffect(() => {
        // Only admin should save state
        if (!isAdmin) return;
        
        const save = async () => {
            if (id && matchState) {
                try {
                    await updateMatch(id, {
                        currentState: matchState,
                        history: history.slice(-50), // Keep last 50 for undo
                        status: matchState.matchStatus === 'completed' ? 'completed' : 'live',
                        teamA: { name: matchState.teamAName, playerIds: matchState.teamAPlayerIds },
                        teamB: { name: matchState.teamBName, playerIds: matchState.teamBPlayerIds },
                    });
                } catch (e) {
                    console.error('Auto-save failed:', e);
                }
            }
        };
        const timer = setTimeout(save, 1000); // Debounce saves
        return () => clearTimeout(timer);
    }, [matchState, history, id, isAdmin, updateMatch]);

    // Handle real-time updates for spectators
    useEffect(() => {
        if (!isAdmin && matchDoc?.currentState) {
            updateCurrent(matchDoc.currentState);
        }
    }, [matchDoc?.currentState, isAdmin, updateCurrent]);

    // Handle innings break
    useEffect(() => {
        if (matchState.matchStatus === 'innings_break' && !showInningsBreak && inningsSetupPhase !== 2) {
            setShowInningsBreak(true);
        } else if ((matchState.matchStatus === 'super_over_break' || matchState.matchStatus === 'super_over_break_2') && !showSuperOverBreak && inningsSetupPhase !== 3 && inningsSetupPhase !== 4) {
            setShowSuperOverBreak(true);
        }
    }, [matchState.matchStatus]);

    // Handle match completed
    useEffect(() => {
        if (matchState.matchStatus === 'completed' && !showMatchResult) {
            setShowMatchResult(true);
            // Only update player stats if hasn't been done yet in DB and we are the creator and haven't tried in this session
            if (isAdmin && !matchDoc?.statsUpdated && !statsUpdateAttempted.current) {
                statsUpdateAttempted.current = true;
                updatePlayerStats();
            }
        }
    }, [matchState.matchStatus, showMatchResult, isAdmin, matchDoc?.statsUpdated]);

    const updatePlayerStats = async () => {
        try {
            const allPlayerIds = [...matchState.teamAPlayerIds, ...matchState.teamBPlayerIds];

            // Get stats from both innings
            const fBat = matchState.firstInningsBattingStats || {};
            const fBowl = matchState.firstInningsBowlingStats || {};
            const sBat = matchState.battingStats || {};
            const sBowl = matchState.bowlingStats || {};

            for (const pid of allPlayerIds) {
                const player = await getPlayer(pid);
                if (player) {
                    // Combine batting stats if they participated in either innings
                    let batting = null;
                    if (fBat[pid] || sBat[pid]) {
                        batting = {
                            runs: (fBat[pid]?.runs || 0) + (sBat[pid]?.runs || 0),
                            balls: (fBat[pid]?.balls || 0) + (sBat[pid]?.balls || 0),
                            fours: (fBat[pid]?.fours || 0) + (sBat[pid]?.fours || 0),
                            sixes: (fBat[pid]?.sixes || 0) + (sBat[pid]?.sixes || 0),
                            isOut: (fBat[pid]?.isOut || false) || (sBat[pid]?.isOut || false),
                        };
                    }

                    // Combine bowling stats if they participated in either innings
                    let bowling = null;
                    if (fBowl[pid] || sBowl[pid]) {
                        bowling = {
                            wickets: (fBowl[pid]?.wickets || 0) + (sBowl[pid]?.wickets || 0),
                            runs: (fBowl[pid]?.runs || 0) + (sBowl[pid]?.runs || 0),
                            balls: (fBowl[pid]?.balls || 0) + (sBowl[pid]?.balls || 0),
                        };
                    }

                    const updated = mergeMatchStatsIntoPlayer(player, batting, bowling);
                    await updatePlayer(pid, updated);
                }
            }

            // Mark match as having stats registered to prevent future double updates
            await updateMatch(id, { statsUpdated: true });
        } catch (e) {
            console.error('Failed to update player stats:', e);
            statsUpdateAttempted.current = false; // Allow retry if failed
        }
    };

    const startNextInnings = () => {
        if (matchState.matchStatus === 'innings_break') {
            setShowInningsBreak(false);
            setInningsSetupPhase(2);
        } else if (matchState.matchStatus === 'super_over_break') {
            setShowSuperOverBreak(false);
            setInningsSetupPhase(3);
        } else if (matchState.matchStatus === 'super_over_break_2') {
            setShowSuperOverBreak(false);
            setInningsSetupPhase(4);
        }
    };

    const handleInningsStart = () => {
        if (!si_bat1 || !si_bat2 || !si_bowl || si_bat1 === si_bat2) return;

        let newState;
        if (inningsSetupPhase === 2) {
            newState = createSecondInningsState(matchState, {
                openingBatsman1Id: si_bat1,
                openingBatsman2Id: si_bat2,
                openingBowlerId: si_bowl,
            });
        } else if (inningsSetupPhase === 3) {
            newState = createSuperOverInningsState(matchState, {
                openingBatsman1Id: si_bat1,
                openingBatsman2Id: si_bat2,
                openingBowlerId: si_bowl,
                battingTeamStr: soBattingTeam,
            }, true);
        } else if (inningsSetupPhase === 4) {
            newState = createSuperOverInningsState(matchState, {
                openingBatsman1Id: si_bat1,
                openingBatsman2Id: si_bat2,
                openingBowlerId: si_bowl,
            }, false);
        }

        updateCurrent(newState);
        setInningsSetupPhase(0);
        setSi_bat1('');
        setSi_bat2('');
        setSi_bowl('');
        setSoTossWinner('');
        setSoTossDecision('');
    };

    const soBattingTeam = soTossDecision === 'bat'
        ? soTossWinner
        : (soTossWinner === 'A' ? 'B' : (soTossWinner === 'B' ? 'A' : ''));

    const nextBattingTeamIds = inningsSetupPhase === 3
        ? (soBattingTeam === 'A' ? matchState.teamAPlayerIds : matchState.teamBPlayerIds)
        : (matchState.battingTeam === 'A' ? matchState.teamBPlayerIds : matchState.teamAPlayerIds);

    const nextBowlingTeamIds = inningsSetupPhase === 3
        ? (soBattingTeam === 'A' ? matchState.teamBPlayerIds : matchState.teamAPlayerIds)
        : (matchState.battingTeam === 'A' ? matchState.teamAPlayerIds : matchState.teamBPlayerIds);

    const nextBattingTeamName = inningsSetupPhase === 3
        ? (soBattingTeam === 'A' ? matchState.teamAName : matchState.teamBName)
        : (matchState.battingTeam === 'A' ? matchState.teamBName : matchState.teamAName);

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
            {isAdmin && (
                <div className="mt-3">
                    <ScoringControls
                        players={players}
                        battingTeamPlayerIds={battingTeamPlayerIds}
                    />
                </div>
            )}

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
                    {isAdmin && (
                        <button onClick={startNextInnings} className="btn-primary w-full py-4 text-lg">
                            Start 2nd Innings →
                        </button>
                    )}
                </div>
            </Modal>

            {/* Super Over Break Modal */}
            <Modal
                isOpen={showSuperOverBreak}
                onClose={() => { }}
                title="🔥 SUPER OVER!"
                size="lg"
            >
                <div className="space-y-4 text-center">
                    <div className="text-6xl mb-2 animate-pulse">⚡</div>
                    <h2 className="text-2xl font-bold text-amber-500 mb-2">
                        {matchState.innings === 2 ? "MATCH TIED!" : "INNINGS COMPLETE"}
                    </h2>
                    {matchState.innings === 3 && (
                        <p className="text-surface-300 text-lg">
                            Target to Win: <span className="text-white font-bold">{matchState.target}</span> runs
                        </p>
                    )}
                    <p className="text-surface-400 text-sm">
                        {matchState.innings === 2
                            ? "Get ready for a 1-over tiebreaker."
                            : "One over left. Time to chase!"}
                    </p>
                    {isAdmin && (
                        <button onClick={startNextInnings} className="btn-primary w-full py-4 text-lg">
                            Start Super Over {matchState.innings === 2 ? "1" : "2"} →
                        </button>
                    )}
                </div>
            </Modal>

            {/* Innings Setup */}
            {inningsSetupPhase > 0 && (
                <div className="fixed inset-0 z-50 bg-surface-950/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="card w-full max-w-md space-y-4 animate-bounce-in">
                        <h3 className="text-lg font-bold text-white text-center">
                            {inningsSetupPhase === 2 ? "2nd Innings Setup" : "Super Over Setup"}
                        </h3>

                        {inningsSetupPhase === 3 && !soTossDecision ? (
                            <CoinToss
                                teamAName={matchState.teamAName}
                                teamBName={matchState.teamBName}
                                onTossComplete={(w, d) => {
                                    setSoTossWinner(w);
                                    setSoTossDecision(d);
                                }}
                            />
                        ) : (
                            <>
                                <p className="text-xs text-surface-400 text-center">
                                    {nextBattingTeamName} batting now
                                </p>
                                <div>
                                    <label className="text-xs text-surface-400 mb-1 block">Striker</label>
                                    <select value={si_bat1} onChange={e => setSi_bat1(e.target.value)} className="input text-sm">
                                        <option value="">Select...</option>
                                        {nextBattingTeamIds.filter(id => id !== si_bat2).map(id => (
                                            <option key={id} value={id}>{getPlayerName(id)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-surface-400 mb-1 block">Non-Striker</label>
                                    <select value={si_bat2} onChange={e => setSi_bat2(e.target.value)} className="input text-sm">
                                        <option value="">Select...</option>
                                        {nextBattingTeamIds.filter(id => id !== si_bat1).map(id => (
                                            <option key={id} value={id}>{getPlayerName(id)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-surface-400 mb-1 block">Opening Bowler</label>
                                    <select value={si_bowl} onChange={e => setSi_bowl(e.target.value)} className="input text-sm">
                                        <option value="">Select...</option>
                                        {nextBowlingTeamIds.map(id => (
                                            <option key={id} value={id}>{getPlayerName(id)}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleInningsStart}
                                    disabled={!si_bat1 || !si_bat2 || !si_bowl || si_bat1 === si_bat2}
                                    className="btn-primary w-full py-3 disabled:opacity-40"
                                >
                                    Start Innings
                                </button>
                            </>
                        )}
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
                                {matchState.innings > 2 ? matchState.secondInningsScore?.runs + '/' + matchState.secondInningsScore?.wickets : matchState.runs + '/' + matchState.wickets}
                            </span>
                        </div>
                        {matchState.innings > 2 && (
                            <div className="flex justify-between pt-2 border-t border-surface-800">
                                <span className="text-surface-400">Super Over 1</span>
                                <span className="text-white font-bold">
                                    {matchState.innings > 3 ? matchState.thirdInningsScore?.runs + '/' + matchState.thirdInningsScore?.wickets : matchState.runs + '/' + matchState.wickets}
                                </span>
                            </div>
                        )}
                        {matchState.innings > 3 && (
                            <div className="flex justify-between">
                                <span className="text-surface-400">Super Over 2</span>
                                <span className="text-white font-bold">
                                    {matchState.runs}/{matchState.wickets}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/new-match', {
                                state: {
                                    rematchTeams: {
                                        teamA: matchState.teamAPlayerIds,
                                        teamB: matchState.teamBPlayerIds,
                                        teamAName: matchState.teamAName,
                                        teamBName: matchState.teamBName
                                    }
                                }
                            })}
                            className="btn-primary w-full py-3"
                        >
                            🔄 Rematch
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="btn-secondary flex-1 py-3"
                            >
                                Home
                            </button>
                            <button
                                onClick={() => navigate('/history')}
                                className="btn-secondary flex-1 py-3"
                            >
                                View History
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function LiveMatch() {
    const { id } = useParams();
    const { user } = useAuth();
    const { subscribeToDoc, loading } = useFirestore('matches');
    const { documents: players, fetchAll: fetchPlayers } = useFirestore('players');
    const [matchDoc, setMatchDoc] = useState(null);
    const [initialState, setInitialState] = useState(null);

    useEffect(() => {
        fetchPlayers();
    }, [fetchPlayers]);

    useEffect(() => {
        if (!id) return;
        const unsubscribe = subscribeToDoc(id, (doc) => {
            if (doc) {
                setMatchDoc(doc);
                // Restore state or create new ONLY IF not already set
                setInitialState(prev => {
                    if (prev) return prev;
                    if (doc.currentState) {
                        return doc.currentState;
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
                        return state;
                    }
                });
            }
        });
        return () => unsubscribe();
    }, [id, subscribeToDoc]);

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
            <LiveMatchInner matchDoc={matchDoc} players={players} user={user} />
        </MatchProvider>
    );
}
