import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Check, Bookmark, Star } from 'lucide-react';
import './Watchlist.css';

const Watchlist = () => {
  const navigate = useNavigate();
  const { watchlist, toggleWatched } = useAppContext();
  const [filter, setFilter] = useState('all'); // all, unwatched, watched

  const filteredList = watchlist.filter(m => {
    if (filter === 'unwatched') return !m.watched;
    if (filter === 'watched') return m.watched;
    return true;
  });

  return (
    <div className="watchlist-container fade-in">
      <header className="watchlist-header">
        <h1>Watchlist</h1>
        <div className="filter-chips">
          <button 
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`chip ${filter === 'unwatched' ? 'active' : ''}`}
            onClick={() => setFilter('unwatched')}
          >
            Saved
          </button>
          <button 
            className={`chip ${filter === 'watched' ? 'active' : ''}`}
            onClick={() => setFilter('watched')}
          >
            Watched
          </button>
        </div>
      </header>

      <div className="watchlist-grid">
        {filteredList.length === 0 ? (
          <div className="empty-state">
            <Bookmark size={48} color="var(--color-text-tertiary)" className="empty-icon" />
            <h2>Nothing here yet</h2>
            <p className="empty-subtitle">Save movies and shows you want to watch later.</p>
            <button className="btn-secondary" onClick={() => navigate('/')}>Discover</button>
          </div>
        ) : (
          filteredList.map(movie => (
            <div 
              key={movie.id} 
              className={`watchlist-card ${movie.watched ? 'is-watched' : ''}`}
              onClick={() => navigate(`/title/${movie.id}`, { state: { item: movie } })}
            >
              <div className="watchlist-poster">
                <img src={movie.poster} alt={movie.title} />
                {movie.watched && (
                  <div className="watched-overlay">
                    <Check size={32} />
                  </div>
                )}
              </div>
              <div className="watchlist-info">
                <h3>{movie.title}</h3>
                <span className="watchlist-meta">{movie.year} • {movie.genres[0]}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Watchlist;
