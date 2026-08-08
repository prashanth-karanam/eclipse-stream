const fs = require('fs');
let code = fs.readFileSync('api.js', 'utf8');

const oldLiveCatalog = `      discoverTMDB('tv', { with_original_language: 'ko', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_original_language: 'th', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_keywords: '210024', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_keywords: '198555', sort_by: 'popularity.desc', page })`;

const newLiveCatalog = `      discoverTMDB('tv', { with_original_language: 'ko', with_genres: '18', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_original_language: 'th', with_genres: '18', sort_by: 'popularity.desc', page }),
      discoverTMDB('tv', { with_keywords: '210024', sort_by: 'popularity.desc', page }),
      searchTMDB('girls love', 'tv')`;

code = code.replace(oldLiveCatalog, newLiveCatalog);
fs.writeFileSync('api.js', code);
console.log('Patched api.js with correct genres');
