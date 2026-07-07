import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Flame, Star, Trophy, Award, Target, Video, Check } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useAppContext();

  // Extract from preferences or use fallbacks
  const topGenres = user.preferences.genres.length > 0 
    ? user.preferences.genres.slice(0, 3) 
    : ['Thriller', 'Comedy', 'Drama'];
    
  const topMoods = user.preferences.moods.length > 0 
    ? user.preferences.moods.slice(0, 2) 
    : ['Intense', 'Emotional'];

  const typePref = user.preferences.type || 'Movies & Shows';

  return (
    <div className="profile-container fade-in">
      <header className="profile-header">
        <div className="avatar-section">
          <div className="avatar">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=60" alt="User Avatar" />
          </div>
          <div className="user-info">
            <h1>{user.preferences?.name || "Cinephile"}</h1>
            <p className="level-text">{user.stats.level || 'Novice'}</p>
          </div>
        </div>
      </header>

      <div className="stats-cards">
        <div className="stat-card streak-card">
          <Flame size={24} color="var(--color-accent-primary)" />
          <div className="stat-info">
            <span className="stat-value">{user.stats.streak} Days</span>
            <span className="stat-label">Current Streak</span>
          </div>
        </div>
        <div className="stat-card points-card">
          <Star size={24} color="var(--color-accent-secondary)" />
          <div className="stat-info">
            <span className="stat-value">{user.stats.points} pts</span>
            <span className="stat-label">Total Score</span>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h2>Taste Profile</h2>
        <div className="taste-summary-card">
          <p>
            "You love <strong>{topGenres.join(', ')}</strong>, leaning towards <strong>{topMoods.join(' & ')}</strong> vibes, mostly watching <strong>{typePref}</strong>."
          </p>
        </div>
      </div>

      <div className="profile-section">
        <h2>Achievements</h2>
        <div className="badges-grid">
          <div className="badge-card unlocked">
            <div className="badge-icon" style={{background: 'linear-gradient(135deg, #f43f5e, #fda4af)'}}>
              <Award size={28} color="#fff" />
            </div>
            <span>Genre Explorer</span>
          </div>
          <div className="badge-card unlocked">
            <div className="badge-icon" style={{background: 'linear-gradient(135deg, #06b6d4, #67e8f9)'}}>
              <Trophy size={28} color="#fff" />
            </div>
            <span>Weekend Binger</span>
          </div>
          <div className="badge-card locked">
            <div className="badge-icon">
              <Target size={28} />
            </div>
            <span>Hidden Gem Hunter</span>
          </div>
          <div className="badge-card locked">
            <div className="badge-icon">
              <Video size={28} />
            </div>
            <span>Critic's Pick</span>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h2>Weekly Missions</h2>
        <div className="mission-card">
          <div className="mission-info">
            <h3>Watch 2 new releases</h3>
            <div className="mission-progress">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '50%' }}></div>
              </div>
              <span>1/2</span>
            </div>
          </div>
          <div className="mission-reward">+50 pts</div>
        </div>
        <div className="mission-card completed">
          <div className="mission-info">
            <h3>Save 5 titles for later</h3>
            <div className="mission-progress">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '100%' }}></div>
              </div>
              <span>5/5</span>
            </div>
          </div>
          <div className="mission-reward"><Check size={20} color="var(--color-accent-secondary)" /></div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
