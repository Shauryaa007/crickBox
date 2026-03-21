import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Players from './pages/Players';
import NewMatch from './pages/NewMatch';
import LiveMatch from './pages/LiveMatch';
import MatchHistory from './pages/MatchHistory';
import PlayerProfile from './pages/PlayerProfile';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-surface-950 text-white">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/players" element={<Players />} />
                        <Route path="/player/:id" element={<PlayerProfile />} />
                        <Route path="/new-match" element={<NewMatch />} />
                        <Route path="/match/:id" element={<LiveMatch />} />
                        <Route path="/history" element={<MatchHistory />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}
