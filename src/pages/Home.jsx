import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Flame, Sparkles } from 'lucide-react';
import ContentRow from '../components/ContentRow';
import SpotlightCard from '../components/SpotlightCard';
import AppTour from '../components/AppTour';
import { fetchTrending, fetchByMood, fetchIndianReleases, fetchInTheaters } from '../services/tmdb';
import { trackEvent } from '../services/analytics';
import './Home.css';

const MOODS = [
  { name: 'Chill', emoji: '🛋️' },
  { name: 'Intense', emoji: '😳' },
  { name: 'Funny', emoji: '🤪' },
  { name: 'Emotional', emoji: '🥺' },
  { name: 'Smart', emoji: '🧠' },
  { name: 'Spooky', emoji: '🎃' },
  { name: 'Romantic', emoji: '🥰' },
  { name: 'Surprise Me', emoji: '✨' }
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [trending, setTrending] = useState([]);
  const [indian, setIndian] = useState([]);
  const [gems, setGems] = useState([]);
  const [related, setRelated] = useState([]);
  const [theaters, setTheaters] = useState([]);
  
  const [activeMood, setActiveMood] = useState(() => {
    return localStorage.getItem('cinemood_active_mood') || 'Surprise Me';
  });
  const [moodMovies, setMoodMovies] = useState([]);
  const [showTour, setShowTour] = useState(false);
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(null);

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
      }
    } catch (e) {
      console.error(e);
    }
    setRefreshing(null);
  };

  // 1. Load static sections ONCE when the component mounts
  useEffect(() => {
    const loadStatic = async () => {
      const [trendData, indianData, gemsData, relatedData, theatersData] = await Promise.all([
        fetchTrending(1),
        fetchIndianReleases(),
        fetchByMood('thriller', 1),
        fetchByMood('comedy', Math.floor(Math.random() * 3) + 1),
        fetchInTheaters()
      ]);
      
      const streamableTrending = trendData.filter(m => !m.whereToWatch.includes('Unavailable'));
      
      setTrending(streamableTrending.length >= 5 ? streamableTrending : trendData);
      setIndian(indianData.filter(m => !m.whereToWatch.includes('Unavailable')));
      setGems(gemsData);
      setRelated(relatedData);
      setTheaters(theatersData);
      setStaticLoaded(true);


      // Check if tour has been seen
      const hasSeenTour = localStorage.getItem('cinemood_tour_seen');
      if (!hasSeenTour) {
        setTimeout(() => setShowTour(true), 500);
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

  if (!staticLoaded) return <div className="home-container fade-in"><p style={{padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)'}}>Loading recommendations...</p></div>;

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
