const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

const cache = new Map();

// Helper to fetch JSON from TMDB with simple cache
const fetchFromTMDB = async (endpoint) => {
  if (cache.has(endpoint)) return cache.get(endpoint);
  
  if (!API_KEY) throw new Error("TMDB API Key missing");
  const response = await fetch(`${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`);
  if (!response.ok) throw new Error('TMDB API request failed');
  
  const data = await response.json();
  cache.set(endpoint, data);
  return data;
};

// Map TMDB genre IDs to strings
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller',
  10752: 'War', 37: 'Western', 10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy'
};

const formatAndEnrichTMDBResults = async (results) => {
  const topResults = results.slice(0, 20);
  
  const enrichedResults = await Promise.all(topResults.map(async (item) => {
    let providers = [];
    try {
      const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie';
      const providerData = await fetchFromTMDB(`/${type}/${item.id}/watch/providers`);
      
      let targetRegion = providerData.results?.IN ? providerData.results.IN : providerData.results?.US;
      
      if (targetRegion) {
        const allProviders = [
          ...(targetRegion.flatrate || []),
          ...(targetRegion.rent || []),
          ...(targetRegion.buy || [])
        ];
        providers = [...new Set(allProviders.map(p => p.provider_name))];
      }
    } catch (e) {
      console.warn(`Could not fetch providers for ${item.id}`);
    }

    return {
      id: item.id,
      title: item.title || item.name,
      year: (item.release_date || item.first_air_date || '').substring(0, 4),
      rating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
      genres: (item.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean),
      overview: item.overview,
      whereToWatch: providers.length > 0 ? providers.slice(0, 2) : ['Unavailable'],
      mediaType: item.media_type || (item.first_air_date ? 'tv' : 'movie')
    };
  }));

  return enrichedResults.filter(item => item.poster);
};

export const fetchTrending = async (page = 1) => {
  try {
    const data = await fetchFromTMDB(`/trending/all/week?page=${page}`);
    return await formatAndEnrichTMDBResults(data.results);
  } catch (error) {
    console.error('Failed to fetch from TMDB:', error);
    return [];
  }
};

export const fetchIndianReleases = async () => {
  try {
    const [movies, tv] = await Promise.all([
      fetchFromTMDB('/discover/movie?with_original_language=hi|ta|te|ml|kn&sort_by=popularity.desc&region=IN&with_watch_monetization_types=flatrate|rent|buy&watch_region=IN'),
      fetchFromTMDB('/discover/tv?with_original_language=hi|ta|te|ml|kn&sort_by=popularity.desc&watch_region=IN&with_watch_monetization_types=flatrate|rent|buy')
    ]);
    
    // Mix movies and TV shows
    const mixed = [];
    const maxLen = Math.max(movies.results?.length || 0, tv.results?.length || 0);
    for (let i = 0; i < maxLen; i++) {
      if (movies.results?.[i]) mixed.push(movies.results[i]);
      if (tv.results?.[i]) mixed.push(tv.results[i]);
    }

    return await formatAndEnrichTMDBResults(mixed);
  } catch (error) {
    console.error('Failed to fetch Indian releases:', error);
    return [];
  }
};

export const fetchInTheaters = async () => {
  try {
    const data = await fetchFromTMDB('/movie/now_playing?region=IN');
    const enriched = await formatAndEnrichTMDBResults(data.results);
    // Force 'In Theaters' tag for these
    return enriched.map(item => ({
      ...item,
      whereToWatch: item.whereToWatch[0] === 'Unavailable' ? ['In Theaters'] : item.whereToWatch
    }));
  } catch (error) {
    console.error('Failed to fetch theaters:', error);
    return [];
  }
};

export const fetchByMood = async (mood, page = 1) => {
  try {
    let genreQuery = '';
    const m = mood.toLowerCase();
    
    if (m.includes('funny') || m.includes('comedy')) genreQuery = '35';
    else if (m.includes('intense') || m.includes('thriller')) genreQuery = '53,28';
    else if (m.includes('spooky') || m.includes('horror')) genreQuery = '27';
    else if (m.includes('chill') || m.includes('relaxing')) genreQuery = '10751';
    else if (m.includes('romantic') || m.includes('romance')) genreQuery = '10749';
    else if (m.includes('sad') || m.includes('emotional') || m.includes('drama')) genreQuery = '18';
    else if (m.includes('smart') || m.includes('mind') || m.includes('mystery')) genreQuery = '9648,878,99';
    else if (m.includes('action')) genreQuery = '28';
    
    if (!genreQuery) {
      // For "Surprise Me" or unmatched, mix random global trending with random regional
      const randomPage = Math.floor(Math.random() * 5) + 1;
      const [globalData, regionalData] = await Promise.all([
        fetchFromTMDB(`/trending/movie/week?page=${randomPage}`),
        fetchFromTMDB(`/discover/movie?with_original_language=hi|ta|te|ml|kn&sort_by=popularity.desc&page=${randomPage}`)
      ]);
      const mixed = [];
      const maxLen = Math.max(globalData.results?.length || 0, regionalData.results?.length || 0);
      for (let i = 0; i < maxLen; i++) {
        if (globalData.results?.[i]) mixed.push(globalData.results[i]);
        if (regionalData.results?.[i]) mixed.push(regionalData.results[i]);
      }
      return await formatAndEnrichTMDBResults(mixed);
    }
    
    // Force streaming availability and mix global + regional
    const [globalData, regionalData] = await Promise.all([
      fetchFromTMDB(`/discover/movie?with_genres=${genreQuery}&sort_by=popularity.desc&page=${page}&watch_region=IN&with_watch_monetization_types=flatrate|rent|buy`),
      fetchFromTMDB(`/discover/movie?with_genres=${genreQuery}&with_original_language=hi|ta|te|ml|kn&sort_by=popularity.desc&page=${page}&watch_region=IN&with_watch_monetization_types=flatrate|rent|buy`)
    ]);

    const mixed = [];
    const maxLen = Math.max(globalData.results?.length || 0, regionalData.results?.length || 0);
    for (let i = 0; i < maxLen; i++) {
      if (globalData.results?.[i]) mixed.push(globalData.results[i]);
      if (regionalData.results?.[i]) mixed.push(regionalData.results[i]);
    }
    
    return await formatAndEnrichTMDBResults(mixed);
  } catch (error) {
    console.error('Failed to fetch by mood:', error);
    return [];
  }
};

export const searchTitles = async (titlesData) => {
  try {
    const searchPromises = titlesData.map(async (itemData) => {
      // Handle both string arrays and object arrays {name, hook}
      const title = typeof itemData === 'string' ? itemData : itemData.name;
      const aiHook = typeof itemData === 'string' ? null : itemData.hook;

      // 1. Search for the exact title
      const query = encodeURIComponent(title);
      const searchData = await fetchFromTMDB(`/search/multi?query=${query}`);
      
      // Get the best match that is a movie or tv show
      const bestMatch = searchData.results?.find(r => r.media_type === 'movie' || r.media_type === 'tv') || searchData.results?.[0];
      
      if (!bestMatch) return null;

      // 2. Fetch watch providers
      let providers = [];
      try {
        const type = bestMatch.media_type || (bestMatch.first_air_date ? 'tv' : 'movie');
        const providerData = await fetchFromTMDB(`/${type}/${bestMatch.id}/watch/providers`);
        
        let targetRegion = providerData.results?.IN ? providerData.results.IN : providerData.results?.US;
        
        if (targetRegion) {
          const allProviders = [
            ...(targetRegion.flatrate || []),
            ...(targetRegion.rent || []),
            ...(targetRegion.buy || [])
          ];
          providers = [...new Set(allProviders.map(p => p.provider_name))];
        }
      } catch (e) {
        console.warn(`Could not fetch providers for ${bestMatch.id}`);
      }

      // 3. Format exactly like fetchTrending
      return {
        id: bestMatch.id,
        title: bestMatch.title || bestMatch.name,
        year: (bestMatch.release_date || bestMatch.first_air_date || '').substring(0, 4),
        rating: bestMatch.vote_average ? bestMatch.vote_average.toFixed(1) : 'N/A',
        poster: bestMatch.poster_path ? `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}` : null,
        backdrop: bestMatch.backdrop_path ? `https://image.tmdb.org/t/p/w780${bestMatch.backdrop_path}` : null,
        genres: (bestMatch.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean),
        overview: bestMatch.overview,
        hook: aiHook, // Pass the AI generated hook down to the UI
        whereToWatch: providers.length > 0 ? providers.slice(0, 2) : ['Unavailable'],
        mediaType: bestMatch.media_type || (bestMatch.first_air_date ? 'tv' : 'movie')
      };
    });

    const results = await Promise.all(searchPromises);
    return results.filter(item => item && item.poster);
  } catch (error) {
    console.error('Failed to search TMDB:', error);
    return [];
  }
};

export const fetchTitleDetails = async (id, mediaType = 'movie') => {
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}?append_to_response=credits,watch/providers,similar`);
    
    // Providers
    let providers = [];
    let targetRegion = data['watch/providers']?.results?.IN ? data['watch/providers'].results.IN : data['watch/providers']?.results?.US;
    
    let watchLink = targetRegion?.link || null;

    if (targetRegion) {
      const allProviders = [
        ...(targetRegion.flatrate || []),
        ...(targetRegion.rent || []),
        ...(targetRegion.buy || [])
      ];
      providers = [...new Set(allProviders.map(p => p.provider_name))];
    }

    // Credits
    const cast = (data.credits?.cast || []).slice(0, 3).map(c => c.name).join(', ');
    const director = (data.credits?.crew || []).find(c => c.job === 'Director' || c.job === 'Executive Producer')?.name || 'Unknown';

    // Format similar titles
    const similarRaw = data.similar?.results?.slice(0, 10) || [];
    const similarItems = similarRaw.map(item => ({
      id: item.id,
      title: item.title || item.name,
      year: (item.release_date || item.first_air_date || '').substring(0, 4),
      rating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      mediaType: item.media_type || mediaType
    })).filter(i => i.poster);

    return {
      id: data.id,
      title: data.title || data.name,
      year: (data.release_date || data.first_air_date || '').substring(0, 4),
      runtime: data.runtime ? `${Math.floor(data.runtime/60)}h ${data.runtime%60}m` : (data.number_of_episodes ? `${data.number_of_episodes} Episodes` : ''),
      type: mediaType === 'movie' ? 'Movie' : 'TV Show',
      rating: data.vote_average ? data.vote_average.toFixed(1) : 'N/A',
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : null,
      genres: (data.genres || []).map(g => g.name),
      overview: data.overview,
      cast: cast,
      director: director,
      whereToWatch: providers.length > 0 ? providers.slice(0, 2) : ['Unavailable'],
      mediaType,
      watchLink,
      similarItems
    };
  } catch (error) {
    if (mediaType === 'movie') {
      return fetchTitleDetails(id, 'tv');
    }
    console.error('Failed to fetch details:', error);
    return null;
  }
};
