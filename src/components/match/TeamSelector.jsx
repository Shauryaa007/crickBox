import { useState } from 'react';
import PlayerCard from '../players/PlayerCard';

export default function TeamSelector({ players, onTeamsSelected }) {
    const [teamA, setTeamA] = useState([]);
    const [teamB, setTeamB] = useState([]);
    const [teamAName, setTeamAName] = useState('Team A');
    const [teamBName, setTeamBName] = useState('Team B');
    const [activeTeam, setActiveTeam] = useState('A');

    const assignedIds = new Set([...teamA, ...teamB]);
    const unassigned = players.filter(p => !assignedIds.has(p.id));

    const handleToggle = (playerId) => {
        if (activeTeam === 'A') {
            if (teamA.includes(playerId)) {
                setTeamA(teamA.filter(id => id !== playerId));
            } else {
                setTeamA([...teamA, playerId]);
            }
        } else {
            if (teamB.includes(playerId)) {
                setTeamB(teamB.filter(id => id !== playerId));
            } else {
                setTeamB([...teamB, playerId]);
            }
        }
    };

    const removeFromTeam = (playerId, team) => {
        if (team === 'A') setTeamA(teamA.filter(id => id !== playerId));
        else setTeamB(teamB.filter(id => id !== playerId));
    };

    const getPlayer = (id) => players.find(p => p.id === id);

    const canProceed = teamA.length >= 2 && teamB.length >= 2;

    return (
        <div className="space-y-6">
            {/* Team name inputs */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-surface-400 mb-1">Team A Name</label>
                    <input
                        type="text"
                        value={teamAName}
                        onChange={(e) => setTeamAName(e.target.value)}
                        className="input text-sm py-2"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-surface-400 mb-1">Team B Name</label>
                    <input
                        type="text"
                        value={teamBName}
                        onChange={(e) => setTeamBName(e.target.value)}
                        className="input text-sm py-2"
                    />
                </div>
            </div>

            {/* Team toggle */}
            <div className="flex bg-surface-800 rounded-xl p-1">
                <button
                    onClick={() => setActiveTeam('A')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${activeTeam === 'A'
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'text-surface-400 hover:text-white'}`}
                >
                    {teamAName} ({teamA.length})
                </button>
                <button
                    onClick={() => setActiveTeam('B')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${activeTeam === 'B'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-surface-400 hover:text-white'}`}
                >
                    {teamBName} ({teamB.length})
                </button>
            </div>

            {/* Selected team members */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-surface-300">
                    {activeTeam === 'A' ? teamAName : teamBName} Members
                </h4>
                {(activeTeam === 'A' ? teamA : teamB).length === 0 ? (
                    <p className="text-sm text-surface-500 italic py-3">
                        Tap players below to add them
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {(activeTeam === 'A' ? teamA : teamB).map(id => {
                            const p = getPlayer(id);
                            return p ? (
                                <button
                                    key={id}
                                    onClick={() => removeFromTeam(id, activeTeam)}
                                    className={`badge text-sm py-1.5 px-3 cursor-pointer
                    ${activeTeam === 'A'
                                            ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}
                    hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all`}
                                >
                                    {p.name} ✕
                                </button>
                            ) : null;
                        })}
                    </div>
                )}
            </div>

            {/* Available players */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-surface-300">
                    Available Players ({unassigned.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {unassigned.map(player => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            selectable
                            selected={false}
                            onToggle={() => handleToggle(player.id)}
                        />
                    ))}
                    {unassigned.length === 0 && (
                        <p className="text-sm text-surface-500 italic py-3">
                            All players assigned to teams
                        </p>
                    )}
                </div>
            </div>

            {/* Proceed button */}
            <button
                onClick={() => onTeamsSelected({
                    teamA, teamB, teamAName, teamBName
                })}
                disabled={!canProceed}
                className="btn-primary w-full py-4 text-lg disabled:opacity-40"
            >
                Continue to Match Setup →
            </button>
        </div>
    );
}
