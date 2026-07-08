import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import './ContentRow.css';

const ContentRow = ({ title, items, highlight = false, onRefresh, isRefreshing = false }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = window.innerWidth > 1024 ? 600 : 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`content-row-section ${highlight ? 'highlight-section' : ''}`}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>{title}</h3>
          </div>
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              disabled={isRefreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent-secondary)', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
              Refresh
            </button>
          )}
        </div>
      )}
      
      <div className="scroll-wrapper">
        <button className="scroll-btn left" onClick={() => scroll('left')}>
          <ChevronLeft size={24} />
        </button>

        <div className="content-scroll" ref={scrollRef}>
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

        <button className="scroll-btn right" onClick={() => scroll('right')}>
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default ContentRow;
