const fs = require('fs');
let code = fs.readFileSync('api.js', 'utf8');

// Add generic proxy fetch wrapper
const proxyFetchStr = `
const proxyFetchJson = async (url) => {
  try {
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('Proxy failed');
    const data = await res.json();
    return JSON.parse(data.contents);
  } catch (e) {
    console.error("Proxy fetch failed:", e);
    return null;
  }
};
`;

code = code.replace(
  `const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';`,
  `const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';\n` + proxyFetchStr
);

// Update tmdbFetch to use proxy on failure
code = code.replace(
  `  try {
    const response = await fetch(\`\${TMDB_BASE_URL}\${endpoint}?\${queryParams}\`, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('TMDB Fetch Error');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }`,
  `  const url = \`\${TMDB_BASE_URL}\${endpoint}?\${queryParams}\`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('TMDB Fetch Error');
    return await response.json();
  } catch (error) {
    console.warn("Direct TMDB fetch failed, attempting proxy...", error);
    return await proxyFetchJson(url);
  }`
);

// Update jikanFetch to use proxy on failure
code = code.replace(
  `      try {
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
        console.error(error);
        resolve(null);
      }`,
  `      try {
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
      }`
);

// Add vidsrc.in and vidsrc.cc providers
code = code.replace(
  `        case 'vidsrc-xyz':
            return type === 'movie' ? 
                \`https://vidsrc.xyz/embed/movie/\${tmdbId}\` : 
                \`https://vidsrc.xyz/embed/tv/\${tmdbId}/\${season}-\${episode}\`;`,
  `        case 'vidsrc-xyz':
            return type === 'movie' ? 
                \`https://vidsrc.xyz/embed/movie/\${tmdbId}\` : 
                \`https://vidsrc.xyz/embed/tv/\${tmdbId}/\${season}-\${episode}\`;
        case 'vidsrc-in':
            return type === 'movie' ? 
                \`https://vidsrc.in/embed/movie/\${tmdbId}\` : 
                \`https://vidsrc.in/embed/tv/\${tmdbId}/\${season}/\${episode}\`;
        case 'vidsrc-cc':
            return type === 'movie' ? 
                \`https://vidsrc.cc/v2/embed/movie/\${tmdbId}\` : 
                \`https://vidsrc.cc/v2/embed/tv/\${tmdbId}/\${season}/\${episode}\`;`
);

fs.writeFileSync('api.js', code);
console.log('Patched api.js successfully.');
