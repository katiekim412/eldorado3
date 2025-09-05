import React, { useState } from 'react';
import MainPage from './components/MainPage';
import AuthPage from './components/AuthPage';

function App() {
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
    };

    return (
        <div className="App">
            {user ? (
                <MainPage user={user} onLogout={handleLogout} />
            ) : (
                <AuthPage onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;