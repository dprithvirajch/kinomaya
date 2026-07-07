import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import BottomNav from './components/BottomNav';
import Auth from './pages/Auth';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import DiscoveryDeck from './pages/DiscoveryDeck';
import TitleDetail from './pages/TitleDetail';
import Companion from './pages/Companion';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isOnboarded } = useAppContext();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  if (!isOnboarded) {
    return <Navigate to="/splash" />;
  }
  
  return children;
};

const AuthGate = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  if (!isAuthenticated) return <Navigate to="/auth" />;
  return children;
};

const AppContent = () => {
  return (
    <Router>
      <div className="page-container">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/splash" element={<AuthGate><Splash /></AuthGate>} />
          <Route path="/onboarding" element={<AuthGate><Onboarding /></AuthGate>} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/discover" 
            element={
              <ProtectedRoute>
                <DiscoveryDeck />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/title/:id" 
            element={
              <ProtectedRoute>
                <TitleDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/companion" 
            element={
              <ProtectedRoute>
                <Companion />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/watchlist" 
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
      <BottomNav />
    </Router>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
