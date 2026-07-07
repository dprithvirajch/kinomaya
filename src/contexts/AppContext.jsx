import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [user, setUser] = useState({
    preferences: null,
    stats: { streak: 4, points: 1250, moviesWatched: 12 }
  });

  const [watchlist, setWatchlist] = useState([
    {
      id: 1,
      title: "Dune: Part Two",
      year: 2024,
      poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60",
      genres: ["Sci-Fi", "Action"],
      watched: false
    },
    {
      id: 2,
      title: "Poor Things",
      year: 2023,
      poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop&q=60",
      genres: ["Comedy", "Drama"],
      watched: true
    }
  ]);

  // Check local storage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('cinemood_auth');
    if (savedAuth) setIsAuthenticated(true);
    
    const saved = localStorage.getItem('cinemood_user');
    if (saved) {
      setUser(JSON.parse(saved));
      setIsOnboarded(true);
    }
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
