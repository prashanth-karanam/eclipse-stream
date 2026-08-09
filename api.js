/**
 * Eclipse API Service
 * Handles all external metadata fetching (TMDB for Movies/Series, Jikan for Anime).
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb'; // Real TMDB v3 API key
const TMDB_ENDPOINTS = ['https://api.tmdb.org/3', 'https://api.themoviedb.org/3'];
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500'; // For posters
const TMDB_IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original'; // For backgrounds/banners

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

const proxyFetchJson = async (url) => {
  // First attempt direct fetch with short 2.5s timeout
  try {
    const directRes = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (directRes.ok) return await directRes.json();
  } catch(e) {}

  const proxies = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/'
  ];
  for (let proxy of proxies) {
    try {
      const proxyUrl = proxy.includes('allorigins') || proxy.includes('codetabs') ? proxy + encodeURIComponent(url) : proxy + url;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      if (proxy.includes('allorigins')) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data && data.contents) return JSON.parse(data.contents);
        } catch(e) { continue; }
      } else {
        return await res.json();
      }
    } catch (e) {
      continue;
    }
  }
  console.error('All proxies failed for:', url);
  return null;
};

const FALLBACK_POSTER = 'https://placehold.co/400x600/1a1a2e/ffffff?text=No+Image';

// Helper to safely load images
const proxyImage = (url) => {
  if (!url) return FALLBACK_POSTER;
  return url;
};

// ============================================================================
// TMDB (Movies & Series)
// ============================================================================

const tmdbFetch = async (endpoint, params = {}) => {
  if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE' || !TMDB_API_KEY) {
    console.warn("TMDB API Key is missing. Using mock response.");
    return null;
  }
  
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...params
  });
  
  let lastError;
  for (const baseUrl of TMDB_ENDPOINTS) {
    const url = `${baseUrl}${endpoint}?${queryParams}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (response.ok) return await response.json();
    } catch (e) {
      lastError = e;
    }
  }

  console.warn("Direct TMDB fetch failed on all endpoints, attempting proxy...", lastError);
  return await proxyFetchJson(`${TMDB_ENDPOINTS[0]}${endpoint}?${queryParams}`);
};

/**
 * Normalizes TMDB format into our Eclipse format
 */
const normalizeTMDB = (item, type = 'movies') => {
  const score = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A';
  const overview = (item.overview || '').toLowerCase();
  const titleText = (item.title || item.name || '').toLowerCase();
  const originCountry = item.origin_country || [];
  
  let genre = '';
  if (originCountry.includes('KR') || titleText.includes('korean') || overview.includes('korea') || overview.includes('k-drama')) {
    genre = 'K-Drama';
  } else if (originCountry.includes('TH') || titleText.includes('thai') || overview.includes('thailand') || overview.includes('thai drama')) {
    genre = 'Thai Drama';
  } else if (overview.includes("boy's love") || overview.includes('bl ') || titleText.includes('bl ')) {
    genre = 'BL Drama';
  } else if (overview.includes("girl's love") || overview.includes('gl ') || titleText.includes('gl ')) {
    genre = 'GL Drama';
  }

  return {
    id: `tmdb_${item.id}`,
    tmdbId: String(item.id),
    title: item.title || item.name,
    category: type,
    poster: item.poster_path ? proxyImage(`${TMDB_IMG_BASE}${item.poster_path}`) : FALLBACK_POSTER,
    backdrop: item.backdrop_path ? proxyImage(`${TMDB_IMG_ORIGINAL}${item.backdrop_path}`) : '',
    rating: score,
    releaseYear: (item.release_date || item.first_air_date || '').substring(0, 4),
    description: item.overview || '',
    genre: genre || (type === 'series' ? 'Drama' : 'Action'),
    totalEpisodes: type === 'series' ? (item.number_of_episodes || '?') : 1,
    episodes: type === 'series' ? (item.number_of_episodes || 0) : 1,
    runtime: item.runtime || (type === 'movies' ? 120 : 0),
    raw: item
  };
};

export const searchTMDB = async (query, type = 'multi') => {
  // type can be 'movie', 'tv', or 'multi'
  const data = await tmdbFetch(`/search/${type}`, { query, include_adult: false });
  if (!data || !data.results) return [];
  
  return data.results
    .filter(item => item.media_type === 'movie' || item.media_type === 'tv' || type !== 'multi')
    .map(item => normalizeTMDB(item, item.media_type === 'tv' ? 'series' : 'movies'));
};

export const discoverTMDB = async (type = 'tv', params = {}) => {
  const data = await tmdbFetch(`/discover/${type}`, params);
  if (!data || !data.results) return [];
  return data.results.map(item => normalizeTMDB(item, type === 'tv' ? 'series' : 'movies'));
};

export const getTrendingTMDB = async (type = 'all', timeWindow = 'day', page = 1) => {
  const data = await tmdbFetch(`/trending/${type}/${timeWindow}`, { page });
  if (!data || !data.results || data.results.length === 0) {
    const tvmaze = await fetchTVMazeSeries(0);
    return tvmaze;
  }
  return data.results.map(item => normalizeTMDB(item, item.media_type === 'tv' ? 'series' : 'movies'));
};

// ============================================================================
// JIKAN (Anime & Manga)
// ============================================================================
// Jikan does not require an API key, but is rate-limited (3 requests per second)
let jikanQueue = [];
let isProcessingJikan = false;
let lastJikanCall = 0;
const JIKAN_DELAY = 334;

const processJikanQueue = async () => {
    if (isProcessingJikan || jikanQueue.length === 0) return;
    isProcessingJikan = true;

    while (jikanQueue.length > 0) {
        const now = Date.now();
        const timeSinceLast = now - lastJikanCall;
        if (timeSinceLast < JIKAN_DELAY) {
            await new Promise(r => setTimeout(r, JIKAN_DELAY - timeSinceLast));
        }
        lastJikanCall = Date.now();
        const task = jikanQueue.shift();
        await task();
    }
    isProcessingJikan = false;
};

const jikanFetch = async (endpoint, params = {}, retries = 2) => {
  return new Promise((resolve) => {
    jikanQueue.push(async () => {
      const queryParams = new URLSearchParams(params);
      const url = queryParams.toString() ? `${JIKAN_BASE_URL}${endpoint}?${queryParams}` : `${JIKAN_BASE_URL}${endpoint}`;
      
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (response.status === 429 && retries > 0) {
            const retryAfter = response.headers.get('Retry-After') || 1;
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            resolve(await jikanFetch(endpoint, params, retries - 1));
            return;
        }
        if (!response.ok) throw new Error('Jikan Fetch Error');
        resolve(await response.json());
      } catch (error) {
        console.warn("Direct Jikan fetch failed, attempting proxy...", error);
        resolve(await proxyFetchJson(url));
      }
    });
    processJikanQueue();
  });
};

/**
 * Normalizes Jikan format into our Eclipse format
 */
const normalizeJikan = (item, category = 'anime') => {
  const score = typeof item.score === 'number' ? item.score.toFixed(1) : 'N/A';
  const isManhwaOrManga = category === 'manhwa' || category === 'manga';
  const genres = item.genres?.map(g => g.name) || item.themes?.map(g => g.name) || [];
  const genre = genres[0] || (isManhwaOrManga ? 'Manhwa' : 'Action');
  return {
    id: `mal_${item.mal_id}`,
    title: item.title_english || item.title,
    category: category,
    genre: genre,
    poster: proxyImage(item.images?.jpg?.large_image_url || item.images?.jpg?.image_url),
    backdrop: proxyImage(item.trailer?.images?.maximum_image_url || ''),
    rating: score,
    releaseYear: item.year || (item.aired?.prop?.from?.year) || (item.published?.prop?.from?.year) || '',
    description: item.synopsis || '',
    // Use 'chapters' for manhwa/manga, 'totalEpisodes' for anime
    totalEpisodes: isManhwaOrManga ? undefined : (item.episodes || '?'),
    chapters: isManhwaOrManga ? (item.chapters || '?') : undefined,
    episodes: isManhwaOrManga ? undefined : (item.episodes || 0),
    raw: item
  };
};

export const searchJikan = async (query, type = 'anime') => {
  // type can be 'anime' or 'manga'
  const data = await jikanFetch(`/${type}`, { q: query, sfw: true });
  if (!data || !data.data) return [];
  // Map 'manga' search results to category 'manhwa' so they appear under right genre in the app
  const category = type === 'manga' ? 'manhwa' : type;
  return data.data.map(item => normalizeJikan(item, category));
};

export const getTopJikan = async (type = 'anime', page = 1) => {
  const data = await jikanFetch(`/top/${type}`, { page });
  if (!data || !data.data) return [];
  return data.data.map(item => normalizeJikan(item, type));
};

// ============================================================================
// TVMAZE (Zero-key fallback for Movies & TV Series)
// ============================================================================
export const fetchTVMazeSeries = async (page = 0) => {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows?page=${page}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 50).map(item => {
      const isMovie = item.runtime && item.runtime >= 90 && item.summary && item.summary.toLowerCase().includes('movie');
      const category = isMovie ? 'movies' : 'series';
      return {
        id: `tvmaze_${item.id}`,
        title: item.name,
        category: category,
        poster: proxyImage(item.image?.original || item.image?.medium),
        backdrop: proxyImage(item.image?.original),
        rating: item.rating?.average ? item.rating.average.toFixed(1) : '8.2',
        releaseYear: (item.premiered || '').substring(0, 4),
        genre: item.genres && item.genres[0] ? item.genres[0] : (isMovie ? 'Sci-Fi' : 'Drama'),
        description: item.summary ? item.summary.replace(/<[^>]+>/g, '') : '',
        episodes: category === 'series' ? 12 : 1,
        runtime: item.runtime || 120
      };
    });
  } catch (e) {
    console.error('TVMaze fetch error:', e);
    return [];
  }
};

export const fetchTopManhwa = async (page = 1) => {
  // Try Jikan first (specifically manhwa type)
  const data = await jikanFetch('/top/manga', { type: 'manhwa', page });
  if (data && data.data && data.data.length > 0) {
    return data.data.slice(0, 20).map(item => normalizeJikan(item, 'manhwa'));
  }

  // Fallback: MangaDex public API — no key required
  try {
    const offset = (page - 1) * 20;
    const mdUrl = `https://api.mangadex.org/manga?limit=20&offset=${offset}&publicationDemographic[]=seinen&publicationDemographic[]=josei&originalLanguage[]=ko&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art`;
    
    let mdData = null;
    try {
      const mdRes = await fetch(mdUrl, { signal: AbortSignal.timeout(4000) });
      if (mdRes.ok) mdData = await mdRes.json();
    } catch(e) {}

    if (!mdData) {
      mdData = await proxyFetchJson(mdUrl);
    }

    if (mdData && mdData.data) {
      const results = (mdData.data || []).map(manga => {
        const title = manga.attributes?.title?.en || manga.attributes?.title?.ko || Object.values(manga.attributes?.title || {})[0] || 'Unknown';
        const desc = manga.attributes?.description?.en || '';
        const chapters = manga.attributes?.lastChapter || manga.attributes?.availableTranslatedLanguages?.length || '?';
        const coverRelation = manga.relationships?.find(r => r.type === 'cover_art');
        const coverFilename = coverRelation?.attributes?.fileName;
        const poster = coverFilename ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFilename}.256.jpg` : FALLBACK_POSTER;
        const genres = (manga.attributes?.tags || [])
          .filter(t => t.attributes?.group === 'genre')
          .map(t => t.attributes?.name?.en)
          .filter(Boolean);
        const score = manga.attributes?.rating?.average || manga.attributes?.rating?.bayesian || null;
        return {
          id: `md_${manga.id}`,
          title,
          category: 'manhwa',
          genre: genres[0] || 'Action',
          poster,
          rating: score ? Number(score).toFixed(1) : 'N/A',
          releaseYear: (manga.attributes?.year || '').toString(),
          description: desc,
          chapters: typeof chapters === 'number' ? chapters : (parseInt(chapters) || '?'),
          episodes: undefined,
          totalEpisodes: undefined
        };
      }).filter(m => m.title !== 'Unknown');
      if (results.length > 0) return results;
    }
  } catch (mdErr) {
    console.error('MangaDex fallback failed:', mdErr);
  }

  // Final fallback: top manga from Jikan (broader selection)
  const fallbackManga = await jikanFetch('/top/manga', { page });
  if (!fallbackManga || !fallbackManga.data) return [];
  return fallbackManga.data.slice(0, 20).map(item => normalizeJikan(item, 'manhwa'));
};


export const fetchLiveCatalog = async (page = 1) => {
  try {
    const tvmazePage = Math.max(0, page - 1);
    const tmdbPage = ((page - 1) % 3) + 1;
    
    // Fetch base content
    const [anime, manhwa, tvshows, tmdbMovies, tmdbSeries, kdrama, thai, bl, gl] = await Promise.all([
      getTopJikan('anime', page),
      fetchTopManhwa(page),
      fetchTVMazeSeries(tvmazePage),
      getTrendingTMDB('movie', 'week', tmdbPage),
      getTrendingTMDB('tv', 'week', tmdbPage),
      discoverTMDB('tv', { with_original_language: 'ko', with_genres: '18', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_original_language: 'th', with_genres: '18', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_keywords: '210024', sort_by: 'popularity.desc', page }),
      searchTMDB('girls love', 'tv')
    ]);

    const series = tmdbSeries && tmdbSeries.length > 0 
       ? tmdbSeries.map(s => ({ ...s, category: 'series' })).slice(0, 20)
       : tvshows.filter(s => s.category === 'series').slice(0, 20);

    const movies = tmdbMovies && tmdbMovies.length > 0
       ? tmdbMovies.map(s => ({ ...s, category: 'movies' })).slice(0, 20)
       : tvshows.filter(s => s.category === 'movies').concat(tvshows.slice(25, 45)).map(s => ({ ...s, category: 'movies' })).slice(0, 20);

    return {
      anime: (anime || []).slice(0, 20),
      manhwa: (manhwa || []).slice(0, 20),
      series: series.length > 0 ? series : [],
      movies: movies.length > 0 ? movies : [],
      kdrama: (kdrama || []).map(s => ({ ...s, category: 'kdrama' })).slice(0, 20),
      thai: (thai || []).map(s => ({ ...s, category: 'thai' })).slice(0, 20),
      bl: (bl || []).map(s => ({ ...s, category: 'bl' })).slice(0, 20),
      gl: (gl || []).map(s => ({ ...s, category: 'gl' })).slice(0, 20)
    };
  } catch (e) {
    console.error('Error fetching live catalog:', e);
    return null;
  }
};

// ============================================================================
// UNIFIED SEARCH EXPORT
// ============================================================================

/**
 * Unified Search across TMDB, TVMaze, and Jikan.
 */
export const searchAll = async (query, categoryFilter = 'all') => {
  if (!query) return [];
  
  try {
    const [tmdbResults, animeResults, mangaResults, tvmazeRes] = await Promise.all([
      searchTMDB(query, 'multi'),
      searchJikan(query, 'anime'),
      searchJikan(query, 'manga'),
      fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(6000) }).then(r => r.ok ? r.json() : []).catch(() => [])
    ]);

    const tvmazeResults = (tvmazeRes || []).map(item => ({
      id: `tvm_${item.show.id}`,
      title: item.show.name,
      category: item.show.type === 'Animation' ? 'anime' : 'series',
      poster: item.show.image?.medium || item.show.image?.original || FALLBACK_POSTER,
      rating: item.show.rating?.average ? item.show.rating.average.toFixed(1) : '8.0',
      releaseYear: (item.show.premiered || '').substring(0, 4),
      genre: item.show.genres?.[0] || 'Drama',
      description: item.show.summary ? item.show.summary.replace(/<[^>]+>/g, '') : ''
    }));

    const all = [...tmdbResults, ...animeResults, ...mangaResults, ...tvmazeResults];
    
    // Deduplicate logic
    const unique = [];
    const seen = new Set();
    
    for (const item of all) {
      if (!item.title) continue;
      const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(normalizedTitle)) {
        const duplicates = all.filter(t => t.title && t.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedTitle);
        duplicates.sort((a, b) => {
          const aHasPoster = a.poster !== FALLBACK_POSTER ? 1 : 0;
          const bHasPoster = b.poster !== FALLBACK_POSTER ? 1 : 0;
          if (aHasPoster !== bHasPoster) return bHasPoster - aHasPoster;
          
          const aHasDesc = a.description && a.description.length > 10 ? 1 : 0;
          const bHasDesc = b.description && b.description.length > 10 ? 1 : 0;
          return bHasDesc - aHasDesc;
        });
        unique.push(duplicates[0]);
        seen.add(normalizedTitle);
      }
    }

    if (categoryFilter !== 'all') {
      const target = categoryFilter.toLowerCase();
      return unique.filter(t => {
        if (t.category === target) return true;
        const g = (t.genre || '').toLowerCase();
        const d = (t.description || '').toLowerCase();
        const titleLower = (t.title || '').toLowerCase();
        if (target === 'kdrama' && (g.includes('k-drama') || d.includes('korea') || titleLower.includes('korea'))) return true;
        if (target === 'thai' && (g.includes('thai') || d.includes('thailand') || titleLower.includes('thai'))) return true;
        if (target === 'bl' && (g.includes('bl') || d.includes("boy's love") || titleLower.includes('bl'))) return true;
        if (target === 'gl' && (g.includes('gl') || d.includes("girl's love") || titleLower.includes('gl'))) return true;
        return false;
      });
    }
    return unique;
  } catch(e) {
    console.error('searchAll Error:', e);
    return [];
  }
};

// ============================================================================
// STREAMING SEARCH — fires callback as each source responds (no waiting for all)
// ============================================================================
export const searchAllStreaming = (query, categoryFilter = 'all', onResult) => {
  if (!query) return Promise.resolve();

  const seen = new Set();

  const normalize = (item) => {
    if (!item || !item.title) return null;
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) return null;
    seen.add(key);
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return null;
    return item;
  };

  const emit = async (items) => {
    for (const item of (items || [])) {
      const clean = normalize(item);
      if (clean) {
        onResult(clean);
        await new Promise(r => setTimeout(r, 40));
      }
    }
  };

  // TVMaze — usually fastest, no rate limit
  const tvmazeP = fetch(
    `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
    { signal: AbortSignal.timeout(5000) }
  ).then(r => r.ok ? r.json() : []).then(res => {
    emit((res || []).map(item => ({
      id: `tvm_${item.show.id}`,
      title: item.show.name,
      category: item.show.type === 'Animation' ? 'anime' : 'series',
      poster: item.show.image?.medium || item.show.image?.original || FALLBACK_POSTER,
      rating: item.show.rating?.average ? item.show.rating.average.toFixed(1) : '8.0',
      releaseYear: (item.show.premiered || '').substring(0, 4),
      genre: item.show.genres?.[0] || 'Drama',
      description: item.show.summary ? item.show.summary.replace(/<[^>]+>/g, '') : ''
    })));
  }).catch(() => {});

  // TMDB — needs key but fast
  const tmdbP = searchTMDB(query, 'multi').then(res => emit(res)).catch(() => {});

  // Jikan anime
  const animeP = searchJikan(query, 'anime').then(res => emit(res)).catch(() => {});

  // Jikan manga/manhwa
  const mangaP = searchJikan(query, 'manga').then(res => emit(res)).catch(() => {});

  return Promise.allSettled([tvmazeP, tmdbP, animeP, mangaP]);
};

export const getTrendingAll = async () => {
  const [tmdbTrending, animeTrending] = await Promise.all([
    getTrendingTMDB('all', 'day'),
    getTopJikan('anime')
  ]);
  
  return [...tmdbTrending, ...animeTrending];
};

// ============================================================================
// EXTENDED DETAILS (CAST, EPISODES)
// ============================================================================

export const fetchJikanCharacters = async (malId) => {
  const data = await jikanFetch(`/anime/${malId}/characters`);
  if (!data || !data.data) return [];
  // return top 6 voice actors (or characters)
  return data.data.slice(0, 6).map(c => {
    const va = c.voice_actors?.find(v => v.language === 'Japanese');
    return {
      name: va ? va.person.name : c.character.name,
      role: c.character.name,
      image: proxyImage(va ? va.person.images?.jpg?.image_url : c.character.images?.jpg?.image_url)
    };
  });
};

export const fetchTVMazeCast = async (tvmazeId) => {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${tvmazeId}/cast`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 6).map(c => ({
      name: c.person.name,
      role: c.character.name,
      image: proxyImage(c.person.image?.medium)
    }));
  } catch (e) {
    return [];
  }
};

export const fetchTMDBCast = async (tmdbId, category = 'movies', titleName = '') => {
  const catLower = (category || '').toLowerCase();
  const isTv = ['series', 'kdrama', 'bl', 'gl', 'thai', 'tv', 'anime'].includes(catLower);
  const type = isTv ? 'tv' : 'movie';
  
  let data = await tmdbFetch(`/${type}/${tmdbId}/credits`);
  
  if ((!data || !data.cast || data.cast.length === 0)) {
    const oppType = isTv ? 'movie' : 'tv';
    data = await tmdbFetch(`/${oppType}/${tmdbId}/credits`);
  }

  if (data && data.cast && data.cast.length > 0) {
    return data.cast.slice(0, 10).map(c => ({
      name: c.name,
      role: c.character || c.known_for_department || 'Actor',
      image: c.profile_path ? `${TMDB_IMG_BASE}${c.profile_path}` : FALLBACK_POSTER
    }));
  }
  
  // TVMaze fallback if TMDB fails
  if (titleName) {
    try {
      const searchRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(titleName)}`, { signal: AbortSignal.timeout(5000) });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData && searchData.length > 0) {
          const tvmazeId = searchData[0].show.id;
          return await fetchTVMazeCast(tvmazeId);
        }
      }
    } catch(e) {
      console.error('TVMaze fallback error:', e);
    }
  }
  
  return [];
};

export const fetchTitleDetails = async (id, category) => {
  try {
    if (String(id).startsWith('tmdb_')) {
      const tmdbId = String(id).replace('tmdb_', '');
      const type = category === 'series' ? 'tv' : 'movie';
      const data = await tmdbFetch(`/${type}/${tmdbId}`);
      if (data) {
        return { 
          totalEpisodes: type === 'tv' ? (data.number_of_episodes || '?') : 1, 
          totalSeasons: type === 'tv' ? (data.number_of_seasons || 1) : 1,
          runtime: data.runtime || 120 
        };
      }
    } else if (String(id).startsWith('mal_')) {
      const malId = String(id).replace('mal_', '');
      const data = await jikanFetch(`/anime/${malId}`);
      if (data && data.data) {
        return { totalEpisodes: data.data.episodes || '?' };
      }
    }
  } catch (e) {
    console.error('Failed to fetch detailed info:', e);
  }
  return null;
};

// ============================================================================
// UNIVERSAL TMDB ID RESOLVER (Converts MAL / TVMaze / MangaDex -> TMDB ID)
// ============================================================================
export const resolveTMDBId = async (media) => {
  if (!media) return null;
  if (media.tmdbId) return media.tmdbId;

  const rawId = String(media.id || '');
  if (rawId.startsWith('tmdb_')) {
    const parsed = rawId.replace('tmdb_', '');
    if (!isNaN(parseInt(parsed))) {
      media.tmdbId = parsed;
      return parsed;
    }
  }

  if (/^\d+$/.test(rawId)) {
    media.tmdbId = rawId;
    return rawId;
  }

  try {
    const cleanTitle = (media.title || '').split('(')[0].split('Season')[0].trim();
    if (!cleanTitle) return null;

    const data = await tmdbFetch('/search/multi', { query: cleanTitle, include_adult: false });
    if (data && data.results && data.results.length > 0) {
      const match = data.results.find(r => (r.title || r.name || '').toLowerCase() === cleanTitle.toLowerCase()) || data.results[0];
      if (match && match.id) {
        media.tmdbId = String(match.id);
        return String(match.id);
      }
    }
  } catch (e) {
    console.error('Failed to resolve TMDB ID:', e);
  }

  return null;
};

// ============================================================================
// STREAMING PROVIDERS
// ============================================================================
export const getEmbedUrl = (media, provider, season = 1, episode = 1) => {
    let tmdbId = media.tmdbId || null;
    let category = media.category;
    
    if (!tmdbId && String(media.id).startsWith('tmdb_')) {
        tmdbId = String(media.id).replace('tmdb_', '');
    }

    if (!tmdbId) {
        const numericMatch = String(media.id).match(/\d+/);
        tmdbId = numericMatch ? numericMatch[0] : media.id;
    }

    const type = category === 'movies' ? 'movie' : 'tv';

    switch (provider) {
        case 'nontongo':
            return type === 'movie' ? 
                `https://nontongo.win/embed/movie/${tmdbId}` : 
                `https://nontongo.win/embed/tv/${tmdbId}/${season}/${episode}`;
        case 'vidlink':
            return type === 'movie' ? 
                `https://vidlink.pro/movie/${tmdbId}` : 
                `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
        case 'vidsrc-pm':
            return type === 'movie' ? 
                `https://vidsrc.pm/embed/movie/${tmdbId}` : 
                `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}`;
        case 'vidsrc-net':
            return type === 'movie' ? 
                `https://vidsrc.net/embed/movie?tmdb=${tmdbId}` : 
                `https://vidsrc.net/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        case 'vidsrc-xyz':
            return type === 'movie' ? 
                `https://vidsrc.xyz/embed/movie/${tmdbId}` : 
                `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}-${episode}`;
        case 'vidsrc-in':
            return type === 'movie' ? 
                `https://vidsrc.in/embed/movie/${tmdbId}` : 
                `https://vidsrc.in/embed/tv/${tmdbId}/${season}/${episode}`;
        case 'vidsrc-cc':
            return type === 'movie' ? 
                `https://vidsrc.cc/v2/embed/movie/${tmdbId}` : 
                `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
        case 'embed-su':
            return type === 'movie' ? 
                `https://embed.su/embed/movie/${tmdbId}` : 
                `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
        case 'superembed':
            return type === 'movie' ? 
                `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1` : 
                `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
        case '2embed':
            return type === 'movie' ? 
                `https://www.2embed.cc/embed/${tmdbId}` : 
                `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
        case 'smashy':
            return type === 'movie' ? 
                `https://player.smashy.stream/movie/${tmdbId}` : 
                `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}`;
        case 'autoembed':
            return type === 'movie' ? 
                `https://autoembed.co/movie/tmdb/${tmdbId}` : 
                `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`;
        case 'adminhihi':
            return type === 'movie' ? 
                `https://moviesapi.club/movie/${tmdbId}` : 
                `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`;
        default:
            return `https://vidsrc.pm/embed/${type}/${tmdbId}`;
    }
};
