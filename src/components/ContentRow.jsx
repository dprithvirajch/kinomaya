import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import './ContentRow.css';

const ContentRow = ({ title, items, highlight = false }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  return (
    <div className={`content-row-section ${highlight ? 'highlight-section' : ''}`}>
      {title && <h3 className="section-title">{title}</h3>}
      <div className="content-scroll">
        {items.map(item => (
          <div 
            key={item.id} 
            className="content-card"
            onClick={() => navigate(`/title/${item.id}`, { state: { item } })}
          >
            <div className="poster-container">
              <img src={item.poster} alt={item.title} loading="lazy" />
              <div className="rating-badge">
                <Star size={12} fill="var(--color-accent-secondary)" color="var(--color-accent-secondary)" />
                <span>{item.rating || '8.5'}</span>
              </div>
            </div>
            <h4 className="title-text">{item.title}</h4>
            <span className="meta-text">{item.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentRow;
