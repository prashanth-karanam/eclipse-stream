const fs = require('fs');
let c = fs.readFileSync('api.js', 'utf8');

const oldProxy = `const proxyFetchJson = async (url) => {
  try {
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('Proxy failed');
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data && data.contents) return JSON.parse(data.contents);
    } catch (e) {
      console.warn('Proxy returned non-JSON', text.substring(0, 100));
    }
    return null;
  } catch (e) {
    console.error("Proxy fetch failed:", e);
    return null;
  }
};`;

const newProxy = `const proxyFetchJson = async (url) => {
  const proxies = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://thingproxy.freeboard.io/fetch/'
  ];
  for (let proxy of proxies) {
    try {
      const proxyUrl = proxy.includes('allorigins') ? proxy + encodeURIComponent(url) : proxy + url;
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
};`;

c = c.replace(oldProxy, newProxy);

// Now patch MangaDex to use proxyFetchJson on fail
const oldMD = `      const mdRes = await fetch(
        \`https://api.mangadex.org/manga?limit=20&offset=\${offset}&publicationDemographic[]=seinen&publicationDemographic[]=josei&originalLanguage[]=ko&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art\`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (mdRes.ok) {
        const mdData = await mdRes.json();`;

const newMD = `      const mdUrl = \`https://api.mangadex.org/manga?limit=20&offset=\${offset}&publicationDemographic[]=seinen&publicationDemographic[]=josei&originalLanguage[]=ko&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art\`;
      let mdData = null;
      try {
        const mdRes = await fetch(mdUrl, { signal: AbortSignal.timeout(6000) });
        if (mdRes.ok) mdData = await mdRes.json();
      } catch (e) {
        mdData = await proxyFetchJson(mdUrl);
      }
      if (mdData) {`;

c = c.replace(oldMD, newMD);

fs.writeFileSync('api.js', c);
console.log('Patched proxies in api.js');
