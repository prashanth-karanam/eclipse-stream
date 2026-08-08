const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');
code = code.replace(/https:\/\/image\.tmdb\.org\/t\/p\/w500\/[^'"]+\.jpg/g, 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop');
fs.writeFileSync('app.js', code);
console.log('Fixed TMDB posters');
