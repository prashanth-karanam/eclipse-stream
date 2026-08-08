const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

// 1. Update genreCounts logic to only include completed shows
const oldGenreLoop = `titles.forEach(t => { if (t.genre) genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1; });`;
const newGenreLoop = `titles.forEach(t => { if (t.status === 'completed' && t.genre) genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1; });`;
c = c.replace(oldGenreLoop, newGenreLoop);

// 2. Add onclick to pills and an empty container for details
const oldPillHTML = `<div class="ih-genre-pill" style="--h:\${hue}">
                <span>\${genre}</span>
                <div class="ih-genre-pill__bar"><div style="width:\${pct}%"></div></div>
                <span class="ih-genre-pill__count">\${count}</span>
              </div>`;
const newPillHTML = `<div class="ih-genre-pill" style="--h:\${hue}; cursor:pointer;" onclick="window._insightsExpandGenre('\${genre}')">
                <span>\${genre}</span>
                <div class="ih-genre-pill__bar"><div style="width:\${pct}%"></div></div>
                <span class="ih-genre-pill__count">\${count}</span>
              </div>`;
c = c.replace(oldPillHTML, newPillHTML);

// 3. Inject the genre details container right below the genres div
const oldGenresDivEnd = `</div>
      \` : ''}`;
const newGenresDivEnd = `</div>
        <div id="ihGenreDetails" style="margin-top:16px;"></div>
      \` : ''}`;
c = c.replace(oldGenresDivEnd, newGenresDivEnd);

// 4. Update the Continue Watching list to add the -1 and Delete buttons
const oldProgressItemHTML = `<div class="ih-progress-item__pct">\${pct}%</div>
              </div>`;
const newProgressItemHTML = `<div class="ih-progress-item__pct" style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                  <span>\${pct}%</span>
                  <div style="display:flex; gap:4px; margin-top:4px;">
                    <button onclick="event.stopPropagation(); window.decrementTitleProgress('\${t.id}')" style="background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:4px; padding:2px 6px; font-size:10px; cursor:pointer;" title="Remove 1 Episode">-1</button>
                    <button onclick="event.stopPropagation(); window.removeTitle('\${t.id}')" style="background:rgba(255,75,75,0.2); border:none; color:#ff4b4b; border-radius:4px; padding:2px 6px; font-size:10px; cursor:pointer;" title="Delete Title">🗑️</button>
                  </div>
                </div>
              </div>`;
c = c.replace(oldProgressItemHTML, newProgressItemHTML);

// 5. Add window._insightsExpandGenre
const expandFunc = `
window._insightsExpandGenre = function(genre) {
  const container = document.getElementById('ihGenreDetails');
  if (!container) return;
  
  const completedTitles = state.titles.filter(t => t.status === 'completed' && t.genre === genre);
  
  let totalHours = 0;
  let html = \`<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px;">
    <h3 style="margin:0 0 12px 0; font-size:16px; color:var(--text-primary); display:flex; justify-content:space-between;">
      <span>\${genre} Highlights</span>
      <span style="font-size:12px; color:var(--text-muted); cursor:pointer;" onclick="document.getElementById('ihGenreDetails').innerHTML=''">✕ Close</span>
    </h3>
    <div style="display:flex; flex-direction:column; gap:8px;">
  \`;
  
  completedTitles.forEach(t => {
    const isMovie = t.category === 'movies';
    const isReading = t.category === 'manhwa';
    const unitHours = isReading ? 0.1 : isMovie ? ((t.runtime || 120) / 60) : 0.4;
    const itemHours = (t.progress || 0) * unitHours;
    totalHours += itemHours;
    
    html += \`<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:8px;">
      <div style="display:flex; flex-direction:column;">
        <span style="font-size:13px; color:var(--text-primary);">\${t.title}</span>
        <span style="font-size:11px; color:var(--text-muted);">\${itemHours.toFixed(1)} hrs logged</span>
      </div>
      <div style="display:flex; gap:6px;">
        <button onclick="window.decrementTitleProgress('\${t.id}')" style="background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:4px; padding:4px 8px; font-size:11px; cursor:pointer;" title="Remove 1 Episode">-1</button>
        <button onclick="window.removeTitle('\${t.id}')" style="background:rgba(255,75,75,0.2); border:none; color:#ff4b4b; border-radius:4px; padding:4px 8px; font-size:11px; cursor:pointer;" title="Delete Title">🗑️</button>
      </div>
    </div>\`;
  });
  
  html += \`</div>
    <div style="margin-top:12px; font-size:13px; color:var(--cyan); text-align:right;">
      Total: \${totalHours.toFixed(1)} hrs in \${genre}
    </div>
  </div>\`;
  
  container.innerHTML = html;
};
`;

if(!c.includes('_insightsExpandGenre')) {
  c += '\n' + expandFunc;
}

fs.writeFileSync('app.js', c);
console.log('Patched renderOverviewTab');
