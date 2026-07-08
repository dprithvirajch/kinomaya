import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Bookmark, Eye, ArrowLeft, Star, PlayCircle } from 'lucide-react';
import { fetchByMood } from '../services/tmdb';
import { useAppContext } from '../contexts/AppContext';
import './DiscoveryDeck.css';

const DiscoveryDeck = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToWatchlist, toggleWatched } = useAppContext();
  const initialMood = location.state?.mood || 'Surprise Me';
  
  const [cards, setCards] = useState([]);
  const [isRefining, setIsRefining] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null); 
  const [loading, setLoading] = useState(true);

  // Helper for mobile vibration
  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(50);
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const loadCards = async () => {
      // Fetch a random page (1 to 4) so users don't see the exact same cards every time
      const randomPage = Math.floor(Math.random() * 4) + 1;
      const data = await fetchByMood(initialMood, randomPage);
      
      // Shuffle the data for the deck
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      
      // Map to deck expected format
      const formatted = shuffled.map(item => ({
        ...item,
        imdb: item.rating,
        rt: (Math.random() * 30 + 70).toFixed(0) + '%' // Mocking RT
      }));
      setCards(formatted);
      setLoading(false);
    };
    loadCards();
  }, [initialMood]);

  const handleAction = (direction, card) => {
    triggerHaptic();
    setSwipeDirection(direction);
    
    // Process business logic based on swipe
    if (direction === 'up' && card) addToWatchlist(card); // Save
    if (direction === 'down' && card) toggleWatched(card.id); // Watched

    setTimeout(() => {
      setCards(prev => prev.slice(1));
      setSwipeDirection(null);
    }, 200); 
  };

  const handleDragEnd = (event, info, card) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 500) {
      handleAction('right', card); // Like
    } else if (offset < -100 || velocity < -500) {
      handleAction('left', card); // Skip
    }
  };

  if (isRefining) {
    return (
      <div className="refine-modal slide-up">
        <div className="refine-header">
          <h2>Refine "{initialMood}"</h2>
          <button onClick={() => setIsRefining(false)} className="icon-btn"><X /></button>
        </div>
        <div className="refine-body">
          <div className="refine-section">
            <h3>Release Year</h3>
            <div className="chip-grid">
              <button className="chip active">Any</button>
              <button className="chip">New (2024)</button>
              <button className="chip">2020s</button>
              <button className="chip">2010s</button>
              <button className="chip">Classics</button>
            </div>
          </div>
          <div className="refine-section">
            <h3>Duration</h3>
            <div className="chip-grid">
              <button className="chip">Quick</button>
              <button className="chip active">Normal</button>
              <button className="chip">Binge</button>
            </div>
          </div>
          <div className="refine-section">
            <h3>Company</h3>
            <div className="chip-grid">
              <button className="chip active">Solo</button>
              <button className="chip">Partner</button>
              <button className="chip">Family</button>
              <button className="chip">Friends</button>
            </div>
          </div>
          <div className="refine-section">
            <h3>Type</h3>
            <div className="chip-grid">
              <button className="chip active">Movie</button>
              <button className="chip">Show</button>
              <button className="chip">Either</button>
            </div>
          </div>
        </div>
        <div className="refine-footer">
          <button className="btn-primary" onClick={() => setIsRefining(false)}>Apply</button>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-container fade-in">
      <header className="deck-header">
        <button className="icon-btn back-btn" onClick={() => navigate('/')}>
          <ArrowLeft />
        </button>
        <div className="deck-mood" onClick={() => setIsRefining(true)}>
          <span className="mood-label">{initialMood}</span>
          <span className="tune-label">Refine</span>
        </div>
      </header>

      <div className="deck-area">
        {loading ? (
          <div className="empty-state">
            <h2 className="empty-title">Finding matches...</h2>
          </div>
        ) : cards.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-title">All caught up!</h2>
            <p className="empty-subtitle">Try a different mood or check back later.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Back Home</button>
          </div>
        ) : (
          <div className="card-stack">
            <AnimatePresence>
              {cards.map((card, index) => {
                const isTop = index === 0;
                
                let exitX = 0;
                if (swipeDirection === 'right') exitX = 300;
                if (swipeDirection === 'left') exitX = -300;

                return (
                  <motion.div 
                    key={card.id} 
                    className={`swipe-card ${isTop ? 'top-card' : 'bg-card'}`}
                    style={{
                      zIndex: cards.length - index,
                    }}
                    initial={false}
                    animate={{
                      scale: 1 - index * 0.05,
                      y: index * 20,
                      opacity: index > 2 ? 0 : 1,
                    }}
                    exit={{
                      x: exitX,
                      opacity: 0,
                      scale: 0.8,
                      transition: { duration: 0.2 }
                    }}
                    drag={isTop ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    onDragEnd={(e, info) => isTop && handleDragEnd(e, info, card)}
                    whileDrag={{ scale: 1.05 }}
                    onClick={() => isTop && navigate(`/title/${card.id}`, { state: { item: card } })}
                  >
                    <div className="card-image">
                      <img src={card.poster} alt={card.title} draggable={false} />
                      <div className="card-overlay">
                        <div className="card-badges">
                          <div className="badge imdb"><Star size={12} fill="currentColor"/> {card.imdb}</div>
                          <div className="badge rt">🍅 {card.rt}</div>
                        </div>
                        <div className="where-to-watch">
                          <PlayCircle size={14} /> {card.whereToWatch.join(', ')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-info">
                      <h2 className="card-title">{card.title}</h2>
                      <div className="card-meta">
                        <span className="year">{card.year}</span>
                        <span className="dot">•</span>
                        <span className="genres">{card.genres.join(', ')}</span>
                      </div>
                      <p className="card-hook">
                        {card.overview && card.overview.length > 100 
                          ? card.overview.substring(0, 100) + '...' 
                          : card.overview}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {!loading && cards.length > 0 && (
        <div className="deck-controls slide-up">
          <div className="control-group">
            <button className="control-btn skip" onClick={() => handleAction('left', cards[0])}>
              <X size={28} />
            </button>
            <span className="control-label">Pass</span>
          </div>
          
          <div className="control-group">
            <button className="control-btn save" onClick={(e) => { e.stopPropagation(); handleAction('up', cards[0]); }}>
              <Bookmark size={24} />
            </button>
            <span className="control-label">Save</span>
          </div>
          
          <div className="control-group">
            <button className="control-btn watched" onClick={(e) => { e.stopPropagation(); handleAction('down', cards[0]); }}>
              <Eye size={24} />
            </button>
            <span className="control-label">Watched</span>
          </div>
          
          <div className="control-group">
            <button className="control-btn like" onClick={(e) => { e.stopPropagation(); handleAction('right', cards[0]); }}>
              <Heart size={28} fill="currentColor" />
            </button>
            <span className="control-label">Like</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryDeck;
