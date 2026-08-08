const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const regexKdrama = /items = await searchTMDB\('korean drama ' \+ page, 'tv'\);[\s\S]*?items = \(items \|\| \[\]\)\.map\(i => \(\{ \.\.\.i, category: 'kdrama' \}\)\);/;
const replacementKdrama = `items = await discoverTMDB('tv', { with_original_language: 'ko', sort_by: 'popularity.desc', page });
        items = (items || []).map(i => ({ ...i, category: 'kdrama' }));`;

const regexThai = /items = await searchTMDB\('thai drama ' \+ page, 'tv'\);[\s\S]*?items = \(items \|\| \[\]\)\.map\(i => \(\{ \.\.\.i, category: 'thai' \}\)\);/;
const replacementThai = `items = await discoverTMDB('tv', { with_original_language: 'th', sort_by: 'popularity.desc', page });
        items = (items || []).map(i => ({ ...i, category: 'thai' }));`;

const regexBL = /items = await searchTMDB\('boys love ' \+ page, 'tv'\);[\s\S]*?items = \(items \|\| \[\]\)\.map\(i => \(\{ \.\.\.i, category: 'bl' \}\)\);/;
const replacementBL = `items = await discoverTMDB('tv', { with_keywords: '210024', sort_by: 'popularity.desc', page });
        items = (items || []).map(i => ({ ...i, category: 'bl' }));`;

const regexGL = /items = await searchTMDB\('girls love ' \+ page, 'tv'\);[\s\S]*?items = \(items \|\| \[\]\)\.map\(i => \(\{ \.\.\.i, category: 'gl' \}\)\);/;
const replacementGL = `items = await discoverTMDB('tv', { with_keywords: '198555', sort_by: 'popularity.desc', page });
        items = (items || []).map(i => ({ ...i, category: 'gl' }));`;

code = code.replace(regexKdrama, replacementKdrama);
code = code.replace(regexThai, replacementThai);
code = code.replace(regexBL, replacementBL);
code = code.replace(regexGL, replacementGL);

fs.writeFileSync('app.js', code);
console.log('Patched app.js loadSectionPage with discoverTMDB');
