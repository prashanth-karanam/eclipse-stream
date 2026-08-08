const fs = require('fs');
let code = fs.readFileSync('api.js', 'utf8');

// Fix the proxy fetch function to not crash on HTML
code = code.replace(
  `    const data = await res.json();
    return JSON.parse(data.contents);`,
  `    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data && data.contents) return JSON.parse(data.contents);
    } catch (e) {
      console.warn('Proxy returned non-JSON', text.substring(0, 100));
    }
    return null;`
);

const fetchLiveReplacement = `export const fetchLiveCatalog = async (page = 1) => {
  try {
    const tvmazePage = Math.max(0, page - 1);
    
    // Fetch base content
    const [anime, manhwa, tvshows] = await Promise.all([
      getTopJikan('anime', page),
      fetchTopManhwa(page),
      fetchTVMazeSeries(tvmazePage)
    ]);

    // Fetch specific categories from TVMaze directly so they work WITHOUT VPN in India
    const [kdramaRes, thaiRes, blRes] = await Promise.all([
      fetch('https://api.tvmaze.com/search/shows?q=korean+drama').then(r => r.ok ? r.json() : []),
      fetch('https://api.tvmaze.com/search/shows?q=thai').then(r => r.ok ? r.json() : []),
      fetch('https://api.tvmaze.com/search/shows?q=boys+love').then(r => r.ok ? r.json() : [])
    ]);

    const parseTvMazeSearch = (arr) => arr.map(item => ({
      id: \`tvm_\${item.show.id}\`,
      title: item.show.name,
      poster: item.show.image?.medium || item.show.image?.original || FALLBACK_POSTER,
      rating: item.show.rating?.average ? item.show.rating.average.toFixed(1) : '8.0',
      releaseYear: (item.show.premiered || '').substring(0, 4),
      genre: item.show.genres?.[0] || 'Drama',
      description: item.show.summary ? item.show.summary.replace(/<[^>]+>/g, '') : '',
      episodes: 16
    }));

    const kdrama = parseTvMazeSearch(kdramaRes);
    const thai = parseTvMazeSearch(thaiRes);
    const bl = parseTvMazeSearch(blRes);
    
    const series = tvshows.filter(s => s.category === 'series').slice(0, 20);
    const movies = tvshows.filter(s => s.category === 'movies').concat(tvshows.slice(25, 45)).map(s => ({ ...s, category: 'movies' })).slice(0, 20);

    return {
      anime: (anime || []).slice(0, 20),
      manhwa: (manhwa || []).slice(0, 20),
      series: series.length > 0 ? series : [],
      movies: movies.length > 0 ? movies : [],
      kdrama: kdrama.map(s => ({ ...s, category: 'kdrama' })).slice(0, 20),
      thai: thai.map(s => ({ ...s, category: 'thai' })).slice(0, 20),
      bl: bl.map(s => ({ ...s, category: 'bl' })).slice(0, 20),
      gl: bl.slice().reverse().map(s => ({ ...s, category: 'gl' })) // Fallback GL to reversed BL for now
    };
  } catch (e) {
    console.error('Error fetching live catalog:', e);
    return null;
  }
};`;

// replace fetchLiveCatalog entirely
code = code.replace(/export const fetchLiveCatalog = async \(page = 1\) => \{[\s\S]*?catch \(e\) \{\s*console\.error\('Error fetching live catalog:', e\);\s*return null;\s*\}\s*\};/, fetchLiveReplacement);

fs.writeFileSync('api.js', code);
console.log('Patched fetchLiveCatalog in api.js');
