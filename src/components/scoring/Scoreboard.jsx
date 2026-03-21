import { useMatch } from '../../context/MatchContext';
import { getOversString, getRunRate, getRequiredRunRate } from '../../lib/matchEngine';

export default function Scoreboard({ players }) {
    const { matchState } = useMatch();

    const getPlayerName = (id) => {
        const p = players.find(pl => pl.id === id);
        return p ? p.name : 'TBD';
    };

    const striker = matchState.battingStats[matchState.currentBatsmanId];
    const nonStriker = matchState.battingStats[matchState.nonStrikerId];
    const bowler = matchState.bowlingStats[matchState.currentBowlerId];

    const battingTeamName = matchState.battingTeam === 'A'
        ? matchState.teamAName : matchState.teamBName;
    const bowlingTeamName = matchState.battingTeam === 'A'
        ? matchState.teamBName : matchState.teamAName;

    const totalBallsRemaining = (matchState.totalOvers * 6) - matchState.balls;
    const runRate = getRunRate(matchState.runs, matchState.balls);

    return (
        <div className="space-y-3">
            {/* Main score card */}
            <div className="card-glow relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                <div className="relative">
                    {/* Status badges */}
                    <div className="flex items-center gap-2 mb-3">
                        {matchState.matchStatus === 'live' && (
                            <span className="badge-live flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse-fast" />
                                LIVE
                            </span>
                        )}
                        {matchState.isPowerplay && (
                            <span className="badge-powerplay flex items-center gap-1">
                                ⚡ POWERPLAY
                            </span>
                        )}
                        <span className="text-xs text-surface-400 ml-auto">
                            Innings {matchState.innings}
                        </span>
                    </div>

                    {/* Team & Score */}
                    <div className="flex items-baseline justify-between">
                        <div>
                            <h2 className="text-sm font-medium text-surface-300">{battingTeamName}</h2>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white tabular-nums tracking-tight text-glow">
                                    {matchState.runs}
                                </span>
                                <span className="text-2xl font-bold text-surface-400">/</span>
                                <span className="text-2xl font-bold text-red-400">{matchState.wickets}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-surface-200 font-mono">
                                {getOversString(matchState.balls)}
                            </div>
                            <div className="text-xs text-surface-400">
                                of {matchState.totalOvers} overs
                            </div>
                        </div>
                    </div>

                    {/* Run rate & target */}
                    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-surface-700/50">
                        <div className="text-xs text-surface-400">
                            CRR: <span className="text-white font-semibold">{runRate}</span>
                        </div>
                        {matchState.innings === 2 && matchState.target && (
                            <>
                                <div className="text-xs text-surface-400">
                                    Target: <span className="text-amber-400 font-semibold">{matchState.target}</span>
                                </div>
                                <div className="text-xs text-surface-400">
                                    Need: <span className="text-red-400 font-semibold">
                                        {matchState.target - matchState.runs} off {totalBallsRemaining}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* First innings score */}
                    {matchState.firstInningsScore && (
                        <div className="text-xs text-surface-400 mt-1">
                            {matchState.battingTeam === 'A' ? matchState.teamBName : matchState.teamAName}:{' '}
                            <span className="text-white">
                                {matchState.firstInningsScore.runs}/{matchState.firstInningsScore.wickets}
                            </span>
                            {' '}({getOversString(matchState.firstInningsScore.balls)})
                        </div>
                    )}
                </div>
            </div>

            {/* Batsmen info */}
            <div className="card">
                <div className="grid grid-cols-5 text-[10px] text-surface-500 font-medium mb-2 px-1">
                    <div className="col-span-2">BATTER</div>
                    <div className="text-center">R</div>
                    <div className="text-center">B</div>
                    <div className="text-center">SR</div>
                </div>
                {/* Striker */}
                <div className="grid grid-cols-5 items-center py-2 px-1 rounded-lg bg-primary-500/5">
                    <div className="col-span-2 flex items-center gap-1.5 min-w-0">
                        <span className="text-primary-400 text-xs">🏏</span>
                        <span className="font-semibold text-sm text-white truncate">
                            {getPlayerName(matchState.currentBatsmanId)}
                        </span>
                        <span className="text-[8px] text-primary-400 font-bold">*</span>
                    </div>
                    <div className="text-center font-bold text-sm text-white">
                        {striker?.runs || 0}
                    </div>
                    <div className="text-center text-sm text-surface-300">
                        {striker?.balls || 0}
                    </div>
                    <div className="text-center text-sm text-surface-400">
                        {striker?.balls > 0
                            ? ((striker.runs / striker.balls) * 100).toFixed(0)
                            : '0'}
                    </div>
                </div>
                {/* Non-striker */}
                <div className="grid grid-cols-5 items-center py-2 px-1">
                    <div className="col-span-2 flex items-center gap-1.5 min-w-0">
                        <span className="text-surface-500 text-xs">🏏</span>
                        <span className="text-sm text-surface-300 truncate">
                            {getPlayerName(matchState.nonStrikerId)}
                        </span>
                    </div>
                    <div className="text-center text-sm text-surface-300">
                        {nonStriker?.runs || 0}
                    </div>
                    <div className="text-center text-sm text-surface-400">
                        {nonStriker?.balls || 0}
                    </div>
                    <div className="text-center text-sm text-surface-400">
                        {nonStriker?.balls > 0
                            ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(0)
                            : '0'}
                    </div>
                </div>
            </div>

            {/* Bowler info */}
            <div className="card">
                <div className="grid grid-cols-5 text-[10px] text-surface-500 font-medium mb-2 px-1">
                    <div className="col-span-2">BOWLER</div>
                    <div className="text-center">O</div>
                    <div className="text-center">R</div>
                    <div className="text-center">W</div>
                </div>
                <div className="grid grid-cols-5 items-center py-2 px-1">
                    <div className="col-span-2 flex items-center gap-1.5 min-w-0">
                        <span className="text-xs">🎳</span>
                        <span className="font-semibold text-sm text-white truncate">
                            {getPlayerName(matchState.currentBowlerId)}
                        </span>
                    </div>
                    <div className="text-center text-sm text-surface-300">
                        {bowler?.overs || '0.0'}
                    </div>
                    <div className="text-center text-sm text-surface-300">
                        {bowler?.runs || 0}
                    </div>
                    <div className="text-center font-bold text-sm text-red-400">
                        {bowler?.wickets || 0}
                    </div>
                </div>
            </div>

            {/* Current over balls */}
            {matchState.currentOverBalls.length > 0 && (
                <div className="card">
                    <div className="text-[10px] text-surface-500 font-medium mb-2">THIS OVER</div>
                    <div className="flex gap-2 flex-wrap">
                        {matchState.currentOverBalls.map((ball, i) => {
                            let bgColor = 'bg-surface-700 border-surface-600 text-surface-300';
                            if (ball === 'W') bgColor = 'bg-red-500/20 border-red-500/50 text-red-400';
                            else if (ball === '4') bgColor = 'bg-blue-500/20 border-blue-500/50 text-blue-400';
                            else if (ball === '6') bgColor = 'bg-primary-500/20 border-primary-500/50 text-primary-400';
                            else if (ball === '•') bgColor = 'bg-surface-700 border-surface-600 text-surface-500';
                            else if (ball.startsWith('WD') || ball.startsWith('NB'))
                                bgColor = 'bg-amber-500/20 border-amber-500/50 text-amber-400';

                            return (
                                <div key={i} className={`ball-dot ${bgColor}`}>
                                    {ball === '•' ? '·' : ball}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
