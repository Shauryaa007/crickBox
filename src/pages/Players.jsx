import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import PlayerCard from '../components/players/PlayerCard';
import PlayerForm from '../components/players/PlayerForm';

export default function Players() {
    const { user } = useAuth();
    const { documents: players, loading, error, fetchAll, add, update } = useFirestore('players');
    const [showForm, setShowForm] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAll(user?.uid);
    }, [user]);

    const handleSave = async (data) => {
        try {
            if (editingPlayer) {
                await update(editingPlayer.id, data);
            } else {
                await add({ ...data, createdBy: user?.uid || 'anonymous' });
            }
            await fetchAll(user?.uid);
            setEditingPlayer(null);
        } catch (err) {
            // Error is already set in useFirestore hook
            console.error('Save failed:', err.message);
        }
    };

    const handleEdit = (player) => {
        setEditingPlayer(player);
        setShowForm(true);
    };

    const filtered = players.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-black text-white">Players</h1>
                    <p className="text-xs text-surface-400">{players.length} players registered</p>
                </div>
                <button
                    onClick={() => { setEditingPlayer(null); setShowForm(true); }}
                    className="btn-primary px-4 py-2.5 text-sm"
                >
                    + Add Player
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                    <p className="text-red-400 text-xs font-medium mb-1">⚠️ Firebase Error</p>
                    <p className="text-red-300 text-xs">{error}</p>
                    <button
                        onClick={() => fetchAll(user?.uid)}
                        className="mt-2 text-xs text-red-400 underline"
                    >
                        Retry
                    </button>
                </div>
            )}
            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input text-sm"
                />
            </div>

            {/* Player list */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="text-4xl animate-bounce">🏏</div>
                    <p className="text-surface-400 mt-2">Loading players...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-5xl mb-3">👥</div>
                    <h3 className="text-lg font-bold text-surface-300 mb-1">
                        {searchQuery ? 'No matches found' : 'No players yet'}
                    </h3>
                    <p className="text-sm text-surface-500 mb-4">
                        {searchQuery ? 'Try a different search' : 'Add your first player to get started'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary px-5 py-2.5 text-sm"
                        >
                            + Add First Player
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((player) => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}

            {/* Player form modal */}
            <PlayerForm
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditingPlayer(null); }}
                onSave={handleSave}
                player={editingPlayer}
            />
        </div>
    );
}
