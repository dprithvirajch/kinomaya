import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, RefreshCw, ChevronRight } from 'lucide-react';
import './ContentRow.css';

const ContentRow = ({ title, items, highlight = false, onRefresh, isRefreshing = false }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  return (
    <div className={`content-row-section ${highlight ? 'highlight-section' : ''}`}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>{title}</h3>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
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
