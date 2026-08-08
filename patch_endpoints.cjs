const fs = require('fs');
let code = fs.readFileSync('api.js', 'utf8');

// Replace TMDB_BASE_URL with an array and update tmdbFetch
code = code.replace(
  `const TMDB_BASE_URL = 'https://api.themoviedb.org/3';`,
  `const TMDB_ENDPOINTS = ['https://api.tmdb.org/3', 'https://api.themoviedb.org/3'];`
);

const fetchReplacement = `const tmdbFetch = async (endpoint, params = {}) => {
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
    const url = \`\${baseUrl}\${endpoint}?\${queryParams}\`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (response.ok) return await response.json();
    } catch (e) {
      lastError = e;
    }
  }

  console.warn("Direct TMDB fetch failed on all endpoints, attempting proxy...", lastError);
  return await proxyFetchJson(\`\${TMDB_ENDPOINTS[0]}\${endpoint}?\${queryParams}\`);
};`;

code = code.replace(/const tmdbFetch = async \(endpoint, params = \{\}\) => \{[\s\S]*?return await proxyFetchJson\(url\);\s*\}/, fetchReplacement);

fs.writeFileSync('api.js', code);
console.log("Patched api.js TMDB endpoints.");
