import { fetchLiveCatalog } from './api.js';
async function run() {
  const cat = await fetchLiveCatalog();
  console.log("Anime:", cat.anime ? cat.anime.length : 'null');
  console.log("KDrama:", cat.kdrama ? cat.kdrama.length : 'null');
  console.log("Thai:", cat.thai ? cat.thai.length : 'null');
  console.log("BL:", cat.bl ? cat.bl.length : 'null');
  console.log("GL:", cat.gl ? cat.gl.length : 'null');
}
run();
