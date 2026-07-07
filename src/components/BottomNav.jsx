import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Bookmark, User } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();

  // Don't show on discover/title details
  if (['/discover', '/splash', '/onboarding'].includes(location.pathname) || location.pathname.startsWith('/title/')) {
    return null;
  }

  return (
    <nav className="bottom-nav slide-up">
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
    </nav>
  );
};

export default BottomNav;
