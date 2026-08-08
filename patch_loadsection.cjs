const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const regex = /if \(sectionId === 'anime'\) \{[\s\S]*?\} else if \(sectionId === 'manhwa'\) \{[\s\S]*?items = \([^)]+\)\.map\(i => \(\{ \.\.\.i, category: 'manhwa' \}\)\);\s*\}/;

const replacement = `if (sectionId === 'anime') {
        const jikanPage = ((page - 1) % 5) + 1;
        items = await getTopJikan('anime', jikanPage);
        items = (items || []).map(i => ({ ...i, category: 'anime' }));
      } else if (sectionId === 'movies') {
        const tmdbPage = ((page - 1) % 3) + 1;
        const tmdbMovies = await getTrendingTMDB('movie', 'week', tmdbPage);
        items = (tmdbMovies || []).map(i => ({ ...i, category: 'movies' }));
        if (items.length === 0) {
          const tvm = await fetchTVMazeSeries(Math.max(0, page - 1));
          items = tvm.slice(0, 20).map(s => ({ ...s, category: 'movies' }));
        }
      } else if (sectionId === 'series') {
        const tmdbPage = ((page - 1) % 3) + 1;
        const tmdbSeries = await getTrendingTMDB('tv', 'week', tmdbPage);
        items = (tmdbSeries || []).map(i => ({ ...i, category: 'series' }));
        if (items.length === 0) {
          const tvm = await fetchTVMazeSeries(Math.max(0, page - 1));
          items = tvm.filter(s => s.category === 'series').slice(0, 20);
          if (items.length === 0) items = tvm.slice(0, 20).map(s => ({ ...s, category: 'series' }));
        }
      } else if (sectionId === 'manhwa') {
        const jikanPage = ((page - 1) % 5) + 1;
        items = await fetchTopManhwa(jikanPage);
        items = (items || []).map(i => ({ ...i, category: 'manhwa' }));
      } else if (sectionId === 'kdrama') {
        items = await searchTMDB('korean drama ' + page, 'tv');
        if (!items || items.length === 0) {
           const res = await fetch('https://api.tvmaze.com/search/shows?q=korean+drama');
           if (res.ok) {
             const data = await res.json();
             items = data.map(item => ({
               id: \`tvm_\${item.show.id}\`,
               title: item.show.name,
               category: 'kdrama',
               poster: item.show.image?.medium || item.show.image?.original || FALLBACK_POSTER,
               rating: item.show.rating?.average ? item.show.rating.average.toFixed(1) : '8.0',
               releaseYear: (item.show.premiered || '').substring(0, 4)
             }));
           }
        }
        items = (items || []).map(i => ({ ...i, category: 'kdrama' }));
      } else if (sectionId === 'thai') {
        items = await searchTMDB('thai drama ' + page, 'tv');
        if (!items || items.length === 0) {
           const res = await fetch('https://api.tvmaze.com/search/shows?q=thai+drama');
           if (res.ok) {
             const data = await res.json();
             items = data.map(item => ({
               id: \`tvm_\${item.show.id}\`,
               title: item.show.name,
               category: 'thai',
               poster: item.show.image?.medium || item.show.image?.original || FALLBACK_POSTER,
               rating: item.show.rating?.average ? item.show.rating.average.toFixed(1) : '8.0',
               releaseYear: (item.show.premiered || '').substring(0, 4)
             }));
           }
        }
        items = (items || []).map(i => ({ ...i, category: 'thai' }));
      } else if (sectionId === 'bl') {
        items = await searchTMDB('boys love ' + page, 'tv');
        if (!items || items.length === 0) {
           const res = await fetch('https://api.tvmaze.com/search/shows?q=boys+love');
           if (res.ok) {
             const data = await res.json();
             items = data.map(item => ({
               id: \`tvm_\${item.show.id}\`,
               title: item.show.name,
               category: 'bl',
               poster: item.show.image?.medium || item.show.image?.original || FALLBACK_POSTER,
               rating: item.show.rating?.average ? item.show.rating.average.toFixed(1) : '8.0',
               releaseYear: (item.show.premiered || '').substring(0, 4)
             }));
           }
        }
        items = (items || []).map(i => ({ ...i, category: 'bl' }));
      } else if (sectionId === 'gl') {
        items = await searchTMDB('girls love ' + page, 'tv');
        if (!items || items.length === 0) {
           const res = await fetch('https://api.tvmaze.com/search/shows?q=girls+love');
           if (res.ok) {
             const data = await res.json();
             items = data.map(item => ({
               id: \`tvm_\${item.show.id}\`,
               title: item.show.name,
               category: 'gl',
               poster: item.show.image?.medium || item.show.image?.original || FALLBACK_POSTER,
               rating: item.show.rating?.average ? item.show.rating.average.toFixed(1) : '8.0',
               releaseYear: (item.show.premiered || '').substring(0, 4)
             }));
           }
        }
        items = (items || []).map(i => ({ ...i, category: 'gl' }));
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync('app.js', code);
console.log('Patched loadSectionPage in app.js');
