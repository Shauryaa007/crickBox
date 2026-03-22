import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';

export default function AuthModal() {
    const { isAuthModalOpen, closeAuthModal, signInWithEmail, signUpWithEmail } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isAuthModalOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        let result;
        if (isSignUp) {
            if (!name.trim()) {
                setError('Name is required');
                setLoading(false);
                return;
            }
            result = await signUpWithEmail(email, password, name);
        } else {
            result = await signInWithEmail(email, password);
        }

        if (result?.error) {
            setError(result.error);
        }
        setLoading(false);
    };

    // Reset state when toggling tabs
    const toggleMode = (signup) => {
        setIsSignUp(signup);
        setError('');
        setEmail('');
        setPassword('');
        setName('');
    };

    return (
        <Modal isOpen={isAuthModalOpen} onClose={closeAuthModal} title={isSignUp ? "Create Account" : "Welcome Back"}>
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex p-1 bg-surface-800 rounded-xl mb-4">
                    <button
                        onClick={() => toggleMode(false)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-primary-600 text-white shadow' : 'text-surface-400 hover:text-white'}`}
                        type="button"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => toggleMode(true)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-primary-600 text-white shadow' : 'text-surface-400 hover:text-white'}`}
                        type="button"
                    >
                        Sign Up
                    </button>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    {isSignUp && (
                        <div>
                            <label className="text-xs text-surface-400 mb-1 block">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input text-sm w-full"
                                placeholder="Virat Kohli"
                                required={isSignUp}
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-surface-400 mb-1 block">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input text-sm w-full"
                            placeholder="player@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-surface-400 mb-1 block">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input text-sm w-full"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3 mt-4"
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>


            </div>
        </Modal>
    );
}
