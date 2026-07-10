import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Play, Plus, Dice5, Sparkles, TrendingUp, Compass, ArrowRight, Brain, Zap, Clock } from 'lucide-react';
import ContentRow from '../components/ContentRow';
import AppTour from '../components/AppTour';
import { fetchTrending, fetchHiddenGems, fetchNewOnOTT, fetchByMood } from '../services/tmdb';
import { generateDailyEditorial } from '../services/gemini';
import { trackEvent } from '../services/analytics';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [showTour, setShowTour] = useState(false);
  
  // Data State
  const [heroMatch, setHeroMatch] = useState(null);
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [moodPicks, setMoodPicks] = useState([]);
  const [editorial, setEditorial] = useState({
    title: "Curating your taste...",
    content: "Our AI is currently analyzing billions of cinematic data points to find your next favorite film."
  });
  
  // UI State
  const [brainOff, setBrainOff] = useState(false);
  const [refreshing, setRefreshing] = useState(null);
  
  // Contextual Helpers
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const timeContext = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Night';

  useEffect(() => {
    if (!staticLoaded) {
      const interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [staticLoaded]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const fetchPromise = Promise.all([
          fetchHiddenGems(1), // For Hero
          fetchTrending(1),
          fetchNewOnOTT(1),
          fetchByMood(brainOff ? 'comedy' : 'thriller', 1),
          generateDailyEditorial(user.preferences)
        ]);

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading dashboard')), 8000)
        );

        const [gemsData, trendData, newData, moodData, editorialData] = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]);
        
        if (gemsData && gemsData.length > 0) {
          setHeroMatch(gemsData[0]);
        }
        
        setTrending((trendData || []).filter(m => !m.whereToWatch?.includes('Unavailable')));
        setNewReleases(newData || []);
        setMoodPicks(moodData || []);
        if (editorialData) setEditorial(editorialData);

        const hasSeenTour = localStorage.getItem('cinemood_tour_seen');
        if (!hasSeenTour && window.innerWidth < 1024) {
          setTimeout(() => setShowTour(true), 500);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setStaticLoaded(true);
      }
    };
    loadDashboard();
  }, [brainOff]); // Re-run when Vibe Toggle changes

  const handleRefresh = async (section) => {
    setRefreshing(section);
    const randomPage = Math.floor(Math.random() * 5) + 2;
    try {
      if (section === 'trending') {
        const data = await fetchTrending(randomPage);
        setTrending(data.filter(m => !m.whereToWatch?.includes('Unavailable')));
      } else if (section === 'new') {
        const data = await fetchNewOnOTT(randomPage);
        setNewReleases(data);
      }
    } catch (e) {
      console.error(e);
    }
    setRefreshing(null);
  };

  const handleSurpriseMe = () => {
    if ('vibrate' in navigator) navigator.vibrate(50);
    navigate('/discover', { state: { mood: 'Surprise Me' } });
  };

  if (!staticLoaded) {
    return (
      <div className="home-container fade-in" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh'}}>
        <Sparkles size={40} color="var(--color-accent-primary)" className="pulse" style={{marginBottom: '1rem'}} />
        <p style={{color: 'var(--color-text-secondary)'}}>Curating your dashboard...</p>
        {loadingTime > 4 && (
          <div className="fade-in" style={{marginTop: '2rem'}}>
            <button 
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) registration.unregister();
                  });
                }
                localStorage.removeItem('cinemood_user');
                window.location.reload(true);
              }}
              style={{
                padding: '12px 24px', background: 'var(--color-accent-primary)', color: 'white', 
                borderRadius: '12px', border: 'none', fontWeight: 'bold'
              }}>
              Force Refresh App
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="home-container fade-in">
      {showTour && <AppTour onComplete={() => { setShowTour(false); localStorage.setItem('cinemood_tour_seen', 'true'); }} />}
      
      {/* 1. Header & Vibe Check */}
      <header className="home-header-top">
        <div>
          <h1 className="greeting-text">{greeting}, {user.preferences?.name?.split(' ')[0] || 'Cinephile'}.</h1>
        </div>
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
           <div className="streak-badge" style={{margin: 0}} onClick={() => navigate('/profile')}>
              <Zap size={14} color="var(--color-accent-primary)" fill="var(--color-accent-primary)" />
              <span>{user.stats.streak}</span>
           </div>
        </div>
      </header>

      <div className="vibe-toggle-container">
        <div className={`vibe-toggle ${brainOff ? 'off' : 'on'}`} onClick={() => {
          if ('vibrate' in navigator) navigator.vibrate(20);
          setBrainOff(!brainOff);
        }}>
          <div className="vibe-slider"></div>
          <div className={`vibe-pill ${!brainOff ? 'active' : ''}`}>🧠 Brain On</div>
          <div className={`vibe-pill ${brainOff ? 'active' : ''}`}>🍿 Brain Off</div>
        </div>
      </div>

      {/* 2. Hero Daily Match */}
      {heroMatch && (
        <section className="hero-match-section">
          <div className="hero-card" onClick={() => navigate(`/title/${heroMatch.id}`, { state: { item: heroMatch } })}>
            <img src={heroMatch.backdrop || heroMatch.poster} alt={heroMatch.title} className="hero-backdrop" />
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <div className="hero-match-badge">
                <Sparkles size={12} /> 98% Match
              </div>
              <h2 className="hero-title">{heroMatch.title}</h2>
              <p className="hero-reason">
                {brainOff 
                  ? `Perfect for a low-effort ${timeContext.toLowerCase()}. Turn your brain off and enjoy.` 
                  : `A highly acclaimed ${heroMatch.genres?.[0]?.toLowerCase() || 'film'} that challenges conventions. Handpicked for your taste.`}
              </p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/title/${heroMatch.id}`, { state: { item: heroMatch } }); }}>
                  <Play size={18} fill="black" /> Watch Now
                </button>
                <button className="btn-secondary" onClick={(e) => { 
                  e.stopPropagation(); 
                  if ('vibrate' in navigator) navigator.vibrate(20);
                  // Add to watchlist logic would go here
                  trackEvent('Added to Watchlist from Hero');
                }}>
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Bento Dashboard */}
      <section className="bento-dashboard">
        <div className="bento-box highlight" onClick={() => navigate('/companion')}>
          <div style={{flex: 1}}>
            <h3 className="bento-title" style={{color: 'white', marginBottom: '4px'}}>Ask the AI Concierge</h3>
            <p className="bento-subtitle" style={{color: 'rgba(255,255,255,0.7)'}}>Not sure what to watch? Let's talk.</p>
          </div>
          <div className="bento-icon" style={{background: 'rgba(255,255,255,0.2)', width: '48px', height: '48px'}}>
            <Brain size={24} color="white" />
          </div>
        </div>
        
        <div className="bento-box" onClick={() => navigate('/discover', { state: { mood: 'Trending' } })}>
          <div className="bento-icon"><TrendingUp size={18} color="var(--color-accent-primary)" /></div>
          <div>
            <h3 className="bento-title">Top 10</h3>
            <p className="bento-subtitle">Streaming in IN</p>
          </div>
        </div>
        
        <div className="bento-box" style={{background: 'linear-gradient(135deg, #1e293b, #0f172a)'}} onClick={handleSurpriseMe}>
          <div className="bento-icon"><Dice5 size={18} color="#06b6d4" /></div>
          <div>
            <h3 className="bento-title">Roll Dice</h3>
            <p className="bento-subtitle">Surprise Me</p>
          </div>
        </div>
      </section>

      {/* 4. Editorial Banner */}
      <section className="editorial-section">
        <div className="editorial-card">
          <div className="editorial-overlay"></div>
          <div className="editorial-content">
            <div className="editorial-tag">Daily Editorial</div>
            <h2 className="editorial-title">{editorial.title}</h2>
            <p className="editorial-body">{editorial.content}</p>
            <div className="editorial-link" onClick={() => navigate('/companion')}>
              Discuss this with AI <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Contextual Recommendation Rows */}
      <div className="section-spacer"></div>
      
      <h3 className="contextual-title">
        {brainOff ? '🍿 Easy Watches' : '🔥 Trending Tonight'}
      </h3>
      <p className="contextual-subtitle">Based on what India is streaming right now</p>
      <ContentRow 
        title="" 
        items={trending} 
        onRefresh={() => handleRefresh('trending')}
        isRefreshing={refreshing === 'trending'}
        highlight={true}
      />

      <div className="section-spacer" style={{height: 'var(--spacing-4)'}}></div>
      
      <h3 className="contextual-title">
        {timeContext === 'Night' ? '🌙 After Midnight' : '☀️ Fresh Drops'}
      </h3>
      <p className="contextual-subtitle">The newest additions to OTT platforms</p>
      <ContentRow 
        title="" 
        items={newReleases} 
        onRefresh={() => handleRefresh('new')}
        isRefreshing={refreshing === 'new'}
      />
      
      <div className="section-spacer" style={{height: 'var(--spacing-4)'}}></div>
      
      <h3 className="contextual-title">
        <Compass size={20} color="var(--color-accent-primary)" /> Because You Like {moodPicks[0]?.genres?.[0] || 'Movies'}
      </h3>
      <p className="contextual-subtitle">Curated specifically for your taste profile</p>
      <ContentRow 
        title="" 
        items={moodPicks} 
        onRefresh={() => {}} // Remove refresh to keep it simple and uncrowded
      />

    </div>
  );
};

export default Home;
