import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Flame, Sparkles } from 'lucide-react';
import ContentRow from '../components/ContentRow';
import SpotlightCard from '../components/SpotlightCard';
import AppTour from '../components/AppTour';
import { fetchTrending, fetchByMood, fetchIndianReleases, fetchInTheaters, fetchNewOnOTT, fetchByOTT } from '../services/tmdb';
import { trackEvent } from '../services/analytics';
import './Home.css';

const MOODS = [
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
  const [trending, setTrending] = useState([]);
  const [indian, setIndian] = useState([]);
  const [gems, setGems] = useState([]);
  const [related, setRelated] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  
  const [activeMood, setActiveMood] = useState(() => {
    return localStorage.getItem('cinemood_active_mood') || 'Surprise Me';
  });
  const [moodMovies, setMoodMovies] = useState([]);
  
  const [activeOTT, setActiveOTT] = useState(() => {
    const saved = localStorage.getItem('cinemood_active_ott');
    return saved ? JSON.parse(saved) : OTTS[0];
  });
  const [ottMovies, setOttMovies] = useState([]);
  
  const [showTour, setShowTour] = useState(false);
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(null);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    if (!staticLoaded) {
      const interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [staticLoaded]);

  const handleRefresh = async (section) => {
    setRefreshing(section);
    const randomPage = Math.floor(Math.random() * 5) + 2;
    try {
      if (section === 'mood') {
        const data = await fetchByMood(activeMood, randomPage);
        setMoodMovies(data);
      } else if (section === 'trending') {
        const data = await fetchTrending(randomPage);
        setTrending(data.filter(m => !m.whereToWatch.includes('Unavailable')));
      } else if (section === 'new') {
        const data = await fetchNewOnOTT(randomPage);
        setNewReleases(data);
      } else if (section === 'indian') {
        const data = await fetchIndianReleases(randomPage);
        setIndian(data.filter(m => !m.whereToWatch.includes('Unavailable')));
      } else if (section === 'gems') {
        const data = await fetchByMood('thriller', randomPage);
        setGems(data);
      } else if (section === 'laugh') {
        const data = await fetchByMood('comedy', randomPage);
        setRelated(data);
      } else if (section === 'theaters') {
        const data = await fetchInTheaters(randomPage);
        setTheaters(data);
      } else if (section === 'ott') {
        const data = await fetchByOTT(activeOTT.id, randomPage);
        setOttMovies(data);
      }
    } catch (e) {
      console.error(e);
    }
    setRefreshing(null);
  };

  // 1. Load static sections ONCE when the component mounts
  useEffect(() => {
    const loadStatic = async () => {
      try {
        const fetchPromise = Promise.all([
          fetchTrending(1),
          fetchIndianReleases(),
          fetchByMood('thriller', 1),
          fetchByMood('comedy', Math.floor(Math.random() * 3) + 1),
          fetchInTheaters(),
          fetchNewOnOTT(1),
          fetchByOTT(activeOTT.id, 1)
        ]);

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading recommendations')), 8000)
        );

        const [trendData, indianData, gemsData, relatedData, theatersData, newOnOTTData, initialOttData] = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]);
        
        const streamableTrending = (trendData || []).filter(m => m && m.whereToWatch && !m.whereToWatch.includes('Unavailable'));
        
        setTrending(streamableTrending.length >= 5 ? streamableTrending : (trendData || []));
        setIndian((indianData || []).filter(m => m && m.whereToWatch && !m.whereToWatch.includes('Unavailable')));
        setGems(gemsData || []);
        setRelated(relatedData || []);
        setTheaters(theatersData || []);
        setNewReleases(newOnOTTData || []);
        setOttMovies(initialOttData || []);

        // Check if tour has been seen
        const hasSeenTour = localStorage.getItem('cinemood_tour_seen');
        if (!hasSeenTour && window.innerWidth < 1024) {
          setTimeout(() => setShowTour(true), 500);
        }
      } catch (err) {
        console.error("Critical error in loadStatic:", err);
      } finally {
        setStaticLoaded(true);
      }
    };
    loadStatic();
  }, []);

  // 2. Load ONLY the active mood section when the pill is tapped
  useEffect(() => {
    const loadMood = async () => {
      const moodData = await fetchByMood(activeMood);
      setMoodMovies(moodData);
    };
    loadMood();
  }, [activeMood]);

  const isFirstOTTLoad = React.useRef(true);
  useEffect(() => {
    if (isFirstOTTLoad.current) {
      isFirstOTTLoad.current = false;
      return;
    }
    const loadOTT = async () => {
      setRefreshing('ott');
      const data = await fetchByOTT(activeOTT.id);
      setOttMovies(data);
      setRefreshing(null);
    };
    loadOTT();
  }, [activeOTT]);

  if (!staticLoaded) {
    return (
      <div className="home-container fade-in">
        <p style={{padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '20vh'}}>
          Loading recommendations...
        </p>
        {loadingTime > 4 && (
          <div className="fade-in" style={{textAlign: 'center', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
            <button 
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                  });
                }
                localStorage.removeItem('cinemood_user'); // Hard reset corrupted data just in case
                window.location.reload(true);
              }}
              style={{
                padding: '12px 24px', 
                background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))', 
                color: 'white', 
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(244, 63, 94, 0.4)'
              }}>
              Force Refresh App
            </button>
            <p style={{fontSize: '0.8rem', color: 'var(--color-text-secondary)', maxWidth: '250px'}}>
              Tap this to clear your cache and force the latest version to load.
            </p>
          </div>
        )}
      </div>
    );
  }

  const handleCompleteTour = () => {
    setShowTour(false);
    localStorage.setItem('cinemood_tour_seen', 'true');
    trackEvent('Tour Completed');
  };

  const handleMoodSelect = (moodName) => {
    setActiveMood(moodName);
    localStorage.setItem('cinemood_active_mood', moodName);
    trackEvent('Mood Selected', { mood: moodName });
  };

  return (
    <div className="home-container fade-in">
      {showTour && <AppTour onComplete={handleCompleteTour} />}
      <header className="home-header">
        <div className="header-top">
          <div className="greeting-area">
            <h1 className="greeting">What's the vibe tonight?</h1>
            <p className="subtitle">Let's find something good.</p>
          </div>
          <div className="stats-widget" onClick={() => navigate('/profile')}>
            <div className="streak-badge">
              <Flame size={16} color="var(--color-accent-primary)" fill="var(--color-accent-primary)" />
              <span>{user.stats.streak}</span>
            </div>
          </div>
        </div>

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
      </header>

      <div className="home-content">
        {moodMovies.length > 0 && (
          <div className="mood-highlight-section">
            <h3 className="section-title">Because you are feeling {activeMood}</h3>
            
            <div 
              className="discovery-cta-card fade-in"
              onClick={() => navigate('/discover', { state: { mood: activeMood } })}
            >
              <div className="cta-content">
                <h4>Play Matchmaker 🎯</h4>
                <p>Swipe through {activeMood} titles to train your algorithm and earn points!</p>
              </div>
              <div className="cta-icon">
                <Sparkles size={24} />
              </div>
            </div>

            <ContentRow 
              title="" 
              items={moodMovies.slice(0, 8)} 
              highlight={true}
              onRefresh={() => handleRefresh('mood')}
              isRefreshing={refreshing === 'mood'}
            />
          </div>
        )}

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

        <ContentRow 
          title="🆕 Fresh Drops this Week" 
          items={newReleases} 
          onRefresh={() => handleRefresh('new')}
          isRefreshing={refreshing === 'new'}
        />

        <div id="tour-trending">
          <ContentRow 
            title="🔥 Global Trending on OTT" 
            items={trending} 
            highlight={true}
            onRefresh={() => handleRefresh('trending')}
            isRefreshing={refreshing === 'trending'}
          />
        </div>
        
        <div id="tour-indian">
          <ContentRow 
            title="Top Indian Streams" 
            items={indian} 
            onRefresh={() => handleRefresh('indian')}
            isRefreshing={refreshing === 'indian'}
          />
        </div>
        
        <div id="tour-tonight">
          <h3 className="section-title">Tonight for You</h3>
          {trending[4] && <SpotlightCard item={trending[4]} />}
        </div>

        <div id="tour-gems">
          <ContentRow 
            title="Hidden Gems for Your Taste" 
            items={gems} 
            onRefresh={() => handleRefresh('gems')}
            isRefreshing={refreshing === 'gems'}
          />
        </div>

        <div id="tour-laugh">
          <ContentRow 
            title="Because You Need a Laugh" 
            items={related} 
            onRefresh={() => handleRefresh('laugh')}
            isRefreshing={refreshing === 'laugh'}
          />
        </div>

        <ContentRow 
          title="🍿 Now in Theaters" 
          items={theaters} 
          onRefresh={() => handleRefresh('theaters')}
          isRefreshing={refreshing === 'theaters'}
        />
      </div>

      <button className="fab-ai" onClick={() => navigate('/companion')}>
        <Sparkles size={24} color="white" />
        <span>Ask AI</span>
      </button>
    </div>
  );
};

export default Home;
