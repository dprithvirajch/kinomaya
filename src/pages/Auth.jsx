import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Lock, ShieldCheck } from 'lucide-react';
import './Auth.css';

const VALID_CODES = ['KINOMAYA50', 'KINOMAYA-BETA'];

const Auth = () => {
  const navigate = useNavigate();
  const { authenticateUser } = useAppContext();
  
  const [inviteCode, setInviteCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!VALID_CODES.includes(inviteCode.toUpperCase())) {
      setError('Invalid invite code.');
      return;
    }
    if (!agreed) {
      setError('You must agree to the NDA to proceed.');
      return;
    }

    authenticateUser();
    navigate('/splash');
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-header">
        <Lock size={40} className="auth-icon" />
        <h1>Private Beta</h1>
        <p className="subtitle">Invite-only access</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Invite Code</label>
          <input 
            type="text" 
            placeholder="Enter your VIP code"
            value={inviteCode}
            onChange={(e) => { setInviteCode(e.target.value); setError(''); }}
            autoCapitalize="characters"
          />
        </div>

        <div className="nda-box">
          <ShieldCheck size={24} className="nda-icon" />
          <div className="nda-text">
            <h3>Beta Tester Agreement (NDA)</h3>
            <p>
              By accessing this beta, you agree that KinoMaya is highly confidential. 
              You agree not to copy the app's features, reproduce its UI/UX, or share 
              screenshots on public forums without explicit permission.
            </p>
          </div>
        </div>

        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={agreed}
            onChange={(e) => { setAgreed(e.target.checked); setError(''); }}
          />
          <span className="checkbox-text">I have read and agree to the NDA terms.</span>
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button 
          type="submit" 
          className="btn-primary auth-submit"
          disabled={!inviteCode || !agreed}
        >
          Enter KinoMaya
        </button>
      </form>
    </div>
  );
};

export default Auth;
