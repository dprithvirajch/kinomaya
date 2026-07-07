import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Bookmark, Check, Share, Star, Loader2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import ContentRow from '../components/ContentRow';
import { fetchTitleDetails } from '../services/tmdb';
import './TitleDetail.css';

const TitleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { watchlist, addToWatchlist, toggleWatched } = useAppContext();
  
  const [titleData, setTitleData] = useState(location.state?.item || null);
  const [isLoading, setIsLoading] = useState(!location.state?.item);

  useEffect(() => {
    const loadDetails = async () => {
      if (!titleData || !titleData.director) { // Fetch if we don't have full details (director/cast)
        setIsLoading(true);
        const data = await fetchTitleDetails(id, titleData?.mediaType || 'movie');
        if (data) {
          setTitleData(prev => ({ ...prev, ...data }));
        }
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  if (isLoading && !titleData) {
    return (
      <div className="detail-container flex-center">
        <Loader2 className="spin" size={40} color="var(--color-accent-secondary)" />
      </div>
    );
  }

  if (!titleData) {
    return (
      <div className="detail-container flex-center flex-col">
        <h2>Title not found</h2>
        <button className="btn-primary mt-4" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const watchlistItem = watchlist.find(m => m.id === titleData.id);
  const isSaved = !!watchlistItem;
  const isWatched = watchlistItem?.watched;

  return (
    <div className="detail-container slide-up">
      <div className="detail-hero" style={{ backgroundImage: `url(${titleData.backdrop || titleData.poster})` }}>
        <div className="hero-gradient"></div>
        <button className="icon-btn back-btn-detail" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <div className="hero-content">
          <div className="poster-thumbnail">
            <img src={titleData.poster} alt={titleData.title} />
          </div>
          <div className="hero-info">
            <h1 className="detail-title">{titleData.title}</h1>
            <div className="detail-meta">
              <span>{titleData.year}</span>
              {titleData.runtime && <><span>•</span><span>{titleData.runtime}</span></>}
              {titleData.type && <><span>•</span><span>{titleData.type}</span></>}
            </div>
            <div className="detail-genres">
              {titleData.genres?.map(g => <span key={g} className="genre-tag">{g}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <div className="action-row">
          <button 
            className="btn-primary play-btn" 
            onClick={() => titleData.watchLink ? window.open(titleData.watchLink, '_blank') : alert('Streaming link currently unavailable for this title.')}
          >
            <Play size={20} fill="currentColor" /> Watch Now
          </button>
          <div className="secondary-actions">
            <button className={`icon-action ${isSaved ? 'active' : ''}`} onClick={() => addToWatchlist(titleData)}>
              <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
              <span>Save</span>
            </button>
            <button className={`icon-action ${isWatched ? 'active' : ''}`} onClick={() => toggleWatched(titleData.id)}>
              <Check size={24} />
              <span>Watched</span>
            </button>
            <button className="icon-action">
              <Share size={24} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {titleData.hook && (
          <div className="match-card">
            <div className="match-score">AI Match</div>
            <p>{titleData.hook}</p>
          </div>
        )}

        <div className="ratings-row">
          <div className="rating-box">
            <span className="rating-label">Rating</span>
            <span className="rating-value"><Star size={16} fill="#facc15" color="#facc15"/> {titleData.rating || titleData.imdb || 'N/A'}</span>
          </div>
          <div className="rating-box">
            <span className="rating-label">Streaming</span>
            <span className="rating-value">{titleData.whereToWatch ? titleData.whereToWatch.join(', ') : 'Unavailable'}</span>
          </div>
        </div>

        <div className="overview-section">
          <p className="overview-text">{titleData.overview}</p>
          <div className="credits">
            {titleData.director && <p><strong>Director:</strong> {titleData.director}</p>}
            {titleData.cast && <p><strong>Cast:</strong> {titleData.cast}</p>}
          </div>
        </div>

        {titleData.similarItems && titleData.similarItems.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-6)' }}>
            <ContentRow 
              title={titleData.type === 'Movie' ? 'Movies Like This' : 'Series Like This'} 
              items={titleData.similarItems} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TitleDetail;
