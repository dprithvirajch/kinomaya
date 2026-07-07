import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, PlayCircle } from 'lucide-react';
import './SpotlightCard.css';

const SpotlightCard = ({ item }) => {
  const navigate = useNavigate();

  if (!item) return null;

  // Mock RT rating and hook if they don't exist
  const rtRating = item.rt || `${(Math.random() * 30 + 70).toFixed(0)}%`;
  const hook = item.hook || item.overview || 'A perfect match for when you want a highly-rated cinematic experience.';

  return (
    <div className="spotlight-card" onClick={() => navigate(`/title/${item.id}`, { state: { item } })}>
      <div className="spotlight-image-container">
        <img src={item.backdrop || item.poster} alt={item.title} className="spotlight-image" />
        <div className="spotlight-gradient"></div>
        <div className="spotlight-platforms">
          <PlayCircle size={14} /> 
          {item.whereToWatch ? item.whereToWatch.join(', ') : 'Check Platforms'}
        </div>
      </div>
      <div className="spotlight-content">
        <div className="spotlight-header">
          <h3 className="spotlight-title">{item.title}</h3>
          <span className="spotlight-year">{item.year}</span>
        </div>
        <div className="spotlight-ratings">
          <div className="badge imdb"><Star size={12} fill="currentColor"/> {item.rating || item.imdb || '8.0'}</div>
          <div className="badge rt">🍅 {rtRating}</div>
        </div>
        <p className="spotlight-desc">{hook}</p>
      </div>
    </div>
  );
};

export default SpotlightCard;
