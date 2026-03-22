import { useState } from 'react';

export default function CoinToss({ teamAName, teamBName, onTossComplete }) {
    // onTossComplete(winnerTeam, decision) -> winnerTeam is 'A' or 'B', decision is 'bat' or 'bowl'
    const [phase, setPhase] = useState('pending'); // pending, flipping, won, deciding
    const [winner, setWinner] = useState(null);

    const tossCoin = () => {
        setPhase('flipping');
        setTimeout(() => {
            const isAWinner = Math.random() > 0.5;
            setWinner(isAWinner ? 'A' : 'B');
            setPhase('won');
        }, 1500);
    };

    if (phase === 'pending') {
        return (
            <div className="text-center py-6 animate-fade-in">
                <div className="text-6xl mb-4 text-amber-500">🪙</div>
                <h3 className="text-lg font-bold text-white mb-2">Coin Toss</h3>
                <p className="text-surface-400 text-sm mb-6">Who will bat first?</p>
                <button onClick={tossCoin} className="btn-primary w-full py-4 text-lg border-amber-500/50 hover:bg-amber-600/20">
                    Toss Coin
                </button>
            </div>
        );
    }
    
    if (phase === 'flipping') {
        return (
            <div className="text-center py-6">
                <div className="text-6xl mb-4 text-amber-500 animate-[spin_0.3s_linear_infinite]">🪙</div>
                <h3 className="text-lg font-bold text-white mb-2">Flipping...</h3>
                <p className="text-surface-400 text-sm">Good luck calling it in the air!</p>
            </div>
        );
    }
    
    if (phase === 'won') {
        const winnerName = winner === 'A' ? teamAName : teamBName;
        return (
            <div className="text-center py-6 animate-bounce-in">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-primary-400 mb-2">{winnerName} won the toss!</h3>
                <div className="flex gap-3 mt-6">
                    <button onClick={tossCoin} className="btn-secondary flex-1 py-3 border-surface-600">
                        🔄 Toss Again
                    </button>
                    <button onClick={() => setPhase('deciding')} className="btn-primary flex-1 py-3">
                        Proceed →
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'deciding') {
        const winnerName = winner === 'A' ? teamAName : teamBName;
        return (
            <div className="text-center py-6 animate-fade-in">
                <h3 className="text-lg font-bold text-white mb-6">What will {winnerName} choose?</h3>
                <div className="flex gap-4">
                    <button onClick={() => onTossComplete(winner, 'bat')} className="btn-primary flex-1 py-6 text-xl bg-primary-600/20 border-primary-500/50 hover:bg-primary-500/40 flex items-center justify-center gap-2">
                        <svg className="w-6 h-6 rotate-45 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 2h4v5h-4zM9 7h6v13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7z"/>
                        </svg>
                        Bat
                    </button>
                    <button onClick={() => onTossComplete(winner, 'bowl')} className="btn-primary flex-1 py-6 text-xl bg-blue-600/20 border-blue-500/50 hover:bg-blue-500/40 flex items-center justify-center gap-2">
                        <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 4 Q13 12 8 20" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
                            <path d="M16 4 Q11 12 16 20" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
                        </svg>
                        Bowl
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
