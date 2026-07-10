import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Bookmark, User, MessageSquare } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();

  // Don't show on discover/title details
  if (['/discover', '/splash', '/onboarding'].includes(location.pathname) || location.pathname.startsWith('/title/')) {
    return null;
  }

  return (
    <nav className="bottom-nav slide-up">
      <div className="desktop-logo">KinoMaya ✨</div>
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/watchlist" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Bookmark size={24} />
        <span>Watchlist</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User size={24} />
        <span>Profile</span>
      </NavLink>
      <div 
        className="nav-item desktop-only" 
        onClick={() => window.open('https://tally.so/r/WOdgxL', '_blank')}
        style={{cursor: 'pointer'}}
      >
        <MessageSquare size={24} />
        <span>Feedback</span>
      </div>
    </nav>
  );
};

export default BottomNav;
