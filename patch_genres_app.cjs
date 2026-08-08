const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const regexKdrama = /items = await discoverTMDB\('tv', \{ with_original_language: 'ko', sort_by: 'popularity\.desc', page \}\);/;
const replacementKdrama = `items = await discoverTMDB('tv', { with_original_language: 'ko', with_genres: '18', sort_by: 'popularity.desc', page });`;

const regexThai = /items = await discoverTMDB\('tv', \{ with_original_language: 'th', sort_by: 'popularity\.desc', page \}\);/;
const replacementThai = `items = await discoverTMDB('tv', { with_original_language: 'th', with_genres: '18', sort_by: 'popularity.desc', page });`;

const regexGL = /items = await discoverTMDB\('tv', \{ with_keywords: '198555', sort_by: 'popularity\.desc', page \}\);/;
const replacementGL = `items = await searchTMDB('girls love ' + page, 'tv');`;

code = code.replace(regexKdrama, replacementKdrama);
code = code.replace(regexThai, replacementThai);
code = code.replace(regexGL, replacementGL);

fs.writeFileSync('app.js', code);
console.log('Patched app.js loadSectionPage genres');
