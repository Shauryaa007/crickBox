import { useState, useEffect } from 'react';
import { useMatch } from '../../context/MatchContext';
import Modal from '../common/Modal';

export default function ScoringControls({ players, battingTeamPlayerIds }) {
    const {
        matchState, scoreRun, scoreWicket, scoreNoBall, scoreWide,
        togglePowerplay, undo, canUndo, updateCurrent,
    } = useMatch();

    const [wicketModalOpen, setWicketModalOpen] = useState(false);
    const [bowlerModalOpen, setBowlerModalOpen] = useState(false);
    const [batsmanModalOpen, setBatsmanModalOpen] = useState(false);
    const [powerplayAskOpen, setPowerplayAskOpen] = useState(false);
    const [noBallAskOpen, setNoBallAskOpen] = useState(false);

    const getPlayerName = (id) => {
        const p = players.find(pl => pl.id === id);
        return p ? p.name : 'Unknown';
    };

    // Get available batsmen (not already out, not already batting)
    const availableBatsmen = battingTeamPlayerIds.filter(id => {
        if (id === matchState.currentBatsmanId || id === matchState.nonStrikerId) return false;
        const stats = matchState.battingStats[id];
        return !stats || !stats.isOut;
    });

    // Get available bowlers (from bowling team)
    const bowlingTeamIds = matchState.battingTeam === 'A'
        ? matchState.teamBPlayerIds
        : matchState.teamAPlayerIds;
    const availableBowlers = bowlingTeamIds.filter(id => id !== matchState.currentBowlerId);

    // Handle wicket flow
    const handleWicketConfirm = (outBatsmanId, newBatsmanId) => {
        scoreWicket(outBatsmanId, newBatsmanId);
        setWicketModalOpen(false);
    };

    // Use Effect to handle bowler change modal automatically
    useEffect(() => {
        if (matchState.needsBowlerChange && !bowlerModalOpen && matchState.matchStatus === 'live') {
            setBowlerModalOpen(true);
        }
    }, [matchState.needsBowlerChange, matchState.matchStatus]);

    // Handle bowler selection
    const handleBowlerSelect = (bowlerId) => {
        const newBowlingStats = { ...matchState.bowlingStats };
        if (!newBowlingStats[bowlerId]) {
            newBowlingStats[bowlerId] = {
                balls: 0, runs: 0, wickets: 0, noBalls: 0, wides: 0, overs: '0.0',
            };
        }
        updateCurrent({
            currentBowlerId: bowlerId,
            bowlingStats: newBowlingStats,
            needsBowlerChange: false,
        });
        setBowlerModalOpen(false);
        // After bowler is selected, ask for powerplay
        setTimeout(() => setPowerplayAskOpen(true), 300);
    };

    const handleRun = (runs) => {
        scoreRun(runs);
    };

    const isMatchOver = matchState.matchStatus === 'completed' || matchState.matchStatus === 'innings_break';

    return (
        <div className="space-y-3">
            {/* Powerplay & Undo row */}
            <div className="flex gap-2">
                <button
                    onClick={togglePowerplay}
                    disabled={isMatchOver}
                    className={`flex-1 btn text-sm py-3 font-bold transition-all
            ${matchState.isPowerplay
                            ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500 shadow-lg shadow-amber-500/20'
                            : 'bg-surface-800 text-surface-400 border border-surface-600 hover:border-amber-500/50'}`}
                >
                    ⚡ {matchState.isPowerplay ? 'POWERPLAY ON' : 'Powerplay'}
                </button>
                <button
                    onClick={undo}
                    disabled={!canUndo || isMatchOver}
                    className="flex-1 btn bg-surface-800 text-surface-300 border border-surface-600 
            hover:bg-surface-700 hover:text-white text-sm py-3
            disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    ↩️ Undo
                </button>
            </div>

            {/* Run buttons */}
            <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((runs) => (
                    <button
                        key={runs}
                        onClick={() => handleRun(runs)}
                        disabled={isMatchOver}
                        className={`btn-score py-4 ${runs === 0 ? 'text-surface-400' : ''}`}
                    >
                        {runs === 0 ? '•' : `+${runs}`}
                    </button>
                ))}
            </div>

            {/* Boundary buttons */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => handleRun(4)}
                    disabled={isMatchOver}
                    className="btn-score py-5 bg-blue-900/50 border-blue-500/50 text-blue-300
            hover:bg-blue-800/50 shadow-blue-500/10 text-3xl font-black"
                >
                    4️⃣ FOUR
                </button>
                <button
                    onClick={() => handleRun(6)}
                    disabled={isMatchOver}
                    className="btn-score py-5 bg-primary-900/50 border-primary-500/50 text-primary-300
            hover:bg-primary-800/50 shadow-primary-500/10 text-3xl font-black"
                >
                    6️⃣ SIX
                </button>
            </div>

            {/* Extras & Wicket */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => scoreWide(0)}
                    disabled={isMatchOver}
                    className="btn-score py-4 bg-amber-900/30 border-amber-500/40 text-amber-300
            hover:bg-amber-800/40 text-base"
                >
                    WD
                </button>
                <button
                    onClick={() => setNoBallAskOpen(true)}
                    disabled={isMatchOver}
                    className="btn-score py-4 bg-amber-900/30 border-amber-500/40 text-amber-300
            hover:bg-amber-800/40 text-base"
                >
                    NB
                </button>
                <button
                    onClick={() => setWicketModalOpen(true)}
                    disabled={isMatchOver}
                    className="btn-score py-4 bg-red-900/30 border-red-500/40 text-red-300
            hover:bg-red-800/40 text-base font-black"
                >
                    🔴 OUT
                </button>
            </div>

            {/* Wicket Modal */}
            <Modal
                isOpen={wicketModalOpen}
                onClose={() => setWicketModalOpen(false)}
                title="Wicket! Select Batsman Out"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-surface-300">Who got out?</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {/* Show both batsmen if non-striker exists, else only striker (last man) */}
                            {(matchState.nonStrikerId
                                ? [matchState.currentBatsmanId, matchState.nonStrikerId]
                                : [matchState.currentBatsmanId]
                            ).filter(Boolean).map(id => (
                                <button
                                    key={id}
                                    onClick={() => {
                                        if (availableBatsmen.length > 0) {
                                            setWicketModalOpen(false);
                                            window._tempOutBatsman = id;
                                            setTimeout(() => setBatsmanModalOpen(true), 200);
                                        } else {
                                            // No batsmen left (last man out or all out)
                                            handleWicketConfirm(id, null);
                                        }
                                    }}
                                    className="card hover:border-red-500/50 transition-all text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-white">
                                                {getPlayerName(id)}
                                            </span>
                                            <span className="text-xs text-surface-400 ml-2">
                                                {matchState.battingStats[id]?.runs || 0}({matchState.battingStats[id]?.balls || 0})
                                            </span>
                                        </div>
                                        {id === matchState.currentBatsmanId && (
                                            <span className="text-xs text-primary-400">
                                                {matchState.isLastMan ? 'last man' : 'striker'}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* New Batsman Modal */}
            <Modal
                isOpen={batsmanModalOpen}
                onClose={() => setBatsmanModalOpen(false)}
                title="Select New Batsman"
            >
                <div className="space-y-2">
                    {availableBatsmen.map(id => (
                        <button
                            key={id}
                            onClick={() => {
                                handleWicketConfirm(window._tempOutBatsman, id);
                                setBatsmanModalOpen(false);
                            }}
                            className="card w-full text-left hover:border-primary-500/50 transition-all"
                        >
                            <span className="font-semibold text-white">{getPlayerName(id)}</span>
                        </button>
                    ))}
                    {availableBatsmen.length === 0 && (
                        <p className="text-surface-400 text-sm">No batsmen available — innings over</p>
                    )}
                </div>
            </Modal>

            {/* Bowler Change Modal */}
            <Modal
                isOpen={bowlerModalOpen}
                onClose={() => { }} // Force selection
                title="Select New Bowler"
            >
                <div className="space-y-2">
                    {availableBowlers.map(id => {
                        const stats = matchState.bowlingStats[id];
                        return (
                            <button
                                key={id}
                                onClick={() => handleBowlerSelect(id)}
                                className="card w-full text-left hover:border-primary-500/50 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-white">{getPlayerName(id)}</span>
                                    {stats && (
                                        <span className="text-xs text-surface-400">
                                            {stats.overs}ov - {stats.runs}r - {stats.wickets}w
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Modal>

            {/* Powerplay Ask Modal */}
            <Modal
                isOpen={powerplayAskOpen}
                onClose={() => setPowerplayAskOpen(false)}
                title="⚡ Powerplay"
            >
                <div className="text-center space-y-4">
                    <div className="text-4xl mb-2">⚡</div>
                    <p className="text-white font-bold">Enable Powerplay for this over?</p>
                    <p className="text-xs text-surface-400">Runs will be doubled during Powerplay!</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (!matchState.isPowerplay) togglePowerplay();
                                setPowerplayAskOpen(false);
                            }}
                            className="btn-primary flex-1 py-3"
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => {
                                if (matchState.isPowerplay) togglePowerplay();
                                setPowerplayAskOpen(false);
                            }}
                            className="btn-secondary flex-1 py-3"
                        >
                            No
                        </button>
                    </div>
                </div>
            </Modal>

            {/* No Ball Modal */}
            <Modal
                isOpen={noBallAskOpen}
                onClose={() => setNoBallAskOpen(false)}
                title="No Ball details"
            >
                <div>
                    <h4 className="text-sm font-medium text-surface-300 mb-3 text-center">
                        Runs scored off the bat on this No Ball?
                    </h4>
                    <div className="grid grid-cols-3 gap-2 block">
                        {[0, 1, 2, 3, 4, 6].map(runs => (
                            <button
                                key={runs}
                                onClick={() => {
                                    scoreNoBall(runs);
                                    setNoBallAskOpen(false);
                                }}
                                className="btn-score py-4 bg-surface-800 border-surface-600 hover:border-amber-500 hover:text-amber-400"
                            >
                                {runs === 0 ? '0 (Just NB)' : `+${runs}`}
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
