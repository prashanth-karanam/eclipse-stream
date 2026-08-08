import { fetchLiveCatalog, getTrendingTMDB } from './api.js';

async function test() {
  console.log("Testing getTrendingTMDB...");
  const tmdb = await getTrendingTMDB('all', 'day', 1);
  console.log("TMDB returned:", tmdb ? tmdb.length : 'null');

  console.log("Testing fetchLiveCatalog...");
  const cat = await fetchLiveCatalog(1);
  console.log("Categories keys:", Object.keys(cat || {}));
  console.log("Movies count:", cat?.movies?.length);
  console.log("KDrama count:", cat?.kdrama?.length);
}
test();
