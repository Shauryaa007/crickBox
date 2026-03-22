import { useMatch } from '../../context/MatchContext';
import { getOversString } from '../../lib/matchEngine';

export default function FullScorecard({ players }) {
    const { matchState } = useMatch();

    const getPlayerName = (pid) => {
        const p = players.find(pl => pl.id === pid);
        return p ? p.name : 'Unknown';
    };

    const teamAName = matchState.teamAName || 'Team A';
    const teamBName = matchState.teamBName || 'Team B';
    
    // Determine batting order from innings history if available, or current state
    const ballLog = matchState.ballLog || [];

    const getInningsData = (num) => {
        if (num === 1) {
            if (matchState.innings === 1) {
                const isBatA = matchState.battingTeam === 'A';
                return {
                    title: `1st Innings — ${isBatA ? teamAName : teamBName}`,
                    batTeam: isBatA ? teamAName : teamBName,
                    bowlTeam: isBatA ? teamBName : teamAName,
                    batIds: isBatA ? matchState.teamAPlayerIds : matchState.teamBPlayerIds,
                    bowlIds: isBatA ? matchState.teamBPlayerIds : matchState.teamAPlayerIds,
                    batStats: matchState.battingStats || {},
                    bowlStats: matchState.bowlingStats || {},
                    score: { runs: matchState.runs, wickets: matchState.wickets, balls: matchState.balls },
                    balls: ballLog.filter(b => b.innings === 1)
                };
            }
            const isFirstBatA = (matchState.firstInningsBattingStats && Object.keys(matchState.firstInningsBattingStats).some(id => matchState.teamAPlayerIds.includes(id)));
            // Fallback to current batting team logic if needed, but matchEngine usually handles this
            const batTeam = isFirstBatA ? teamAName : teamBName;
            const bowlTeam = isFirstBatA ? teamBName : teamAName;

            return {
                title: `1st Innings — ${batTeam}`,
                batTeam,
                bowlTeam,
                batIds: isFirstBatA ? matchState.teamAPlayerIds : matchState.teamBPlayerIds,
                bowlIds: isFirstBatA ? matchState.teamBPlayerIds : matchState.teamAPlayerIds,
                batStats: matchState.firstInningsBattingStats || {},
                bowlStats: matchState.firstInningsBowlingStats || {},
                score: matchState.firstInningsScore || null,
                balls: ballLog.filter(b => b.innings === 1)
            };
        }
        if (num === 2) {
            if (matchState.innings < 2) return null;
            if (matchState.innings === 2) {
                const isBatA = matchState.battingTeam === 'A';
                return {
                    title: `2nd Innings — ${isBatA ? teamAName : teamBName}`,
                    batTeam: isBatA ? teamAName : teamBName,
                    bowlTeam: isBatA ? teamBName : teamAName,
                    batIds: isBatA ? matchState.teamAPlayerIds : matchState.teamBPlayerIds,
                    bowlIds: isBatA ? matchState.teamBPlayerIds : matchState.teamAPlayerIds,
                    batStats: matchState.battingStats || {},
                    bowlStats: matchState.bowlingStats || {},
                    score: { runs: matchState.runs, wickets: matchState.wickets, balls: matchState.balls },
                    balls: ballLog.filter(b => b.innings === 2)
                };
            }
            const isSecondBatA = (matchState.secondInningsBattingStats && Object.keys(matchState.secondInningsBattingStats).some(id => matchState.teamAPlayerIds.includes(id)));
            const batTeam = isSecondBatA ? teamAName : teamBName;
            const bowlTeam = isSecondBatA ? teamBName : teamAName;
            return {
                title: `2nd Innings — ${batTeam}`,
                batTeam,
                bowlTeam,
                batIds: isSecondBatA ? matchState.teamAPlayerIds : matchState.teamBPlayerIds,
                bowlIds: isSecondBatA ? matchState.teamBPlayerIds : matchState.teamAPlayerIds,
                batStats: matchState.secondInningsBattingStats || {},
                bowlStats: matchState.secondInningsBowlingStats || {},
                score: matchState.secondInningsScore || null,
                balls: ballLog.filter(b => b.innings === 2)
            };
        }
        if (num === 3) {
            if (matchState.innings < 3) return null;
            if (matchState.innings === 3) {
                const isBatA = matchState.battingTeam === 'A';
                return {
                    title: `Super Over 1 — ${isBatA ? teamAName : teamBName}`,
                    batTeam: isBatA ? teamAName : teamBName,
                    bowlTeam: isBatA ? teamBName : teamAName,
                    batIds: isBatA ? matchState.teamAPlayerIds : matchState.teamBPlayerIds,
                    bowlIds: isBatA ? matchState.teamBPlayerIds : matchState.teamAPlayerIds,
                    batStats: matchState.battingStats || {},
                    bowlStats: matchState.bowlingStats || {},
                    score: { runs: matchState.runs, wickets: matchState.wickets, balls: matchState.balls },
                    balls: ballLog.filter(b => b.innings === 3)
                };
            }
            const isThirdBatA = (matchState.thirdInningsBattingStats && Object.keys(matchState.thirdInningsBattingStats).some(id => matchState.teamAPlayerIds.includes(id)));
            const batTeam = isThirdBatA ? teamAName : teamBName;
            const bowlTeam = isThirdBatA ? teamBName : teamAName;
            return {
                title: `Super Over 1 — ${batTeam}`,
                batTeam,
                bowlTeam,
                batIds: isThirdBatA ? matchState.teamAPlayerIds : matchState.teamBPlayerIds,
                bowlIds: isThirdBatA ? matchState.teamBPlayerIds : matchState.teamAPlayerIds,
                batStats: matchState.thirdInningsBattingStats || {},
                bowlStats: matchState.thirdInningsBowlingStats || {},
                score: matchState.thirdInningsScore || null,
                balls: ballLog.filter(b => b.innings === 3)
            };
        }
        if (num === 4) {
            if (matchState.innings < 4) return null;
            const isBatA = matchState.battingTeam === 'A';
            return {
                title: `Super Over 2 — ${isBatA ? teamAName : teamBName}`,
                batTeam: isBatA ? teamAName : teamBName,
                bowlTeam: isBatA ? teamBName : teamAName,
                batIds: isBatA ? matchState.teamAPlayerIds : matchState.teamBPlayerIds,
                bowlIds: isBatA ? matchState.teamBPlayerIds : matchState.teamAPlayerIds,
                batStats: matchState.battingStats || {},
                bowlStats: matchState.bowlingStats || {},
                score: { runs: matchState.runs, wickets: matchState.wickets, balls: matchState.balls },
                balls: ballLog.filter(b => b.innings === 4)
            };
        }
        return null;
    };

    const inningsList = [1, 2, 3, 4]
        .map(n => getInningsData(n))
        .filter(Boolean);

    const renderBattingCard = (title, playerIds, battingStats, score) => {
        const battedIds = playerIds.filter(id => battingStats[id]);
        const didNotBatIds = playerIds.filter(id => !battingStats[id]);

        return (
            <div className="card mb-3">
                <div className="flex items-center justify-between mb-3 border-b border-surface-800 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">{title}</h3>
                    {score && (
                        <span className="text-sm font-bold text-primary-400">
                            {score.runs}/{score.wickets} <span className="text-[10px] text-surface-400 font-normal">({getOversString(score.balls)})</span>
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-7 text-[10px] text-surface-500 font-medium mb-1 px-1 uppercase">
                    <div className="col-span-3">BATTER</div>
                    <div className="text-center">R</div>
                    <div className="text-center">B</div>
                    <div className="text-center">4s</div>
                    <div className="text-center">6s</div>
                </div>
                {battedIds.map(pid => {
                    const s = battingStats[pid];
                    return (
                        <div key={pid} className={`grid grid-cols-7 items-center py-2 px-1 text-sm border-b border-surface-800 last:border-0 ${s.isOut ? '' : 'bg-primary-500/5 rounded-sm'}`}>
                            <div className="col-span-3 min-w-0">
                                <span className={`truncate block ${s.isOut ? 'text-surface-400' : 'text-white font-semibold'}`}>
                                    {getPlayerName(pid)}
                                    {s.isOut && <span className="text-[10px] text-red-400 ml-1">({s.dismissalType || 'out'})</span>}
                                    {!s.isOut && <span className="text-[10px] text-primary-400 ml-1 font-black">*</span>}
                                </span>
                            </div>
                            <div className={`text-center font-bold ${s.isOut ? 'text-surface-300' : 'text-white'}`}>{s.runs}</div>
                            <div className="text-center text-surface-400 text-xs">{s.balls}</div>
                            <div className="text-center text-blue-400 text-xs">{s.fours || 0}</div>
                            <div className="text-center text-primary-400 text-xs">{s.sixes || 0}</div>
                        </div>
                    );
                })}
                {didNotBatIds.length > 0 && (
                    <div className="mt-2 text-[10px] text-surface-500 px-1 italic">
                        <span className="font-medium not-italic">Did not bat: </span>
                        {didNotBatIds.map(id => getPlayerName(id)).join(', ')}
                    </div>
                )}
            </div>
        );
    };

    const renderBowlingCard = (title, playerIds, bowlingStats) => {
        const bowledIds = playerIds.filter(id => bowlingStats[id]);

        return (
            <div className="card mb-4 bg-surface-900/40">
                <h3 className="text-xs font-bold text-surface-400 mb-3 uppercase tracking-wider">{title} Bowling</h3>
                <div className="grid grid-cols-7 text-[10px] text-surface-500 font-medium mb-1 px-1 uppercase">
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
                        <div key={pid} className="grid grid-cols-7 items-center py-2 px-1 text-sm border-b border-surface-800/50 last:border-0">
                            <div className="col-span-3 min-w-0">
                                <span className="text-surface-200 truncate block">{getPlayerName(pid)}</span>
                            </div>
                            <div className="text-center text-surface-300 text-xs">{s.overs || getOversString(s.balls)}</div>
                            <div className="text-center text-surface-300 text-xs">{s.runs}</div>
                            <div className="text-center font-bold text-red-400">{s.wickets}</div>
                            <div className="text-center text-surface-500 text-xs">{economy}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            {inningsList.length === 0 ? (
                <div className="card text-center py-10 text-surface-500">
                    No scores available yet
                </div>
            ) : (
                inningsList.map((indata, i) => (
                    <div key={i}>
                        {renderBattingCard(
                            indata.title,
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
                ))
            )}
        </div>
    );
}
