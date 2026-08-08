const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

const newFuncs = `
window.decrementTitleProgress = async function(titleId) {
  const title = state.titles.find(t => t.id == titleId);
  if (!title) return;
  if (!title.progress || title.progress <= 1) {
    await window.removeTitle(titleId);
    return;
  }
  title.progress -= 1;
  title.status = 'in-progress';
  state.justCompleted = false;
  
  const isMovie = title.category === 'movies';
  const isReading = title.category === 'manhwa';
  const unitHours = isReading ? 0.1 : isMovie ? ((title.runtime || 120) / 60) : 0.4;
  title.totalHours = parseFloat(((title.progress || 0) * unitHours).toFixed(1));
  title.lastUpdated = new Date().toISOString();
  
  saveLocalWatchlist();
  
  const unitLabel = isReading ? 'Chapter' : isMovie ? 'Film' : 'Episode';
  showUndoToast('Undo: Decremented ' + unitLabel + ' to ' + title.progress);
  
  if (state.user) {
    try {
      const titleRef = doc(db, 'users', state.user.uid, 'watchlist', String(title.id));
      await setDoc(titleRef, title, { merge: true });
    } catch(err) { console.error('Failed to sync decrement:', err); }
  }
  
  updateHeroZone();
  updateStrip();
  if (state.insightsOpen) renderInsightsTab(state.insightsTab);
  if (state.titlelistOpen) renderTitleListContent(state.titlelistCategory, state.titlelistFilter);
}

window.removeTitle = async function(titleId) {
  const idx = state.titles.findIndex(t => t.id == titleId);
  if (idx === -1) return;
  
  const title = state.titles[idx];
  state.titles.splice(idx, 1);
  saveLocalWatchlist();
  
  showUndoToast('Removed "' + title.title + '" from Library');
  
  if (state.user) {
    try {
      const titleRef = doc(db, 'users', state.user.uid, 'watchlist', String(title.id));
      await deleteDoc(titleRef);
    } catch(err) { console.error('Failed to delete:', err); }
  }
  
  updateHeroZone();
  updateStrip();
  if (state.insightsOpen) renderInsightsTab(state.insightsTab);
  if (state.titlelistOpen) renderTitleListContent(state.titlelistCategory, state.titlelistFilter);
}
`;

c = c.replace(/async function updateTitleProgress/g, newFuncs + '\nasync function updateTitleProgress');
fs.writeFileSync('app.js', c);
console.log('Added decrementTitleProgress and removeTitle');
