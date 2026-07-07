import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import './Onboarding.css';

const STEPS = {
  AGE: 0,
  GENRES: 1,
  LANGUAGES: 2,
  MOODS: 3,
  TYPE: 4,
  SUMMARY: 5
};

const GENRES = [
  { name: 'Action', emoji: '💥' },
  { name: 'Thriller', emoji: '🔪' },
  { name: 'Investigative Thrillers', emoji: '🕵️‍♂️' },
  { name: 'Comedy', emoji: '😂' },
  { name: 'Drama', emoji: '🎭' },
  { name: 'Horror', emoji: '👻' },
  { name: 'Romance', emoji: '❤️' },
  { name: 'Sci-Fi', emoji: '👽' },
  { name: 'Documentary', emoji: '🎬' },
  { name: 'Anime', emoji: '🌸' },
  { name: 'K-Drama', emoji: '🇰🇷' },
  { name: 'Bollywood', emoji: '🇮🇳' },
  { name: 'Regional Indian', emoji: '🌏' }
];

const LANGUAGES = [
  { name: 'English', emoji: '🇺🇸' },
  { name: 'Hindi', emoji: '🇮🇳' },
  { name: 'Korean', emoji: '🇰🇷' },
  { name: 'Japanese', emoji: '🇯🇵' },
  { name: 'Marathi', emoji: '🚩' },
  { name: 'Tamil', emoji: '🛕' },
  { name: 'Telugu', emoji: '🌶️' },
  { name: 'Malayalam', emoji: '🌴' }
];

const MOODS = [
  { name: 'Chill', emoji: '🛋️' },
  { name: 'Funny', emoji: '🤪' },
  { name: 'Intense', emoji: '😳' },
  { name: 'Emotional', emoji: '🥺' },
  { name: 'Smart', emoji: '🧠' },
  { name: 'Romantic', emoji: '🥰' },
  { name: 'Spooky', emoji: '🎃' },
  { name: 'Comfort', emoji: '☕' }
];

const TYPES = ['Movies 🍿', 'TV Shows 📺', 'Both ✨'];

const Onboarding = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAppContext();
  const [step, setStep] = useState(STEPS.AGE);
  
  const [prefs, setPrefs] = useState({
    dob: '',
    genres: [],
    languages: [],
    moods: [],
    type: ''
  });

  const handleNext = () => {
    if (step < STEPS.SUMMARY) {
      setStep(step + 1);
    } else {
      completeOnboarding(prefs);
      navigate('/');
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else navigate('/splash');
  };

  const toggleSelection = (category, item) => {
    setPrefs(prev => {
      const current = prev[category];
      if (current.includes(item)) {
        return { ...prev, [category]: current.filter(i => i !== item) };
      } else {
        return { ...prev, [category]: [...current, item] };
      }
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case STEPS.AGE:
        return (
          <div className="step-content fade-in">
            <h2>When were you born?</h2>
            <p className="subtitle">We use this to personalize your experience.</p>
            <input 
              type="date" 
              className="date-input"
              value={prefs.dob}
              onChange={(e) => setPrefs({...prefs, dob: e.target.value})}
            />
          </div>
        );
      case STEPS.GENRES:
        return (
          <div className="step-content fade-in">
            <h2>What genres do you love?</h2>
            <p className="subtitle">Pick a few favorites.</p>
            <div className="chip-grid">
              {GENRES.map(g => (
                <button 
                  key={g.name} 
                  className={`chip ${prefs.genres.includes(g.name) ? 'active' : ''}`}
                  onClick={() => toggleSelection('genres', g.name)}
                >
                  <span className="chip-emoji">{g.emoji}</span>
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        );
      case STEPS.LANGUAGES:
        return (
          <div className="step-content fade-in">
            <h2>What languages do you watch?</h2>
            <div className="chip-grid">
              {LANGUAGES.map(l => (
                <button 
                  key={l.name} 
                  className={`chip ${prefs.languages.includes(l.name) ? 'active' : ''}`}
                  onClick={() => toggleSelection('languages', l.name)}
                >
                  <span className="chip-emoji">{l.emoji}</span>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        );
      case STEPS.MOODS:
        return (
          <div className="step-content fade-in">
            <h2>What's your usual vibe?</h2>
            <div className="mood-grid">
              {MOODS.map(m => (
                <button 
                  key={m.name} 
                  className={`mood-card-select ${prefs.moods.includes(m.name) ? 'active' : ''}`}
                  onClick={() => toggleSelection('moods', m.name)}
                >
                  <span className="mood-emoji-large">{m.emoji}</span>
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case STEPS.TYPE:
        return (
          <div className="step-content fade-in">
            <h2>Movies or Shows?</h2>
            <div className="type-options">
              {TYPES.map(t => (
                <button 
                  key={t}
                  className={`type-card ${prefs.type === t ? 'active' : ''}`}
                  onClick={() => setPrefs({...prefs, type: t})}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        );
      case STEPS.SUMMARY:
        return (
          <div className="step-content summary-content fade-in">
            <CheckCircle2 size={64} className="success-icon" />
            <h2>Taste Profile Set!</h2>
            <p className="taste-summary">
              You're into {prefs.genres.slice(0,2).join(' and ')}, emotional drama, and high-rated {prefs.type.replace(/[^a-zA-Z\s]/g, '').trim().toLowerCase() || 'movies'}.
            </p>
          </div>
        );
      default: return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case STEPS.AGE: return prefs.dob !== '';
      case STEPS.GENRES: return prefs.genres.length > 0;
      case STEPS.LANGUAGES: return prefs.languages.length > 0;
      case STEPS.MOODS: return prefs.moods.length > 0;
      case STEPS.TYPE: return prefs.type !== '';
      default: return true;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        {step < STEPS.SUMMARY && (
          <button className="icon-btn" onClick={handleBack}>
            <ArrowLeft />
          </button>
        )}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((step + 1) / 6) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="onboarding-body">
        {renderStepContent()}
      </div>

      <div className="onboarding-footer">
        <button 
          className="btn-primary" 
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {step === STEPS.SUMMARY ? 'Start Exploring' : 'Continue'}
          {step < STEPS.SUMMARY && <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
