export default function PlayerCard({ player, onEdit, onDelete, selectable, selected, onToggle }) {
    return (
        <div
            onClick={selectable ? onToggle : undefined}
            className={`card transition-all duration-200 cursor-pointer
        ${selectable ? 'hover:border-primary-500/50' : ''}
        ${selected ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30' : ''}
        animate-fade-in`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {selectable && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
              transition-all ${selected
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-surface-500'}`}>
                            {selected && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-white">{player.name}</h3>
                        <div className="flex gap-3 mt-1 text-xs text-surface-400">
                            <span>{player.matchesPlayed || 0} matches</span>
                            <span>{player.runsScored || 0} runs</span>
                            <span>{player.wicketsTaken || 0} wkts</span>
                        </div>
                    </div>
                </div>
                {!selectable && (
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(player); }}
                                className="w-8 h-8 rounded-lg bg-surface-700 hover:bg-surface-600
                  flex items-center justify-center text-surface-400 hover:text-white transition-colors"
                            >
                                ✏️
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(player.id); }}
                                className="w-8 h-8 rounded-lg bg-surface-700 hover:bg-red-600/50
                  flex items-center justify-center text-surface-400 hover:text-red-400 transition-colors"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Stats row */}
            {!selectable && (player.runsScored > 0 || player.wicketsTaken > 0) && (
                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-surface-700">
                    <div className="text-center">
                        <div className="text-sm font-bold text-primary-400">{player.bestScore || 0}</div>
                        <div className="text-[10px] text-surface-500">Best</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-amber-400">{player.sixes || 0}</div>
                        <div className="text-[10px] text-surface-500">6's</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-blue-400">{player.fours || 0}</div>
                        <div className="text-[10px] text-surface-500">4's</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-red-400">{player.bestWickets || 0}</div>
                        <div className="text-[10px] text-surface-500">Best Wk</div>
                    </div>
                </div>
            )}
        </div>
    );
}
