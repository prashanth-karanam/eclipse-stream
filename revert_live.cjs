const fs = require('fs');
let code = fs.readFileSync('api.js', 'utf8');

const replacement = `export const fetchLiveCatalog = async (page = 1) => {
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
      searchTMDB('korean drama', 'tv'),
      searchTMDB('thai drama', 'tv'),
      searchTMDB('boys love', 'tv'),
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
};`;

code = code.replace(/export const fetchLiveCatalog = async \(page = 1\) => \{[\s\S]*?catch \(e\) \{\s*console\.error\('Error fetching live catalog:', e\);\s*return null;\s*\}\s*\};/, replacement);

fs.writeFileSync('api.js', code);
console.log('Reverted fetchLiveCatalog to TMDB.');
