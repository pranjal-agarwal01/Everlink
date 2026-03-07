import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Prevent flash of wrong UI

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('everlinkUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Validate: must have token, name, email
        if (parsed && parsed.token && parsed.email) {
          setUser(parsed);
        } else {
          localStorage.removeItem('everlinkUser');
        }
      }
    } catch {
      localStorage.removeItem('everlinkUser');
    } finally {
      setLoading(false);
    }
  }, []);

  const loginUser = (userData) => {
    localStorage.setItem('everlinkUser', JSON.stringify(userData));
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('everlinkUser');
    setUser(null);
  };

  // Don't render anything until we've checked localStorage to avoid UI flash
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" style={{ width: '2rem', height: '2rem' }}></span>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user} logout={logoutUser}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route
            path="/login"
            element={!user ? <Auth isLogin={true} loginUser={loginUser} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/register"
            element={!user ? <Auth isLogin={false} loginUser={loginUser} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} logoutUser={logoutUser} /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
