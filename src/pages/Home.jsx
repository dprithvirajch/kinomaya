import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Sparkles, Zap, Brain } from 'lucide-react';
import ContentRow from '../components/ContentRow';
import AppTour from '../components/AppTour';
import { fetchTrending, fetchByMood, fetchNewOnOTT, fetchByOTT, fetchHiddenGems } from '../services/tmdb';
import { trackEvent } from '../services/analytics';
import './Home.css';

const MOODS = [
  { name: 'Movies Only', emoji: '🎬' },
  { name: 'Binge Series', emoji: '📺' },
  { name: 'Chill', emoji: '🛋️' },
  { name: 'Intense', emoji: '😳' },
  { name: 'Funny', emoji: '🤪' },
  { name: 'Action', emoji: '🔥' },
  { name: 'Thriller', emoji: '🔪' },
  { name: 'Emotional', emoji: '🥺' },
  { name: 'Smart', emoji: '🧠' },
  { name: 'Spooky', emoji: '🎃' },
  { name: 'Romantic', emoji: '🥰' },
  { name: 'Surprise Me', emoji: '✨' }
];

const OTTS = [
  { name: 'Netflix', id: '8', color: '#E50914' },
  { name: 'Prime', id: '119', color: '#00A8E1' },
  { name: 'Hotstar', id: '122', color: '#113CCF' },
  { name: 'JioCinema', id: '220', color: '#E83E8C' },
  { name: 'SonyLiv', id: '237', color: '#F1801C' },
  { name: 'Zee5', id: '232', color: '#8230C6' }
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [showTour, setShowTour] = useState(false);
  
  // Data State
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [gems, setGems] = useState([]);
  
  const [activeMood, setActiveMood] = useState(() => {
    return localStorage.getItem('cinemood_active_mood') || 'Surprise Me';
  });
  const [moodMovies, setMoodMovies] = useState([]);
  
  const [activeOTT, setActiveOTT] = useState(() => {
    const saved = localStorage.getItem('cinemood_active_ott');
    return saved ? JSON.parse(saved) : OTTS[0];
  });
  const [ottMovies, setOttMovies] = useState([]);
  
  // UI State
  const [brainOff, setBrainOff] = useState(false);
  const [refreshing, setRefreshing] = useState(null);
  
  // Contextual Helpers
  const hour = new Date().getHours();
  let greeting = 'Good Evening';
  if (hour >= 5 && hour < 12) greeting = 'Good Morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';

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
          fetchTrending(1, brainOff),
          fetchNewOnOTT(1, brainOff),
          fetchByMood(activeMood),
          fetchByOTT(activeOTT.id, 1, brainOff),
          fetchHiddenGems(1) // Doesn't need brainOff filter as it's meant to be timeless cult classics
        ]);

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading dashboard')), 8000)
        );

        const [trendData, newData, moodData, ottData, gemsData] = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]);
        
        setTrending((trendData || []).filter(m => !m.whereToWatch?.includes('Unavailable')));
        setNewReleases(newData || []);
        setMoodMovies(moodData || []);
        setOttMovies(ottData || []);
        setGems(gemsData || []);

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
  }, [brainOff]); // Re-run everything when Vibe Toggle changes

  // Dynamic loaders for when user taps mood/ott pills
  const isFirstMoodLoad = useRef(true);
  useEffect(() => {
    if (isFirstMoodLoad.current) {
      isFirstMoodLoad.current = false;
      return;
    }
    const loadMood = async () => {
      setRefreshing('mood');
      const data = await fetchByMood(activeMood);
      setMoodMovies(data);
      setRefreshing(null);
    };
    loadMood();
  }, [activeMood]);

  const isFirstOTTLoad = useRef(true);
  useEffect(() => {
    if (isFirstOTTLoad.current) {
      isFirstOTTLoad.current = false;
      return;
    }
    const loadOTT = async () => {
      setRefreshing('ott');
      const data = await fetchByOTT(activeOTT.id, 1, brainOff);
      setOttMovies(data);
      setRefreshing(null);
    };
    loadOTT();
  }, [activeOTT]); // Depends on brainOff too, but re-fetching handled by main useEffect if brainOff changes

  const handleRefresh = async (section) => {
    setRefreshing(section);
    const randomPage = Math.floor(Math.random() * 5) + 2;
    try {
      if (section === 'trending') {
        const data = await fetchTrending(randomPage, brainOff);
        setTrending(data.filter(m => !m.whereToWatch?.includes('Unavailable')));
      } else if (section === 'new') {
        const data = await fetchNewOnOTT(randomPage, brainOff);
        setNewReleases(data);
      } else if (section === 'mood') {
        const data = await fetchByMood(activeMood, randomPage);
        setMoodMovies(data);
      } else if (section === 'ott') {
        const data = await fetchByOTT(activeOTT.id, randomPage, brainOff);
        setOttMovies(data);
      } else if (section === 'gems') {
        const data = await fetchHiddenGems(randomPage);
        setGems(data);
      }
    } catch (e) {
      console.error(e);
    }
    setRefreshing(null);
  };

  const handleMoodSelect = (moodName) => {
    setActiveMood(moodName);
    localStorage.setItem('cinemood_active_mood', moodName);
    trackEvent('Mood Selected', { mood: moodName });
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
      
      {/* Header & Vibe Check */}
      <header className="home-header-top" style={{paddingTop: 'var(--spacing-4)', paddingBottom: 'var(--spacing-4)'}}>
        <div>
          <h1 className="greeting-text" style={{fontSize: '1.25rem', marginBottom: '2px'}}>{greeting},</h1>
          <p style={{color: 'var(--color-text-secondary)', fontWeight: 600}}>Let's find something good.</p>
        </div>
        <div className="streak-badge" style={{margin: 0}} onClick={() => navigate('/profile')}>
          <Zap size={14} color="var(--color-accent-primary)" fill="var(--color-accent-primary)" />
          <span>{user.stats.streak}</span>
        </div>
      </header>

      <div className="vibe-toggle-container" style={{paddingBottom: 'var(--spacing-4)'}}>
        <div className={`vibe-toggle ${brainOff ? 'off' : 'on'}`} onClick={() => {
          if ('vibrate' in navigator) navigator.vibrate(20);
          setBrainOff(!brainOff);
        }}>
          <div className="vibe-slider"></div>
          <div className={`vibe-pill ${!brainOff ? 'active' : ''}`}>🧠 Brain On</div>
          <div className={`vibe-pill ${brainOff ? 'active' : ''}`}>🍿 Brain Off</div>
        </div>
      </div>

      {/* AI Concierge Banner */}
      <div style={{padding: '0 var(--spacing-4)', marginBottom: 'var(--spacing-6)'}}>
        <div 
          onClick={() => navigate('/companion')}
          style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(6, 182, 212, 0.15))',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div>
            <h3 style={{fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px'}}>Ask the AI Concierge</h3>
            <p style={{fontSize: '0.8rem', color: 'var(--color-text-secondary)'}}>Not sure what to watch? Let's talk.</p>
          </div>
          <div style={{background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '50%'}}>
            <Brain size={24} color="#38bdf8" />
          </div>
        </div>
      </div>

      {/* Mood Filters */}
      <div className="mood-scroll">
        {MOODS.map(mood => (
          <button 
            key={mood.name} 
            className={`mood-pill ${activeMood === mood.name ? 'active' : ''}`}
            onClick={() => handleMoodSelect(mood.name)}
          >
            <span>{mood.emoji}</span> {mood.name}
          </button>
        ))}
      </div>

      {moodMovies.length > 0 && (
        <div className="mood-highlight-section" style={{marginBottom: 'var(--spacing-6)'}}>
          <h3 className="contextual-title" style={{marginTop: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)'}}>
            Because you are feeling {activeMood}
          </h3>
          <ContentRow 
            title="" 
            items={moodMovies.slice(0, 8)} 
            highlight={true}
            onRefresh={() => handleRefresh('mood')}
            isRefreshing={refreshing === 'mood'}
          />
        </div>
      )}

      {/* OTT Filters */}
      <div className="ott-filter-section" style={{marginBottom: 'var(--spacing-6)'}}>
        <div className="mood-scroll" style={{marginBottom: '0', paddingBottom: '0.5rem'}}>
          {OTTS.map(ott => (
            <button 
              key={ott.id} 
              className={`mood-pill ${activeOTT.id === ott.id ? 'active' : ''}`}
              onClick={() => {
                setActiveOTT(ott);
                localStorage.setItem('cinemood_active_ott', JSON.stringify(ott));
                trackEvent('OTT Filter Selected', { ott: ott.name });
              }}
              style={activeOTT.id === ott.id ? {background: ott.color, borderColor: ott.color, color: '#fff'} : {}}
            >
              {ott.name}
            </button>
          ))}
        </div>
        <ContentRow 
          title={`Trending on ${activeOTT.name}`} 
          items={ottMovies} 
          onRefresh={() => handleRefresh('ott')}
          isRefreshing={refreshing === 'ott'}
        />
      </div>

      {/* Fresh Drops */}
      <ContentRow 
        title="🆕 Fresh Drops this Week" 
        items={newReleases} 
        onRefresh={() => handleRefresh('new')}
        isRefreshing={refreshing === 'new'}
      />

      {/* Hidden Gems */}
      <ContentRow 
        title="💎 Hidden Masterpieces" 
        items={gems} 
        onRefresh={() => handleRefresh('gems')}
        isRefreshing={refreshing === 'gems'}
      />

      {/* Trending Tonight */}
      <ContentRow 
        title="🔥 Trending Tonight" 
        items={trending} 
        onRefresh={() => handleRefresh('trending')}
        isRefreshing={refreshing === 'trending'}
      />

    </div>
  );
};

export default Home;
