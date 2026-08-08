const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Fix setupMatrixPills & renderMatrixSections
code = code.replace(
  `  const sections = [
    { id: 'anime', title: 'Top Anime Streams', category: 'anime' },
    { id: 'movies', title: 'Trending Movies', category: 'movies' },
    { id: 'series', title: 'Popular Series', category: 'series' },
    { id: 'manhwa', title: 'Top Manhwa Readers', category: 'manhwa' }
  ];`,
  `  const sections = [
    { id: 'anime', title: 'Top Anime Streams', category: 'anime' },
    { id: 'movies', title: 'Trending Movies', category: 'movies' },
    { id: 'series', title: 'Popular Series', category: 'series' },
    { id: 'manhwa', title: 'Top Manhwa Readers', category: 'manhwa' },
    { id: 'kdrama', title: 'Top K-Dramas', category: 'kdrama' },
    { id: 'thai', title: 'Thai BL & Drama', category: 'thai' },
    { id: 'bl', title: 'BL Series', category: 'bl' },
    { id: 'gl', title: 'GL Series', category: 'gl' }
  ];`
);

code = code.replace(
  `      if (filter === 'trending' || filter === 'all') {
        document.querySelectorAll('.matrix-section').forEach(sec => sec.classList.remove('hidden'));
      } else if (['anime', 'movies', 'series', 'manhwa', 'manga', 'kdrama', 'thai', 'bl', 'gl'].includes(filter.toLowerCase())) {
        const targetCat = filter === 'manga' ? 'manhwa' : filter;
        document.querySelectorAll('.matrix-section').forEach(sec => {
          const isMatch = sec.id === \`section-\${targetCat}\` || sec.dataset.category === targetCat;
          sec.classList.toggle('hidden', !isMatch);
        });
      } else {`,
  `      if (filter === 'trending' || filter === 'all') {
        document.querySelectorAll('.matrix-section').forEach(sec => sec.classList.remove('hidden'));
        document.getElementById('matrixGrid').classList.remove('hidden');
      } else if (['anime', 'movies', 'series', 'manhwa', 'manga', 'kdrama', 'thai', 'bl', 'gl'].includes(filter.toLowerCase())) {
        const targetCat = filter === 'manga' ? 'manhwa' : filter;
        document.querySelectorAll('.matrix-section').forEach(sec => {
          const isMatch = sec.id === \`section-\${targetCat}\` || sec.dataset.category === targetCat;
          sec.classList.toggle('hidden', !isMatch);
        });
        document.getElementById('matrixGrid').classList.add('hidden'); // hide the infinite grid so only the section shows
      } else {`
);

// 2. Attach Oracle Add buttons
code = code.replace(
  `function attachInsightsListeners() {
  // Bind both .insights-tab (HTML panel) and .insights-tab-btn (legacy)
  document.querySelectorAll('.insights-tab, .insights-tab-btn').forEach(btn => {
    btn.onclick = () => switchInsightsTab(btn.dataset.tab);
  });
}`,
  `function attachInsightsListeners() {
  // Bind both .insights-tab (HTML panel) and .insights-tab-btn (legacy)
  document.querySelectorAll('.insights-tab, .insights-tab-btn').forEach(btn => {
    btn.onclick = () => switchInsightsTab(btn.dataset.tab);
  });
  
  // Oracle quick add
  document.querySelectorAll('.oracle-quick-add').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const item = {
        title: btn.dataset.title,
        category: btn.dataset.category,
        genre: btn.dataset.genre,
        poster: btn.dataset.poster,
        id: 'oracle_' + Date.now()
      };
      
      const alreadyInLibrary = (state.titles || []).some(t => t.title === item.title);
      if (alreadyInLibrary) {
        showUndoToast(\`"\${item.title}" is already in your library!\`);
        return;
      }
      
      const newTitle = {
        ...item,
        episodes: 0,
        chapters: 0,
        progress: 0,
        status: 'planning',
        rating: 0
      };
      state.titles.unshift(newTitle);
      saveLocalWatchlist();
      
      btn.innerHTML = 'Added!';
      btn.disabled = true;
      btn.style.background = 'rgba(16, 185, 129, 0.3)';
      btn.style.borderColor = '#10b981';
      showUndoToast(\`Added "\${item.title}" to library!\`);
      updateHeroZone();
      updateStrip();
    };
  });
}`
);

// 3. Enlarge achievements
code = code.replace(
  `      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px; opacity: \${ach.unlocked ? '1' : '0.4'};">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: \${ach.unlocked ? ach.clr : 'rgba(255,255,255,0.1)'}; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: \${ach.unlocked ? '0 0 15px '+ach.clr+'40' : 'none'}; flex-shrink: 0;">
          \${ach.unlocked ? ach.icon : '🔒'}
        </div>
        <div style="flex: 1; min-width: 0;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">\${ach.label}</h4>
          <p style="margin: 0; font-size: 11px; color: var(--text-secondary); line-height: 1.2;">\${ach.desc}</p>
        </div>
      </div>`,
  `      <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 16px; opacity: \${ach.unlocked ? '1' : '0.4'}; transform: scale(1.02); margin-bottom: 8px;">
        <div style="width: 56px; height: 56px; border-radius: 14px; background: \${ach.unlocked ? ach.clr : 'rgba(255,255,255,0.1)'}; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: \${ach.unlocked ? '0 0 20px '+ach.clr+'60' : 'none'}; flex-shrink: 0;">
          \${ach.unlocked ? ach.icon : '🔒'}
        </div>
        <div style="flex: 1; min-width: 0;">
          <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">\${ach.label}</h4>
          <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.3;">\${ach.desc}</p>
        </div>
      </div>`
);


// 4. Time when skipped
code = code.replace(
  `  const skipDateBtn = $('#skipDateBtn');
  if (skipDateBtn) {
    skipDateBtn.addEventListener('click', () => {
      if (state.markWatchedItem) {
        updateTitleProgress(state.markWatchedItem, 1, 'completed');
        showUndoToast(\`Marked "\${state.markWatchedItem.title}" as completed!\`);
      }
      closeMarkWatched();
    });
  }`,
  `  const skipDateBtn = $('#skipDateBtn');
  if (skipDateBtn) {
    skipDateBtn.addEventListener('click', () => {
      if (state.markWatchedItem) {
        state.markWatchedItem.completedAt = new Date().toISOString();
        updateTitleProgress(state.markWatchedItem, 1, 'completed');
        showUndoToast(\`Marked "\${state.markWatchedItem.title}" as completed!\`);
      }
      closeMarkWatched();
    });
  }`
);

// 5. Gear icon in createContentCard
code = code.replace(
  `        <button class="content-card__info-btn" onclick="event.stopPropagation()" style="background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border: none; color: white; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-top: 8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Details
        </button>
      </div>\` : ''}`,
  `        <div style="display: flex; gap: 6px; margin-top: 8px; width: 100%;">
          <button class="content-card__info-btn" onclick="event.stopPropagation()" style="flex: 1; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border: none; color: white; padding: 6px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Details
          </button>
          \${alreadyInLibrary ? \`<button class="content-card__gear-btn" onclick="event.stopPropagation()" style="background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border: none; color: white; width: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Set total count">
            ⚙️
          </button>\` : ''}
        </div>
      </div>\` : ''}`
);

code = code.replace(
  `  const infoBtn = card.querySelector('.content-card__info-btn');
  if (infoBtn) {
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openInfoModal(item);
    });
  }`,
  `  const infoBtn = card.querySelector('.content-card__info-btn');
  if (infoBtn) {
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openInfoModal(item);
    });
  }

  const gearBtn = card.querySelector('.content-card__gear-btn');
  if (gearBtn) {
    gearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const unit = item.category === 'manhwa' ? 'chapters' : 'episodes';
      const newVal = prompt(\`Set total \${unit} for "\${item.title}":\`, item.totalEpisodes || item.episodes || item.chapters || 0);
      if (newVal !== null && !isNaN(parseInt(newVal))) {
        const found = state.titles.find(t => t.id === item.id || t.title === item.title);
        if (found) {
          if (unit === 'chapters') found.chapters = parseInt(newVal);
          else found.episodes = parseInt(newVal);
          found.totalEpisodes = parseInt(newVal);
          saveLocalWatchlist();
          showUndoToast(\`Updated total \${unit} to \${newVal}!\`);
          updateHeroZone();
          updateStrip();
        }
      }
    });
  }`
);

fs.writeFileSync('app.js', code);
console.log('Patched app.js successfully.');
