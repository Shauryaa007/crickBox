import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { getOversString } from '../lib/matchEngine';

export default function MatchDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getById } = useFirestore('matches');
    const { documents: players, fetchAll: fetchPlayers } = useFirestore('players');
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('scorecard');

    useEffect(() => {
        fetchPlayers();
    }, [fetchPlayers]);

    useEffect(() => {
        const load = async () => {
            const doc = await getById(id);
            setMatch(doc);
            setLoading(false);
        };
        if (id) load();
    }, [id]);

    const getPlayerName = (pid) => {
        const p = players.find(pl => pl.id === pid);
        return p ? p.name : 'Unknown';
    };

    if (loading || !match || players.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl animate-bounce">🏏</div>
                    <p className="text-surface-400 mt-3">Loading match details...</p>
                </div>
            </div>
        );
    }

    const state = match.currentState;
    if (!state) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-surface-400">No match data found.</p>
            </div>
        );
    }

    const teamAName = state.teamAName || match.teamA?.name || 'Team A';
    const teamBName = state.teamBName || match.teamB?.name || 'Team B';
    const firstBatIsA = match.firstBattingTeam === 'A';
    const firstBattingTeamName = firstBatIsA ? teamAName : teamBName;
    const secondBattingTeamName = firstBatIsA ? teamBName : teamAName;
    const firstBattingPlayerIds = firstBatIsA ? state.teamAPlayerIds : state.teamBPlayerIds;
    const secondBattingPlayerIds = firstBatIsA ? state.teamBPlayerIds : state.teamAPlayerIds;
    const firstBowlingPlayerIds = firstBatIsA ? state.teamBPlayerIds : state.teamAPlayerIds;
    const secondBowlingPlayerIds = firstBatIsA ? state.teamAPlayerIds : state.teamBPlayerIds;

    const ballLog = state.ballLog || [];

    const getInningsData = (num) => {
        if (num === 1) {
            return {
                title: `1st Innings — ${firstBattingTeamName}`,
                batTeam: firstBattingTeamName,
                bowlTeam: secondBattingTeamName,
                batIds: firstBattingPlayerIds,
                bowlIds: firstBowlingPlayerIds,
                batStats: state.firstInningsBattingStats || {},
                bowlStats: state.firstInningsBowlingStats || {},
                score: state.firstInningsScore || null,
                balls: ballLog.filter(b => b.innings === 1)
            };
        }
        if (num === 2) {
            return {
                title: `2nd Innings — ${secondBattingTeamName}`,
                batTeam: secondBattingTeamName,
                bowlTeam: firstBattingTeamName,
                batIds: secondBattingPlayerIds,
                bowlIds: secondBowlingPlayerIds,
                batStats: state.innings >= 3 ? state.secondInningsBattingStats : state.battingStats || {},
                bowlStats: state.innings >= 3 ? state.secondInningsBowlingStats : state.bowlingStats || {},
                score: state.innings >= 3 ? state.secondInningsScore : { runs: state.runs, wickets: state.wickets, balls: state.balls },
                balls: ballLog.filter(b => b.innings === 2)
            };
        }
        if (num === 3) {
            if (state.innings < 3) return null;
            return {
                title: `Super Over 1 — ${secondBattingTeamName}`,
                batTeam: secondBattingTeamName,
                bowlTeam: firstBattingTeamName,
                batIds: secondBattingPlayerIds,
                bowlIds: secondBowlingPlayerIds,
                batStats: state.innings >= 4 ? state.thirdInningsBattingStats : state.battingStats || {},
                bowlStats: state.innings >= 4 ? state.thirdInningsBowlingStats : state.bowlingStats || {},
                score: state.innings >= 4 ? state.thirdInningsScore : { runs: state.runs, wickets: state.wickets, balls: state.balls },
                balls: ballLog.filter(b => b.innings === 3)
            };
        }
        if (num === 4) {
            if (state.innings < 4) return null;
            return {
                title: `Super Over 2 — ${firstBattingTeamName}`,
                batTeam: firstBattingTeamName,
                bowlTeam: secondBattingTeamName,
                batIds: firstBattingPlayerIds,
                bowlIds: firstBowlingPlayerIds,
                batStats: state.battingStats || {},
                bowlStats: state.bowlingStats || {},
                score: { runs: state.runs, wickets: state.wickets, balls: state.balls },
                balls: ballLog.filter(b => b.innings === 4)
            };
        }
        return null;
    };
    
    const inningsList = [1, 2, 3, 4]
        .map(n => getInningsData(n))
        .filter(Boolean);

    // Group balls by over
    function groupByOvers(balls) {
        const overs = {};
        balls.forEach((ball) => {
            const overNum = ball.over;
            if (!overs[overNum]) overs[overNum] = [];
            overs[overNum].push(ball);
        });
        return overs;
    }

    const renderBattingCard = (title, playerIds, battingStats, score) => {
        // Get all batsmen who have stats (batted)
        const battedIds = playerIds.filter(id => battingStats[id]);
        const didNotBatIds = playerIds.filter(id => !battingStats[id]);

        return (
            <div className="card mb-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white">{title} — Batting</h3>
                    {score && (
                        <span className="text-sm font-bold text-primary-400">
                            {score.runs}/{score.wickets} ({getOversString(score.balls)})
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-7 text-[10px] text-surface-500 font-medium mb-1 px-1">
                    <div className="col-span-3">BATTER</div>
                    <div className="text-center">R</div>
                    <div className="text-center">B</div>
                    <div className="text-center">4s</div>
                    <div className="text-center">6s</div>
                </div>
                {battedIds.map(pid => {
                    const s = battingStats[pid];
                    const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : '0';
                    return (
                        <div key={pid} className={`grid grid-cols-7 items-center py-1.5 px-1 text-sm border-b border-surface-800 ${s.isOut ? '' : 'bg-primary-500/5'}`}>
                            <div className="col-span-3 min-w-0">
                                <span className={`truncate block ${s.isOut ? 'text-surface-400' : 'text-white font-semibold'}`}>
                                    {getPlayerName(pid)}
                                    {s.isOut && <span className="text-[10px] text-red-400 ml-1">({s.dismissalType || 'out'})</span>}
                                    {!s.isOut && <span className="text-[10px] text-primary-400 ml-1">*</span>}
                                </span>
                            </div>
                            <div className={`text-center font-bold ${s.isOut ? 'text-surface-300' : 'text-white'}`}>{s.runs}</div>
                            <div className="text-center text-surface-400">{s.balls}</div>
                            <div className="text-center text-blue-400">{s.fours || 0}</div>
                            <div className="text-center text-primary-400">{s.sixes || 0}</div>
                        </div>
                    );
                })}
                {didNotBatIds.length > 0 && (
                    <div className="mt-2 text-xs text-surface-500 px-1">
                        <span className="font-medium">Did not bat: </span>
                        {didNotBatIds.map(id => getPlayerName(id)).join(', ')}
                    </div>
                )}
            </div>
        );
    };

    const renderBowlingCard = (title, playerIds, bowlingStats) => {
        const bowledIds = playerIds.filter(id => bowlingStats[id]);

        return (
            <div className="card mb-3">
                <h3 className="text-sm font-bold text-white mb-3">{title} — Bowling</h3>
                <div className="grid grid-cols-7 text-[10px] text-surface-500 font-medium mb-1 px-1">
                    <div className="col-span-3">BOWLER</div>
                    <div className="text-center">O</div>
                    <div className="text-center">R</div>
                    <div className="text-center">W</div>
                    <div className="text-center">Econ</div>
                </div>
                {bowledIds.map(pid => {
                    const s = bowlingStats[pid];
                    const overs = s.balls / 6;
                    const economy = overs > 0 ? (s.runs / overs).toFixed(1) : '0.0';
                    return (
                        <div key={pid} className="grid grid-cols-7 items-center py-1.5 px-1 text-sm border-b border-surface-800">
                            <div className="col-span-3 min-w-0">
                                <span className="text-white truncate block">{getPlayerName(pid)}</span>
                            </div>
                            <div className="text-center text-surface-300">{s.overs || getOversString(s.balls)}</div>
                            <div className="text-center text-surface-300">{s.runs}</div>
                            <div className="text-center font-bold text-red-400">{s.wickets}</div>
                            <div className="text-center text-surface-400">{economy}</div>
                        </div>
                    );
                })}
                {bowledIds.length === 0 && (
                    <p className="text-xs text-surface-500 px-1 py-2">No bowling data available</p>
                )}
            </div>
        );
    };

    const renderBallByBall = (balls, inningsLabel) => {
        const overs = groupByOvers(balls);
        const overNumbers = Object.keys(overs).map(Number).sort((a, b) => a - b);

        if (overNumbers.length === 0) {
            return (
                <div className="card mb-3">
                    <h3 className="text-sm font-bold text-white mb-2">{inningsLabel}</h3>
                    <p className="text-xs text-surface-500">No ball-by-ball data available for this innings.</p>
                </div>
            );
        }

        return (
            <div className="card mb-3">
                <h3 className="text-sm font-bold text-white mb-3">{inningsLabel}</h3>
                <div className="space-y-3">
                    {overNumbers.map(overNum => {
                        const overBalls = overs[overNum];
                        const overRuns = overBalls.reduce((sum, b) => sum + (b.actualRuns || 0), 0);
                        const bowlerName = getPlayerName(overBalls[0]?.bowlerId);

                        return (
                            <div key={overNum} className="border-b border-surface-800 pb-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-surface-300 bg-surface-800 px-2 py-0.5 rounded">
                                            Over {overNum + 1}
                                        </span>
                                        <span className="text-[10px] text-surface-500">{bowlerName}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-surface-300">{overRuns} runs</span>
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {overBalls.map((ball, i) => {
                                        let bgColor = 'bg-surface-700 border-surface-600 text-surface-300';
                                        if (ball.result === 'W') bgColor = 'bg-red-500/20 border-red-500/50 text-red-400';
                                        else if (ball.result === '4') bgColor = 'bg-blue-500/20 border-blue-500/50 text-blue-400';
                                        else if (ball.result === '6') bgColor = 'bg-primary-500/20 border-primary-500/50 text-primary-400';
                                        else if (ball.result === '•') bgColor = 'bg-surface-700 border-surface-600 text-surface-500';
                                        else if (ball.isExtra) bgColor = 'bg-amber-500/20 border-amber-500/50 text-amber-400';

                                        return (
                                            <div key={i} className="relative group">
                                                <div className={`ball-dot ${bgColor}`}>
                                                    {ball.result === '•' ? '·' : ball.result}
                                                </div>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                                                    <div className="bg-surface-900 border border-surface-700 rounded-lg px-2 py-1 text-[10px] text-surface-300 whitespace-nowrap shadow-lg">
                                                        <div>{getPlayerName(ball.batsmanId)}</div>
                                                        {ball.isPowerplay && <div className="text-amber-400">⚡ PP</div>}
                                                        <div className="text-surface-500">
                                                            Score: {ball.totalScore}/{ball.totalWickets}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-16 pb-24 px-4 max-w-lg mx-auto">
            {/* Top bar */}
            <div className="fixed top-0 left-0 right-0 z-50 glass px-4 py-2">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <button
                        onClick={() => navigate('/history')}
                        className="text-surface-400 hover:text-white text-sm"
                    >
                        ← History
                    </button>
                    <span className="text-xs font-semibold text-surface-300">
                        Match Details
                    </span>
                    <div className="w-16" />
                </div>
            </div>

            {/* Hide navbar */}
            <style>{`nav, header { display: none !important; }`}</style>

            {/* Match header */}
            <div className="card-glow mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="badge bg-primary-500/20 text-primary-400 border border-primary-500/30">
                            Completed
                        </span>
                        <span className="text-xs text-surface-500">{match.overs} overs</span>
                        {match.createdAt && (
                            <span className="text-xs text-surface-500 ml-auto">
                                {new Date(match.createdAt?.seconds * 1000).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {/* Score summary */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-base">{firstBattingTeamName}</span>
                            {state.firstInningsScore && (
                                <span className="text-lg font-black text-white">
                                    {state.firstInningsScore.runs}/{state.firstInningsScore.wickets}
                                    <span className="text-xs text-surface-400 font-normal ml-1">
                                        ({getOversString(state.firstInningsScore.balls)})
                                    </span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-base">{secondBattingTeamName}</span>
                            <span className="text-lg font-black text-white">
                                {state.innings > 2 ? state.secondInningsScore?.runs + '/' + state.secondInningsScore?.wickets : state.runs + '/' + state.wickets}
                                <span className="text-xs text-surface-400 font-normal ml-1">
                                    ({getOversString(state.innings > 2 ? state.secondInningsScore?.balls : state.balls)})
                                </span>
                            </span>
                        </div>
                        {state.innings > 2 && (
                            <div className="flex items-center justify-between pt-2 border-t border-surface-700/50">
                                <span className="font-bold text-surface-300 text-sm">Super Over 1 ({secondBattingTeamName})</span>
                                <span className="text-base font-black text-white">
                                    {state.innings > 3 ? state.thirdInningsScore?.runs + '/' + state.thirdInningsScore?.wickets : state.runs + '/' + state.wickets}
                                    <span className="text-xs text-surface-400 font-normal ml-1">
                                        ({getOversString(state.innings > 3 ? state.thirdInningsScore?.balls : state.balls)})
                                    </span>
                                </span>
                            </div>
                        )}
                        {state.innings > 3 && (
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-surface-300 text-sm">Super Over 2 ({firstBattingTeamName})</span>
                                <span className="text-base font-black text-white">
                                    {state.runs}/{state.wickets}
                                    <span className="text-xs text-surface-400 font-normal ml-1">
                                        ({getOversString(state.balls)})
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>

                    {state.result && (
                        <div className="mt-3 pt-3 border-t border-surface-700/50">
                            <p className="text-sm font-bold text-primary-400 text-center mb-3">
                                🏆 {state.result}
                            </p>
                            <button
                                onClick={() => navigate('/new-match', {
                                    state: {
                                        rematchTeams: {
                                            teamA: state.teamAPlayerIds,
                                            teamB: state.teamBPlayerIds,
                                            teamAName: teamAName,
                                            teamBName: teamBName
                                        }
                                    }
                                })}
                                className="btn-primary w-full py-2.5 text-sm"
                            >
                                🔄 Rematch
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-1 mb-4 bg-surface-800/50 rounded-xl p-1">
                {[
                    { key: 'scorecard', label: 'Scorecard' },
                    { key: 'ballbyball', label: 'Ball by Ball' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === tab.key
                                ? 'bg-primary-600 text-white shadow-lg'
                                : 'text-surface-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scorecard Tab */}
            {activeTab === 'scorecard' && (
                <div className="animate-fade-in space-y-6">
                    {inningsList.map((indata, i) => (
                        <div key={i}>
                            <div className="mb-2">
                                <h2 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">
                                    {indata.title}
                                </h2>
                            </div>
                            {renderBattingCard(
                                indata.batTeam,
                                indata.batIds,
                                indata.batStats,
                                indata.score
                            )}
                            {renderBowlingCard(
                                indata.bowlTeam,
                                indata.bowlIds,
                                indata.bowlStats
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Ball by Ball Tab */}
            {activeTab === 'ballbyball' && (
                <div className="animate-fade-in space-y-4">
                    {inningsList.map((indata, i) => (
                        <div key={i} className="mb-4">
                            {renderBallByBall(indata.balls, indata.title)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
