import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState(() => {
    return localStorage.getItem('cinemood_user') !== null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('cinemood_auth') === 'true';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cinemood_user');
    const defaultStats = { streak: 1, points: 50, moviesWatched: 0, level: '🍿 Popcorn Novice' };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.stats) parsed.stats = defaultStats;
        return parsed;
      } catch (e) {
        return { preferences: null, stats: defaultStats };
      }
    }
    return { preferences: null, stats: defaultStats };
  });

  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('cinemood_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cinemood_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Check local storage on mount (now handled by lazy init, but kept for side-effects if needed)
  useEffect(() => {
    // Left empty since state is initialized synchronously now
  }, []);

  const authenticateUser = () => {
    setIsAuthenticated(true);
    localStorage.setItem('cinemood_auth', 'true');
  };

  const completeOnboarding = (prefs) => {
    setIsOnboarded(true);
    const newUserState = {
      ...user,
      preferences: prefs
    };
    setUser(newUserState);
    localStorage.setItem('cinemood_user', JSON.stringify(newUserState));
  };

  const addToWatchlist = (movie) => {
    if (!watchlist.find(m => m.id === movie.id)) {
      setWatchlist([...watchlist, { ...movie, watched: false }]);
    }
  };

  const toggleWatched = (id) => {
    setWatchlist(watchlist.map(m => 
      m.id === id ? { ...m, watched: !m.watched } : m
    ));
  };

  return (
    <AppContext.Provider value={{
      isOnboarded,
      isAuthenticated,
      authenticateUser,
      user,
      watchlist,
      completeOnboarding,
      addToWatchlist,
      toggleWatched
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
