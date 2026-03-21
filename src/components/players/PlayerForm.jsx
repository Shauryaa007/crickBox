import { useState } from 'react';
import Modal from '../common/Modal';

export default function PlayerForm({ isOpen, onClose, onSave, player = null }) {
    const [name, setName] = useState(player?.name || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        await onSave({
            name: name.trim(),
            matchesPlayed: player?.matchesPlayed || 0,
            runsScored: player?.runsScored || 0,
            sixes: player?.sixes || 0,
            fours: player?.fours || 0,
            bestScore: player?.bestScore || 0,
            wicketsTaken: player?.wicketsTaken || 0,
            bestWickets: player?.bestWickets || 0,
        });
        setName('');
        setSaving(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={player ? 'Edit Player' : 'Add Player'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1">
                        Player Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter player name"
                        className="input"
                        autoFocus
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim() || saving}
                        className="btn-primary flex-1 py-3 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : player ? 'Update' : 'Add Player'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
