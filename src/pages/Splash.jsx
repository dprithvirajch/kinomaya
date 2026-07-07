import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Splash.css';
import { Play } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();

  return (
    <div className="splash-container">
      <div className="splash-content fade-in">
        <div className="logo-icon" style={{ background: 'transparent' }}>
          <img src="/logo.png" alt="KinoMaya Logo" style={{ width: '120px', height: '120px', borderRadius: '30px', boxShadow: '0 0 40px rgba(0, 210, 255, 0.4)' }} />
        </div>
        <h1 className="splash-title" style={{ marginTop: '1rem', letterSpacing: '1px' }}>KinoMaya</h1>
        <p className="splash-subtitle">Your AI movie Companion.</p>
      </div>
      
      <div className="splash-footer slide-up">
        <button 
          className="btn-primary start-btn"
          onClick={() => navigate('/onboarding')}
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
};

export default Splash;
