const fs = require('fs');
let code = fs.readFileSync('api.js', 'utf8');

const discoverFunction = `export const discoverTMDB = async (type = 'tv', params = {}) => {
  const data = await tmdbFetch(\`/discover/\${type}\`, params);
  if (!data || !data.results) return [];
  return data.results.map(item => normalizeTMDB(item, type === 'tv' ? 'series' : 'movies'));
};

export const getTrendingTMDB = async (type = 'all', timeWindow = 'day', page = 1) => {`;

code = code.replace(`export const getTrendingTMDB = async (type = 'all', timeWindow = 'day', page = 1) => {`, discoverFunction);

const liveCatalogOld = `      searchTMDB('korean drama', 'tv'),
      searchTMDB('thai drama', 'tv'),
      searchTMDB('boys love', 'tv'),
      searchTMDB('girls love', 'tv')`;

const liveCatalogNew = `      discoverTMDB('tv', { with_original_language: 'ko', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_original_language: 'th', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_keywords: '210024', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_keywords: '198555', sort_by: 'popularity.desc', page })`;

code = code.replace(liveCatalogOld, liveCatalogNew);

fs.writeFileSync('api.js', code);
console.log('Patched api.js with discoverTMDB');
