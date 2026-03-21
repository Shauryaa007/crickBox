import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
    const { user, signIn, signOut } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/', label: '🏠', title: 'Home' },
        { path: '/players', label: '👥', title: 'Players' },
        { path: '/rankings', label: '🏆', title: 'Rankings' },
        { path: '/history', label: '📊', title: 'History' },
    ];

    return (
        <>
            {/* Top bar */}
            <header className="fixed top-0 left-0 right-0 z-40 glass safe-top">
                <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🏏</span>
                        <span className="font-bold text-lg text-white">CricScorer</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-2">
                                <img
                                    src={user.photoURL || '/cricket.svg'}
                                    alt={user.displayName || 'User'}
                                    className="w-8 h-8 rounded-full border-2 border-primary-500"
                                />
                                <button
                                    onClick={signOut}
                                    className="text-xs text-surface-400 hover:text-white transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={signIn}
                                className="btn-primary text-sm px-4 py-2"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Bottom navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 glass safe-bottom">
                <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all
                ${location.pathname === item.path
                                    ? 'text-primary-400 bg-primary-500/10'
                                    : 'text-surface-400 hover:text-white'}`}
                        >
                            <span className="text-xl">{item.label}</span>
                            <span className="text-[10px] font-medium">{item.title}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
}
