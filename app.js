/* ============================================================
   Eclipse — App Logic
   All UI interactions, state management (stubbed), and features
   ============================================================ */

import {
  searchAll, searchAllStreaming, getTrendingAll,
  fetchLiveCatalog, getTopJikan, fetchTopManhwa, getTrendingTMDB, fetchTVMazeSeries, searchTMDB, discoverTMDB,
  fetchJikanCharacters, fetchTVMazeCast, fetchTMDBCast, fetchTitleDetails, getEmbedUrl, resolveTMDBId
} from './api.js';
import { 
  auth, db, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged,
  doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, deleteDoc
} from './firebase-config.js';

// ============================================================
// MOCK DATA — developer will replace with real Firebase/API data
// ============================================================

const liveCatalog = [];

// Generate derived full array
const _allTitles = [];

function parseNum(val, fallback = 0) {
  if (val === null || val === undefined || val === '?') return fallback;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? fallback : n;
}



const ACHIEVEMENTS = [
  // Milestones
  { id: 'ach1', name: 'First Steps', desc: 'Complete your first title', icon: '🎉', category: 'Milestones', current: 473, goal: 1, unlocked: true },
  { id: 'ach2', name: '100 Episodes', desc: 'Watch 100 episodes', icon: '🎬', category: 'Milestones', current: 4120, goal: 100, unlocked: true },
  { id: 'ach3', name: 'Century Club', desc: 'Complete 100 titles', icon: '💯', category: 'Milestones', current: 473, goal: 100, unlocked: true },
  { id: 'ach4', name: 'Thousand Hour Club', desc: 'Log 1,000 hours of watch time', icon: '⏳', category: 'Milestones', current: 1920, goal: 1000, unlocked: true },
  { id: 'ach5', name: 'Five Thousand Strong', desc: 'Watch 5,000 episodes', icon: '📺', category: 'Milestones', current: 4120, goal: 5000, unlocked: false },
  // Streaks
  { id: 'ach6', name: 'Week Warrior', desc: '7-day activity streak', icon: '🔥', category: 'Streaks', current: 0, goal: 7, unlocked: false },
  { id: 'ach7', name: 'Monthly Devotion', desc: '30-day activity streak', icon: '🌟', category: 'Streaks', current: 0, goal: 30, unlocked: false },
  // Explorer
  { id: 'ach8', name: 'Genre Explorer', desc: 'Try 5+ different genres', icon: '🧭', category: 'Explorer', current: 8, goal: 5, unlocked: true },
  { id: 'ach9', name: 'All-Rounder', desc: 'Complete at least one in every category', icon: '🌍', category: 'Explorer', current: 4, goal: 4, unlocked: true },
  // Fun / Binge
  { id: 'ach10', name: 'Season Speedrunner', desc: 'Finish a season in one day', icon: '🌙', category: 'Fun', current: 3, goal: 1, unlocked: true },
  { id: 'ach11', name: 'Weekend Warrior', desc: 'Binge 10+ episodes on a weekend', icon: '⚔️', category: 'Fun', current: 0, goal: 1, unlocked: false },
  // Easter Egg
  { id: 'ach12', name: 'Night Owl', desc: 'Watched something at 3 AM', icon: '🌌', category: 'Easter Egg', current: 1, goal: 1, unlocked: true },
  { id: 'ach13', name: 'The Critic', desc: 'Rated it 1★ and finished anyway', icon: '😂', category: 'Easter Egg', current: 0, goal: 1, unlocked: false },
];

const POSTER_MAP = {
  'Jujutsu Kaisen S2': 'https://cdn.myanimelist.net/images/anime/1792/138022.jpg',
  'Attack on Titan Final': 'https://cdn.myanimelist.net/images/anime/1911/119962.jpg',
  'Frieren: Beyond Journey\'s End': 'https://cdn.myanimelist.net/images/anime/1015/138025.jpg',
  'Solo Leveling': 'https://cdn.myanimelist.net/images/anime/1747/140972.jpg',
  'Demon Slayer S4': 'https://cdn.myanimelist.net/images/anime/1271/141753.jpg',
  'Vinland Saga S2': 'https://cdn.myanimelist.net/images/anime/1170/124312.jpg',
  'Spy x Family S2': 'https://cdn.myanimelist.net/images/anime/1506/138982.jpg',
  'Chainsaw Man': 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
  'Blue Lock': 'https://cdn.myanimelist.net/images/anime/1258/126929.jpg',
  'Mushoku Tensei S2': 'https://cdn.myanimelist.net/images/anime/1028/137784.jpg',
  'Tower of God': 'https://cdn.myanimelist.net/images/anime/1702/106229.jpg',
  'The Beginning After The End': 'https://cdn.myanimelist.net/images/manga/1/256722.jpg',
  'Omniscient Reader': 'https://cdn.myanimelist.net/images/manga/3/232479.jpg',
  'Omniscient Reader\'s Viewpoint': 'https://cdn.myanimelist.net/images/manga/3/232479.jpg',
  'Lookism': 'https://cdn.myanimelist.net/images/manga/2/168494.jpg',
  'Wind Breaker': 'https://cdn.myanimelist.net/images/anime/1376/142144.jpg',
  'Wind Breaker S2': 'https://cdn.myanimelist.net/images/anime/1376/142144.jpg',
  'Breaking Bad': 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop',
  'Stranger Things S4': 'https://images.unsplash.com/photo-1618519764620-7403abdbdf9c?w=400&auto=format&fit=crop',
  'The Bear S3': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop',
  'Severance S2': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop',
  'Shogun': 'https://images.unsplash.com/photo-1578508492211-1934335cfa31?w=400&auto=format&fit=crop',
  'House of the Dragon S2': 'https://images.unsplash.com/photo-1533596773359-99450a12e2c0?w=400&auto=format&fit=crop',
  'The Last of Us S2': 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=400&auto=format&fit=crop',
  'Dune: Part Two': 'https://images.unsplash.com/photo-1547823065-4cbbb2d4d185?w=400&auto=format&fit=crop',
  'Oppenheimer': 'https://images.unsplash.com/photo-1616091093714-c64882e9ab55?w=400&auto=format&fit=crop',
  'Spider-Man: Across the Spider-Verse': 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&auto=format&fit=crop',
  'The Batman': 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&auto=format&fit=crop',
  'Everything Everywhere All At Once': 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&auto=format&fit=crop',
  'Poor Things': 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&auto=format&fit=crop',
  'Killers of the Flower Moon': 'https://images.unsplash.com/photo-1523730205978-59fd1b2965e3?w=400&auto=format&fit=crop',
  'Godzilla Minus One': 'https://images.unsplash.com/photo-1596726915152-7e79393a5ea4?w=400&auto=format&fit=crop',
  'Dandadan': 'https://cdn.myanimelist.net/images/anime/1131/144901.jpg',
  'Kaiju No. 8': 'https://cdn.myanimelist.net/images/anime/1968/141443.jpg',
  'Sakamoto Days': 'https://cdn.myanimelist.net/images/manga/3/240507.jpg',
  'Sousou no Frieren Movie': 'https://cdn.myanimelist.net/images/anime/1015/138025.jpg',
  'Oshi No Ko S2': 'https://cdn.myanimelist.net/images/anime/1917/142985.jpg',
  'Return of the Blossoming Blade': 'https://cdn.myanimelist.net/images/manga/1/249969.jpg',
  'The Penguin': 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop',
  'Arcane S2': 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop',
  'Civil War': 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop',
  'Alien: Romulus': 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop',
  'Nano Machine': 'https://cdn.myanimelist.net/images/manga/1/237375.jpg',
  'Re:Zero S3': 'https://cdn.myanimelist.net/images/anime/1206/141870.jpg',
  'My Happy Marriage S2': 'https://cdn.myanimelist.net/images/anime/1483/135505.jpg',
  'Ripley': 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop',
  'Furiosa': 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop'
};

const FALLBACK_POSTER = 'https://cdn.myanimelist.net/images/anime/1015/138025.jpg';

function getPoster(item) {
  let url = null;
  if (!item) url = FALLBACK_POSTER;
  else if (item.poster) url = item.poster;
  else if (item.image) url = item.image;
  else if (item.title && POSTER_MAP[item.title]) url = POSTER_MAP[item.title];
  else if (item.title) {
    const titleLower = item.title.toLowerCase();
    const match = Object.keys(POSTER_MAP).find(k => titleLower.includes(k.toLowerCase()) || k.toLowerCase().includes(titleLower));
    if (match) url = POSTER_MAP[match];
  }

  if (url) return url;

  // Category fallback high-res posters
  const cat = item.category || 'anime';
  if (cat === 'anime') return 'https://cdn.myanimelist.net/images/anime/1015/138025.jpg';
  if (cat === 'manhwa') return 'https://cdn.myanimelist.net/images/manga/1/256722.jpg';
  if (cat === 'series') return 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop';
  return 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&auto=format&fit=crop';
}

// ============================================================
// STATE
// ============================================================

const state = {
  activeCategory: 'all',
  hasData: false, // Default to false until valid user titles are present
  searchQuery: '',
  matrixSearchQuery: '',
  matrixFilter: 'trending',
  insightsOpen: false,
  insightsTab: 'overview',
  markWatchedOpen: false,
  cmdPaletteOpen: false,
  timePeriod: 'all-time',
  quizStep: 0,
  quizAnswers: [],
  user: null,
  userProfile: null,
  titles: [],
  heroStatusTab: 'in-progress'
};

// ============================================================
// HELPERS
// ============================================================

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function getAllTitles() {
  return state.titles;
}

function showUndoToast(msg, undoFn = null) {
  try {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = 'pointer-events:auto;background:rgba(18,24,38,0.95);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:500;box-shadow:0 10px 30px rgba(0,0,0,0.5);display:flex;align-items:center;gap:12px;';
    
    toast.innerHTML = `
      <span>${msg}</span>
      ${undoFn ? `<button style="background:var(--cyan);border:none;color:#000;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;margin-left:8px;">Undo</button>` : ''}
    `;

    if (undoFn) {
      const btn = toast.querySelector('button');
      if (btn) btn.onclick = () => { undoFn(); toast.remove(); };
    }

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  } catch(e) {
    console.log('Toast:', msg);
  }
}

function getTitlesForCategory(category) {
  if (category === 'all') return state.titles;
  return state.titles.filter(t => t.category === category);
}

function getDiscoverForCategory(cat) {
  if (cat === 'all') return liveCatalog;
  return liveCatalog.filter(d => d.category === cat);
}

function createContentCard(item, showOverlay = true) {
  const card = document.createElement('div');
  card.className = 'content-card';
  const posterSrc = getPoster(item);

  // Check if already in library
  const alreadyInLibrary = (state.titles || []).some(t => t.id === item.id || t.title === item.title);
  const addBtnHtml = alreadyInLibrary
    ? `<button class="content-card__add-btn added" disabled style="background: rgba(16, 185, 129, 0.3); border-color: #10b981; cursor: default;" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        In Library
       </button>`
    : `<button class="content-card__add-btn" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add to List
       </button>`;

  card.innerHTML = `
    <div class="content-card__poster">
      ${posterSrc ? `<img src="${posterSrc}" alt="${item.title}" class="content-card__img" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />` : ''}
      <div class="content-card__poster-placeholder" style="${posterSrc ? 'display:none;' : 'display:flex;'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
          <line x1="7" y1="2" x2="7" y2="22"/>
          <line x1="17" y1="2" x2="17" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span>${item.title}</span>
      </div>
      ${item.rating ? `<span class="content-card__rating">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        ${item.rating}
      </span>` : ''}
      <span class="content-card__genre">${item.genre || ''}</span>
      ${showOverlay ? `<div class="content-card__overlay">
        ${addBtnHtml}
        <div style="display: flex; gap: 6px; margin-top: 8px; width: 100%;">
          <button class="content-card__info-btn" onclick="event.stopPropagation()" style="flex: 1; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border: none; color: white; padding: 6px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Details
          </button>
          ${alreadyInLibrary ? `<button class="content-card__gear-btn" onclick="event.stopPropagation()" style="background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border: none; color: white; width: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Set total count">
            ⚙️
          </button>` : ''}
        </div>
      </div>` : ''}
    </div>
    <div class="content-card__info" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
      <div style="flex: 1; min-width: 0;">
        <div class="content-card__title">${item.title}</div>
        <div class="content-card__sub">${item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : ''} ${item.genre ? '· ' + item.genre : ''}</div>
      </div>
      ${item.category !== 'manhwa' ? `
        <button class="content-card__play-btn" title="Stream Now" style="background: var(--cyan, #FF4B4B); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: transform 0.2s ease; box-shadow: 0 2px 8px rgba(255, 75, 75, 0.4);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 2px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      ` : ''}
    </div>
  `;

  const infoBtn = card.querySelector('.content-card__info-btn');
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
      const newVal = prompt(`Set total ${unit} for "${item.title}":`, item.totalEpisodes || item.episodes || item.chapters || 0);
      if (newVal !== null && !isNaN(parseInt(newVal))) {
        const found = state.titles.find(t => t.id === item.id || t.title === item.title);
        if (found) {
          if (unit === 'chapters') found.chapters = parseInt(newVal);
          else found.episodes = parseInt(newVal);
          found.totalEpisodes = parseInt(newVal);
          saveLocalWatchlist();
          showUndoToast(`Updated total ${unit} to ${newVal}!`);
          updateHeroZone();
          updateStrip();
        }
      }
    });
  }

  card.addEventListener('click', () => {
    openInfoModal(item);
  });

  const playBtn = card.querySelector('.content-card__play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPlayer(item);
    });
  }

  const addBtn = card.querySelector('.content-card__add-btn');
  if (addBtn && !alreadyInLibrary) {
    addBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      // Re-check at click time
      if ((state.titles || []).some(t => t.id === item.id || t.title === item.title)) {
        showUndoToast(`"${item.title}" is already in your library!`);
        addBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg> In Library';
        addBtn.disabled = true;
        return;
      }
      
      let eps = item.totalEpisodes || item.episodes || 0;
      let rt = item.runtime || 120;
      if (eps === '?' || eps === 0 || (item.category === 'series' && eps === 1)) {
        addBtn.innerHTML = '<span style="font-size:12px;">⏳</span> Fetching...';
        const details = await fetchTitleDetails(item.id, item.category);
        if (details) {
          eps = details.totalEpisodes !== '?' ? details.totalEpisodes : eps;
          rt = details.runtime || rt;
        }
      }

      const newTitle = {
        id: item.id || `custom_${Date.now()}`,
        title: item.title,
        category: item.category || 'movies',
        genre: item.genre || 'Various',
        episodes: eps === '?' ? 0 : Number(eps),
        chapters: item.category === 'manhwa' ? (eps === '?' ? 0 : Number(eps)) : undefined,
        runtime: rt,
        progress: 0,
        status: 'planning',
        rating: item.rating || 0,
        poster: item.poster || getPoster(item),
        description: item.description || '',
        releaseYear: item.releaseYear || '',
        totalHours: 0
      };

      state.titles.unshift(newTitle);
      saveLocalWatchlist();
      
      // Visual feedback
      addBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Added!';
      addBtn.classList.add('added');
      addBtn.disabled = true;
      addBtn.style.background = 'rgba(16, 185, 129, 0.3)';
      addBtn.style.borderColor = '#10b981';
      
      // Focus hero tab on status of new item and force mini-tabs scroller rebuild
      state.heroStatusTab = newTitle.status || 'planning';
      const miniTabsEl = $('#heroMiniTabs');
      if (miniTabsEl) delete miniTabsEl.dataset.renderedIds;

      showUndoToast(`✅ "${item.title}" added to Planning!`);
      updateHeroZone();
      updateStrip();

      if (state.user) {
        try {
          const docRef = doc(db, 'users', state.user.uid, 'watchlist', String(newTitle.id));
          await setDoc(docRef, newTitle);
        } catch (err) {
          console.error('Failed to sync to cloud:', err);
        }
      }
    });
  }

  const whyBtn = card.querySelector('.content-card__why-btn');
  if (whyBtn && item.reason) {
    whyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showUndoToast(`💡 Reason: ${item.reason}`);
    });
  }

  return card;
}

function createSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'skeleton-card';
  card.innerHTML = `
    <div class="skeleton skeleton-card__poster"></div>
    <div class="skeleton skeleton-card__title"></div>
    <div class="skeleton skeleton-card__sub"></div>
  `;
  return card;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// ============================================================
// CATEGORY SWITCHING
// ============================================================

function switchCategory(cat) {
  state.activeCategory = cat;

  // Update pills
  $$('.category-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.category === cat);
  });

  // Update hero zone
  updateHeroZone();

  // Update recommendation strip
  updateStrip();

  // Update matrix
  
}

// ============================================================
// HERO ZONE
// ============================================================

const EMPTY_STATE_COPY = {
  all: { headline: 'Your cinematic journey starts here', sub: 'Track your favorite titles, discover new ones, and never lose your spot again.', cta: 'Add Your First Title', icon: 'film' },
  anime: { headline: 'Start your anime adventure', sub: 'From shonen epics to slice-of-life gems — track every episode.', cta: 'Add Anime', icon: 'anime' },
  manhwa: { headline: 'Dive into manhwa', sub: 'Webtoons, manhwa, and beyond — track every chapter.', cta: 'Add Manhwa', icon: 'book' },
  series: { headline: 'Track your series', sub: 'Never forget where you left off on any show.', cta: 'Add a Series', icon: 'tv' },
  movies: { headline: 'Build your movie collection', sub: 'Log every film you watch and discover your taste.', cta: 'Add a Movie', icon: 'movie' },
};

const STRIP_SUBTITLES = {
  all: 'Based on your recent activity',
  anime: 'Because you\'re watching Jujutsu Kaisen',
  manhwa: 'Manhwa readers like you enjoyed',
  series: 'Series similar to your taste',
  movies: 'Movies similar to your taste',
};

function updateHeroZone() {
  try {
    const cat = state.activeCategory;
    const titles = getTitlesForCategory(cat);
    
    // Strict sanitation: only titles with non-empty title string
    const validTitles = titles.filter(t => t && typeof t.title === 'string' && t.title.trim() !== '');
    const planningTitles = validTitles.filter(t => t.status === 'planning');
    const inProgressTitles = validTitles.filter(t => t.status === 'in-progress');

    // Ensure we have a valid tab state based on available data
    if (state.heroStatusTab === 'in-progress' && inProgressTitles.length === 0 && planningTitles.length > 0) {
      state.heroStatusTab = 'planning';
    } else if (state.heroStatusTab === 'planning' && planningTitles.length === 0 && inProgressTitles.length > 0) {
      state.heroStatusTab = 'in-progress';
    }
    
    // Display list depends on the active tab
    const displayTitles = state.heroStatusTab === 'in-progress' ? inProgressTitles : planningTitles;

    if (state.justCompleted) {
      state.justCompleted = false;
    }

    if (validTitles.length === 0 || displayTitles.length === 0) {
      $('#heroPopulated').classList.add('hidden');
      $('#heroEmpty').classList.remove('hidden');
      const copy = EMPTY_STATE_COPY[cat] || EMPTY_STATE_COPY.all;
      if ($('#emptyHeadline')) $('#emptyHeadline').textContent = copy.headline;
      if ($('#emptySubtext')) $('#emptySubtext').textContent = copy.sub;
      
      const miniTabsEl = $('#heroMiniTabs');
      if (miniTabsEl) {
        miniTabsEl.style.display = 'none';
        miniTabsEl.innerHTML = '';
      }
      return;
    }

    // Pick the title to highlight (first of the active tab)
    const current = displayTitles[0];
    if (!current || !current.title || current.title.trim() === '') {
      $('#heroPopulated').classList.add('hidden');
      $('#heroEmpty').classList.remove('hidden');
      return;
    }

    $('#heroEmpty').classList.add('hidden');
    $('#heroPopulated').classList.remove('hidden');

  // --- Status label ---
  if (current.status === 'planning') {
    $('#heroLabel').textContent = isReading ? 'PLAN TO READ' : isMovie ? 'PLAN TO WATCH' : 'PLAN TO WATCH';
  } else {
    $('#heroLabel').textContent = isReading ? 'CONTINUE READING' : isMovie ? 'NOW WATCHING' : 'CONTINUE WATCHING';
  }
  $('#heroTitle').textContent = current.title;

  // --- Poster ---
  const posterContainer = $('.hero-card__poster');
  if (posterContainer) {
    const posterSrc = getPoster(current);
    const existingImg = posterContainer.querySelector('img');
    const existingSrc = existingImg ? existingImg.getAttribute('src') : null;
    
    // Only re-render if poster actually changed (prevents flicker)
    if (existingSrc !== posterSrc) {
      posterContainer.innerHTML = `
        ${posterSrc ? `<img src="${posterSrc}" alt="${current.title}" class="hero-card__img" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />` : ''}
        <div class="hero-card__poster-placeholder" style="${posterSrc ? 'display:none;' : 'display:flex;'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
            <line x1="7" y1="2" x2="7" y2="22"/>
            <line x1="17" y1="2" x2="17" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
        </div>
      `;
    }
  }

  // --- Meta line: correct per media type ---
  let metaText = '';
  if (isMovie) {
    const rt = current.runtime || 120;
    const hours = Math.floor(rt / 60);
    const mins = rt % 60;
    const runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    metaText = `Movie · ${current.genre || 'Action'} · ${runtimeStr}`;
  } else if (isReading) {
    const total = current.chapters || current.totalEpisodes || '?';
    metaText = `Manhwa · ${current.genre || 'Action'} · ${total === '?' ? '?' : total} chapters`;
  } else {
    const total = current.episodes || current.totalEpisodes || '?';
    metaText = `${current.category.charAt(0).toUpperCase() + current.category.slice(1)} · ${current.genre || 'Action'} · ${total === '?' ? '?' : total} episodes`;
  }
  $('#heroMeta').textContent = metaText;

  // --- Progress bar ---
  let pct = 0;
  let progressText = '';
  const currentProg = parseNum(current.progress, 0);
  if (isMovie) {
    pct = current.status === 'completed' ? 100 : (currentProg > 0 ? 50 : 0);
    progressText = current.status === 'completed' ? 'Watched ✓' : (current.status === 'in-progress' ? 'Currently watching' : 'Not started');
  } else if (isReading) {
    const total = parseNum(current.chapters || current.totalEpisodes, 0);
    pct = total > 0 ? Math.min(100, (currentProg / total) * 100) : (currentProg > 0 ? Math.min(95, currentProg * 8) : 0);
    progressText = total > 0 ? `Chapter ${currentProg} of ${total}` : `Chapter ${currentProg}`;
  } else {
    const total = parseNum(current.episodes || current.totalEpisodes, 0);
    pct = total > 0 ? Math.min(100, (currentProg / total) * 100) : (currentProg > 0 ? Math.min(95, currentProg * 8) : 0);
    progressText = total > 0 ? `Episode ${currentProg} of ${total}` : `Episode ${currentProg}`;
  }
  if (isNaN(pct)) pct = 0;
  
  const heroProgress = $('#heroProgress');
  const heroProgressText = $('#heroProgressText');
  if (heroProgress) {
    heroProgress.style.width = pct + '%';
    heroProgress.classList.remove('pulse');
    void heroProgress.offsetWidth; // Force reflow for CSS animation
    heroProgress.classList.add('pulse');
  } else {
    const progressContainer = $('.hero-card__progress');
    if (progressContainer) {
      progressContainer.innerHTML = `
        <div class="hero-card__progress-bar">
          <div class="hero-card__progress-fill pulse" id="heroProgress" style="width: ${pct}%"></div>
        </div>
        <span class="hero-card__progress-text" id="heroProgressText">${progressText}</span>
      `;
    }
  }
  if (heroProgressText) {
    heroProgressText.textContent = progressText;
  }

  // --- PLANNING / IN-PROGRESS mini-tabs just below title ---
  const miniTabsEl = $('#heroMiniTabs');
  if (miniTabsEl) {
    const allActive = [...inProgressTitles, ...planningTitles];
    if (allActive.length > 0) {
      miniTabsEl.style.display = 'block';
      const newIds = displayTitles.slice(0, 8).map(t => String(t.id)).join(',');
      const needsRebuild = miniTabsEl.dataset.renderedIds !== newIds || miniTabsEl.dataset.renderedTab !== state.heroStatusTab;
      
      if (needsRebuild) {
        const tabHeaderHtml = `
          <div style="display: flex; gap: 16px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
            <button class="hero-main-tab-btn ${state.heroStatusTab === 'in-progress' ? 'active' : ''}" data-tab="in-progress" style="background: none; border: none; color: ${state.heroStatusTab === 'in-progress' ? 'var(--text-primary)' : 'var(--text-muted)'}; font-weight: ${state.heroStatusTab === 'in-progress' ? '600' : '400'}; font-size: 14px; cursor: pointer; padding: 4px 8px; border-radius: 4px;">Progress (${inProgressTitles.length})</button>
            <button class="hero-main-tab-btn ${state.heroStatusTab === 'planning' ? 'active' : ''}" data-tab="planning" style="background: none; border: none; color: ${state.heroStatusTab === 'planning' ? 'var(--text-primary)' : 'var(--text-muted)'}; font-weight: ${state.heroStatusTab === 'planning' ? '600' : '400'}; font-size: 14px; cursor: pointer; padding: 4px 8px; border-radius: 4px;">Library (${planningTitles.length})</button>
          </div>
        `;

        const listHtml = displayTitles.slice(0, 8).map((t, i) => {
          const tTotal = Number(t.episodes || t.chapters || t.totalEpisodes || 0);
          const tProg = Number(t.progress || 0);
          const tPct = tTotal > 0 ? Math.min(100, (tProg / tTotal) * 100) : Math.min(95, tProg * 8);
          const isActive = t === current;
          const statusClass = t.status === 'planning' ? 'planning' : 'watching';
          const icon = t.status === 'planning' ? '📋' : '▶';
          const label = t.title.length > 16 ? t.title.slice(0, 15) + '…' : t.title;
          return `<div class="hero-mini-tab ${statusClass}${isActive ? ' active' : ''}" data-id="${t.id}" title="${t.title}">
            <span class="hero-mini-tab__badge">${icon}</span>
            <span class="hero-mini-tab__label">${label}</span>
            <div class="hero-mini-tab__bar"><div class="hero-mini-tab__bar-fill" style="width:${tPct}%"></div></div>
          </div>`;
        }).join('');

        miniTabsEl.innerHTML = tabHeaderHtml + `<div style="display:flex; gap:8px; overflow-x:auto;">${listHtml || '<div style="color:var(--text-muted);font-size:13px;padding:4px 8px;">No titles here.</div>'}</div>`;
        miniTabsEl.dataset.renderedIds = newIds;
        miniTabsEl.dataset.renderedTab = state.heroStatusTab;
        
        // Bind main tab clicks
        miniTabsEl.querySelectorAll('.hero-main-tab-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            state.heroStatusTab = btn.dataset.tab;
            const list = state.heroStatusTab === 'in-progress' ? inProgressTitles : planningTitles;
            if (list.length > 0) {
              const idx = state.titles.indexOf(list[0]);
              if (idx > 0) {
                const picked = state.titles.splice(idx, 1)[0];
                state.titles.unshift(picked);
              }
            }
            updateHeroZone();
          });
        });

        // Bind individual title clicks
        miniTabsEl.querySelectorAll('.hero-mini-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            const pickedId = tab.dataset.id;
            const idx = state.titles.findIndex(t => String(t.id) === String(pickedId));
            if (idx > 0) {
              const picked = state.titles.splice(idx, 1)[0];
              state.titles.unshift(picked);
              updateHeroZone();
            }
          });
        });
      } else {
        // Targeted update of existing persistent mini-tab elements so CSS width transitions work smoothly!
        miniTabsEl.querySelectorAll('.hero-mini-tab').forEach(tab => {
          const id = tab.dataset.id;
          const t = displayTitles.find(t => String(t.id) === id);
          if (t) {
            const tTotal = Number(t.episodes || t.chapters || t.totalEpisodes || 0);
            const tProg = Number(t.progress || 0);
            const tPct = tTotal > 0 ? Math.min(100, (tProg / tTotal) * 100) : Math.min(95, tProg * 8);
            const barFill = tab.querySelector('.hero-mini-tab__bar-fill');
            if (barFill) barFill.style.width = tPct + '%';
            if (t === current) tab.classList.add('active');
            else tab.classList.remove('active');
          }
        });
        const progBtn = miniTabsEl.querySelector('[data-tab="in-progress"]');
        if (progBtn) progBtn.innerHTML = `Progress (${inProgressTitles.length})`;
        const planBtn = miniTabsEl.querySelector('[data-tab="planning"]');
        if (planBtn) planBtn.innerHTML = `Library (${planningTitles.length})`;
      }
    } else {
      miniTabsEl.style.display = 'none';
      miniTabsEl.innerHTML = '';
      delete miniTabsEl.dataset.renderedIds;
      delete miniTabsEl.dataset.renderedTab;
    }
  }

  // --- Action buttons ---
  const playBtn = $('#heroPlayBtn');
  if (playBtn) {
    if (current.status === 'planning') {
      playBtn.innerHTML = isReading
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 1 3-3h7z"/></svg> Start Reading`
        : `<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px"><polygon points="5 3 19 12 5 21 5 3"/></svg> ${isMovie ? 'Mark Watching' : 'Start Watching'}`;
      playBtn.onclick = () => {
        current.status = 'in-progress';
        if (!current.progress || current.progress === 0) current.progress = isMovie ? 0 : 1;
        state.heroStatusTab = 'in-progress'; // Force tab switch to progress
        
        // Bump to front so it stays focused on the hero card
        const idx = state.titles.indexOf(current);
        if (idx > 0) {
          state.titles.splice(idx, 1);
          state.titles.unshift(current);
        }
        
        saveLocalWatchlist();
        showUndoToast(`🎬 Started "${current.title}"!`);
        setTimeout(() => {
          updateHeroZone(); 
          updateStrip();
          if (state.profileOpen) { renderProfileStats(); renderProfileTab(state.profileTab); }
        }, 50);
        if (state.user && current.id) setDoc(doc(db, 'users', state.user.uid, 'watchlist', String(current.id)), current, { merge: true }).catch(console.error);
      };
    } else if (isMovie) {
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px"><polygon points="5 3 19 12 5 21 5 3"/></svg> Watch Now`;
      playBtn.onclick = () => openPlayer(current);
    } else {
      const unitWord = isReading ? 'Ch' : 'Ep';
      const nextNum = (current.progress || 0) + 1;
      const totalU = current.episodes || current.chapters || 0;
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px"><polygon points="5 3 19 12 5 21 5 3"/></svg> +1 ${unitWord} <span style="opacity:0.7;font-size:13px">(${unitWord} ${nextNum}${totalU > 0 ? '/' + totalU : ''})</span>`;
      playBtn.onclick = () => updateTitleProgress(current, 1);
    }
  }

  const markBtn = $('#heroMarkBtn');
  if (markBtn) {
    if (current.status === 'planning') {
      markBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg> Mark Started`;
      markBtn.onclick = () => {
        current.status = 'in-progress';
        current.progress = isMovie ? 0 : 1;
        state.heroStatusTab = 'in-progress'; // Force tab switch to progress
        
        // Bump to front so it stays focused on the hero card
        const idx = state.titles.indexOf(current);
        if (idx > 0) {
          state.titles.splice(idx, 1);
          state.titles.unshift(current);
        }
        
        saveLocalWatchlist();
        showUndoToast(`Started "${current.title}"!`);
        updateHeroZone();
        if (state.profileOpen) { renderProfileStats(); renderProfileTab(state.profileTab); }
        if (state.user && current.id) setDoc(doc(db, 'users', state.user.uid, 'watchlist', String(current.id)), current, { merge: true }).catch(console.error);
      };
    } else {
      markBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg> Mark Complete`;
      markBtn.onclick = () => updateTitleProgress(current, isMovie ? 1 : 1, 'completed');
    }
  }

  // --- Stats ---
  updateHeroStats(cat);
  } catch(e) {
    showUndoToast("Error in updateHeroZone: " + e.message);
    console.error("HeroZone Error:", e);
  }
}


function updateHeroStats(cat) {
  const titles = getTitlesForCategory(cat);
  const completed = titles.filter(t => t.status === 'completed');
  
  // Video titles (anime, series, movies)
  const videoTitles = titles.filter(t => t.category !== 'manhwa');
  const totalWatchHours = videoTitles.reduce((sum, t) => {
    const unitHours = t.category === 'movies' ? ((t.runtime || 120) / 60) : 0.4;
    const calcHours = (t.progress || 0) * unitHours;
    return sum + (t.totalHours && t.totalHours > calcHours ? t.totalHours : calcHours);
  }, 0);

  // Manhwa / Manga titles
  const manhwaTitles = titles.filter(t => t.category === 'manhwa');
  const totalChapters = manhwaTitles.reduce((sum, t) => sum + (t.progress || 0), 0);

  const watchTimeEl = $('#statWatchTime');
  if (watchTimeEl) watchTimeEl.textContent = (Math.round(totalWatchHours * 10) / 10).toLocaleString() + 'h';

  const chaptersEl = $('#statChaptersRead');
  if (chaptersEl) chaptersEl.textContent = totalChapters.toLocaleString();

  const completedEl = $('#statCompleted');
  if (completedEl) completedEl.textContent = completed.length.toString();
}

// ============================================================
// RECOMMENDATION STRIP
// ============================================================

function updateStrip() {
  const cat = state.activeCategory;
  const discover = getDiscoverForCategory(cat);
  const stripScroll = $('#stripScroll');

  // Update subtitle
  $('#stripSubtitle').textContent = STRIP_SUBTITLES[cat] || STRIP_SUBTITLES.all;

  // Clear and re-populate
  stripScroll.innerHTML = '';
  discover.forEach(item => {
    stripScroll.appendChild(createContentCard(item, true));
  });
}

// ============================================================
// SEARCH TAKEOVER (Strip transforms into search results)
// ============================================================

async function activateSearchTakeover(query, categoryFilter = 'all') {
  const resultsContainer = $('#matrixSearchResults');
  
  const navInput = $('#navSearchInput');
  const matrixInput = $('#matrixSearchInput');
  if (navInput && document.activeElement !== navInput && navInput.value !== query) navInput.value = query;
  if (matrixInput && document.activeElement !== matrixInput && matrixInput.value !== query) matrixInput.value = query;

  if (!query.trim()) {
    deactivateSearchTakeover();
    return;
  }

  state.searchQuery = query;
  scrollToMatrix();

  if (!resultsContainer) return;

  $('#matrixSections').classList.add('hidden');
  $('#matrixGrid').classList.add('hidden');
  resultsContainer.classList.remove('hidden');
  
  // Start with loading skeleton
  resultsContainer.innerHTML = '<div id="searchSpinner" style="grid-column: 1/-1; padding:40px; color:var(--text-muted); font-size:16px; text-align:center;">Intercepting broadcasts across all multiverses...</div>';

  let resultCount = 0;

  // Stream live results dynamically as they arrive
  searchAllStreaming(query, categoryFilter, (item) => {
    if (state.searchQuery !== query) return; // Ignore if user typed something else
    
    // Remove spinner on first result
    const spinner = document.getElementById('searchSpinner');
    if (spinner) spinner.remove();

    resultsContainer.appendChild(createContentCard(item, true));
    resultCount++;
  }).then(() => {
    if (state.searchQuery !== query) return;
    const spinner = document.getElementById('searchSpinner');
    if (spinner) spinner.remove();
    
    if (resultCount === 0) {
      resultsContainer.innerHTML = '<div style="grid-column: 1/-1; padding:40px; color:var(--text-muted); font-size:16px; text-align:center;">No multiversal matches found.</div>';
    }
  }).catch(() => {
    // If the stream fails entirely, just clear spinner
    const spinner = document.getElementById('searchSpinner');
    if (spinner) spinner.remove();
    if (resultCount === 0) {
      resultsContainer.innerHTML = '<div style="grid-column: 1/-1; padding:40px; color:var(--text-muted); font-size:16px; text-align:center;">Error intercepting broadcasts. Try again.</div>';
    }
  });
}

// ============================================================
// SEARCH DEACTIVATION
// ============================================================
function deactivateSearchTakeover() {
  state.searchQuery = '';
  const resultsContainer = $('#matrixSearchResults');
  if (resultsContainer) {
    resultsContainer.classList.add('hidden');
    resultsContainer.innerHTML = '';
  }
  $('#matrixSections').classList.remove('hidden');
  $('#matrixGrid').classList.remove('hidden');
  const navInput = $('#navSearchInput');
  const matrixInput = $('#matrixSearchInput');
  if (navInput) navInput.value = '';
  if (matrixInput) matrixInput.value = '';
}

// ============================================================
// STREAK DISPLAY & REAL DYNAMIC CALCULATION
// ============================================================
function checkAndUpdateStreak() {
  try {
    const sdata = JSON.parse(localStorage.getItem('cinepulse_streak') || '{}');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastActive = sdata.lastActiveDate || null;
    let streak = sdata.streak || 0;

    if (!lastActive) {
      streak = 1;
      sdata.lastActiveDate = today;
      sdata.streak = 1;
    } else if (lastActive === today) {
      if (streak === 0) streak = 1;
    } else {
      const lastDate = new Date(lastActive);
      const currentDate = new Date(today);
      const diffDays = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 1;
      }
      sdata.lastActiveDate = today;
      sdata.streak = streak;
    }

    localStorage.setItem('cinepulse_streak', JSON.stringify(sdata));
    state.streak = streak;
    return streak;
  } catch (e) {
    console.error('Streak calculation error:', e);
    return 1;
  }
}

function updateStreakDisplay() {
  const sdata = JSON.parse(localStorage.getItem('cinepulse_streak') || '{}');
  const streak = sdata.streak || 1;
  const streakEls = document.querySelectorAll('.streak-count, #streakBadge, .hero-streak-count');
  streakEls.forEach(el => { el.textContent = streak; });
}

// ============================================================
// INFO MODAL (card click → detail view)
// ============================================================
async function openInfoModal(item) {
  const modal = $('#infoModal');
  if (!modal) return;

  const img = modal.querySelector('.info-modal__poster');
  const title = modal.querySelector('.info-modal__title');
  const meta = modal.querySelector('.info-modal__meta');
  const desc = modal.querySelector('.info-modal__desc');
  const hero = modal.querySelector('#infoModalHero');

  // Backdrop / Title picture behind description
  const backdropUrl = item.backdrop || item.poster || (typeof getPoster === 'function' ? getPoster(item) : '');
  if (hero) {
    if (backdropUrl) {
      hero.style.background = `linear-gradient(180deg, rgba(15, 18, 28, 0.75) 0%, rgba(15, 18, 28, 0.95) 100%), url('${backdropUrl}') center/cover no-repeat`;
    } else {
      hero.style.background = `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)`;
    }
  }

  if (img) {
    img.src = item.poster || backdropUrl || '';
    img.style.display = 'block';
  }
  if (title) title.textContent = item.title || '';

  let epsText = '';
  if (item.totalEpisodes && item.totalEpisodes !== '?') epsText = ` · Ep: ${item.totalEpisodes}`;
  else if (item.episodes) epsText = ` · Ep: ${item.episodes}`;
  else if (item.chapters) epsText = ` · Ch: ${item.chapters}`;

  if (meta) meta.textContent = [item.category, item.genre, item.rating ? '★ ' + item.rating : ''].filter(Boolean).join(' · ') + epsText;
  if (desc) desc.textContent = item.description || item.reason || item.overview || 'No synopsis available for this title.';

  // Watch button
  const watchBtn = modal.querySelector('#infoModalWatchBtn');
  if (watchBtn) {
    watchBtn.onclick = () => { closeInfoModal(); window.openPlayer(item); };
  }

  // Add to list button
  const addBtn = modal.querySelector('#infoModalAddBtn');
  if (addBtn) {
    const alreadyExists = (state.titles || []).some(t => t.title === item.title || t.id === item.id);
    if (alreadyExists) {
      addBtn.textContent = '✓ In Library';
      addBtn.disabled = true;
      addBtn.style.opacity = '0.6';
    } else {
      addBtn.onclick = () => {
        if (!state.titles) state.titles = [];
        const newEntry = { 
          ...item, 
          id: item.id || `custom_${Date.now()}`,
          status: 'planning', 
          progress: 0, 
          poster: item.poster || getPoster(item),
          addedAt: new Date().toISOString() 
        };
        state.titles.unshift(newEntry);
        saveLocalWatchlist();
        showUndoToast(`✅ Added "${item.title}" to Planning!\nOpen Profile → Progress to start.`);
        updateHeroZone();
        updateStrip();
        if (state.user) {
          const docRef = doc(db, 'users', state.user.uid, 'watchlist', String(newEntry.id));
          setDoc(docRef, newEntry).catch(console.error);
        }
        closeInfoModal();
      };
    }
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Fetch cast asynchronously with fallbacks across Jikan, TMDB, and TVMaze
  const castContainer = modal.querySelector('#infoModalCast');
  if (castContainer) {
    castContainer.innerHTML = '<div class="info-modal__loading">Loading live cast details...</div>';
    
    try {
      let cast = [];
      const cat = (item.category || '').toLowerCase();
      const rawId = String(item.id || item.mal_id || '');

      // 1. If Anime with MAL ID
      if (cat === 'anime' && (rawId.startsWith('mal_') || item.mal_id)) {
        const malId = rawId.replace('mal_', '') || item.mal_id;
        cast = await fetchJikanCharacters(malId);
      }

      // 2. Try TMDB resolution for any category (Movies, Series, Kdrama, BL, GL, Thai, Anime)
      if (!cast || cast.length === 0) {
        let tmdbId = await resolveTMDBId(item);
        if (tmdbId) {
          cast = await fetchTMDBCast(tmdbId, item.category, item.title);
        }
      }

      // 3. TVMaze title fallback for non-movies
      if ((!cast || cast.length === 0) && item.title) {
        try {
          const searchRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(item.title)}`, { signal: AbortSignal.timeout(5000) });
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData && searchData.length > 0) {
              cast = await fetchTVMazeCast(searchData[0].show.id);
            }
          }
        } catch (e) {
          console.warn('TVMaze cast fallback failed:', e);
        }
      }

      if (!cast || cast.length === 0) {
        castContainer.innerHTML = '<div class="info-modal__loading" style="color:var(--text-muted); font-size:13px;">No cast details available for this title.</div>';
      } else {
        castContainer.innerHTML = cast.slice(0, 10).map(c => `
          <div class="cast-card">
            <img src="${c.image || 'https://placehold.co/100x100/1a1a2e/ffffff?text=' + encodeURIComponent(c.name.charAt(0))}" alt="${c.name}" onerror="this.src='https://placehold.co/100x100/1a1a2e/ffffff?text=?'">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; line-height: 1.2;">${c.name}</div>
            <div style="font-size: 10px; color: var(--text-muted);">${c.role || 'Actor'}</div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading cast:', err);
      castContainer.innerHTML = '<div class="info-modal__loading" style="color:var(--text-muted); font-size:13px;">Unable to load live cast.</div>';
    }
  }
}

function closeInfoModal() {
  const modal = $('#infoModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
// INSIGHTS HUB PANEL
// ============================================================
window._insightsExpandCategory = function(catKey) {
  const container = document.getElementById('ihCategoryDetails');
  if (!container) return;

  const titles = state.titles || [];
  const filtered = catKey === 'all' 
    ? titles 
    : titles.filter(t => t.category === catKey || (catKey === 'series' && ['kdrama','bl','gl','thai','series','tv'].includes(t.category)));

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:14px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid var(--border-subtle); color:var(--text-muted); font-size:12px; text-align:center;">No titles found in ${catKey === 'all' ? 'All Categories' : catKey}.</div>`;
    return;
  }

  const catName = catKey === 'all' ? 'All Categories' : catKey.charAt(0).toUpperCase() + catKey.slice(1);

  container.innerHTML = `
    <div style="background:rgba(255,255,255,0.03); border-radius:14px; border:1px solid var(--border-subtle); padding:14px; margin-top:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h4 style="font-size:14px; font-weight:700; color:var(--cyan); margin:0;">${catName} (${filtered.length} titles)</h4>
        <button onclick="document.getElementById('ihCategoryDetails').innerHTML=''" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px;">✕ Close</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; max-height:260px; overflow-y:auto; padding-right:4px;">
        ${filtered.map(t => {
          const total = t.episodes || t.chapters || t.totalEpisodes || 0;
          const isDone = t.status === 'completed';
          return `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; background:rgba(255,255,255,0.02); border-radius:8px; font-size:12px;">
              <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                <img src="${getPoster(t)}" style="width:24px; height:34px; object-fit:cover; border-radius:4px;" onerror="this.style.display='none'">
                <div style="min-width:0; flex:1;">
                  <div style="font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.title}</div>
                  <div style="font-size:10px; color:var(--text-muted);">${t.category} · ${t.progress || 0}${total > 0 ? '/' + total : ''} ${t.category==='manhwa'?'ch':'ep'} ${isDone ? '· ✅ Done' : ''}</div>
                </div>
              </div>
              <div style="display:flex; gap:4px; align-items:center; margin-left:8px;">
                <button onclick="event.stopPropagation(); window.decrementTitleProgress('${t.id}')" style="background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:4px; padding:2px 6px; font-size:10px; cursor:pointer;" title="Remove 1 Ep">-1</button>
                <button onclick="event.stopPropagation(); window.removeTitle('${t.id}')" style="background:rgba(255,75,75,0.2); border:none; color:#ff4b4b; border-radius:4px; padding:2px 6px; font-size:10px; cursor:pointer;" title="Delete Title">🗑️</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

window._insightsExpandGenre = function(genreName) {
  const container = document.getElementById('ihGenreDetails');
  if (!container) return;
  const titles = state.titles || [];
  const filtered = titles.filter(t => (t.genre || '').toLowerCase().includes(genreName.toLowerCase()));
  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:12px; background:rgba(255,255,255,0.03); border-radius:12px; color:var(--text-muted); font-size:12px; text-align:center;">No titles found for genre ${genreName}.</div>`;
    return;
  }
  container.innerHTML = `
    <div style="background:rgba(255,255,255,0.03); border-radius:14px; border:1px solid var(--border-subtle); padding:14px; margin-top:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h4 style="font-size:14px; font-weight:700; color:#FF8C42; margin:0;">Genre: ${genreName} (${filtered.length})</h4>
        <button onclick="document.getElementById('ihGenreDetails').innerHTML=''" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px;">✕ Close</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;">
        ${filtered.map(t => `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:rgba(255,255,255,0.02); border-radius:8px; font-size:12px;">
            <div style="font-weight:600; color:var(--text-primary); truncate;">${t.title}</div>
            <div style="font-size:10px; color:var(--text-muted);">${t.category} · ${t.progress||0} ${t.category==='manhwa'?'ch':'ep'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

function openInsights() {
  state.insightsOpen = true;
  $('#insightsBackdrop').classList.add('open');
  $('#insightsPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderInsightsTab(state.insightsTab || 'overview');
}

function closeInsights() {
  state.insightsOpen = false;
  const bd = $('#insightsBackdrop');
  const panel = $('#insightsPanel');
  if (bd) bd.classList.remove('open');
  if (panel) panel.classList.remove('open');
  document.body.style.overflow = '';
}

function switchInsightsTab(tab) {
  state.insightsTab = tab;
  document.querySelectorAll('.insights-tab, .insights-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  renderInsightsTab(tab);
  // Re-attach listeners after re-render
  setTimeout(attachInsightsListeners, 0);
}

function renderInsightsTab(tab) {
  const content = $('#insightsContent') || $('#profileContent');
  if (!content) return;
  switch (tab) {
    case 'overview':     content.innerHTML = renderOverviewTab();     break;
    case 'analytics':    content.innerHTML = renderAnalyticsTab();    break;
    case 'achievements': content.innerHTML = renderAchievementsTab(); break;
    case 'oracle':       content.innerHTML = renderOracleTab();       break;
    default:             content.innerHTML = renderOverviewTab();
  }
  attachInsightsListeners();
}

function renderOverviewTab() {
  const titles = state.titles || [];
  const watching = titles.filter(t => t.status === 'in-progress');
  const completed = titles.filter(t => t.status === 'completed');
  const planning = titles.filter(t => t.status === 'planning');
  const compRate = titles.length > 0 ? Math.round((completed.length / titles.length) * 100) : 0;

  // Watch time calc
  const watchHours = titles.filter(t => t.category !== 'manhwa').reduce((s, t) => {
    const h = t.category === 'movies' ? ((t.runtime || 120) / 60) : 0.4;
    return s + (t.progress || 0) * h;
  }, 0);
  const chaptersRead = titles.filter(t => t.category === 'manhwa').reduce((s, t) => s + (t.progress || 0), 0);
  const streak = (() => { try { return JSON.parse(localStorage.getItem('cinepulse_streak') || '{}').streak || 0; } catch(e) { return 0; } })();

  // Genre frequency
  const genreCounts = {};
  titles.forEach(t => { if (t.status === 'completed' && t.genre) genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1; });
  const topGenres = Object.entries(genreCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const maxGenreCount = topGenres[0]?.[1] || 1;

  // Category distribution for donut
  const catCounts = { anime: 0, series: 0, movies: 0, manhwa: 0 };
  titles.forEach(t => { if (catCounts[t.category] !== undefined) catCounts[t.category]++; });
  const catColors = { anime: '#FF4B4B', series: '#F59E0B', movies: '#22E5D0', manhwa: '#9B5CFF' };
  const catIcons = { anime: '🎌', series: '📺', movies: '🎬', manhwa: '📖' };
  const total = titles.length || 1;

  return `
    <div class="ih-overview">
      <!-- Big Stats Row -->
      <div class="ih-stats-row">
        <div class="ih-stat" style="--clr:#FF4B4B">
          <div class="ih-stat__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg></div>
          <div class="ih-stat__num" data-count="${watching.length}">${watching.length}</div>
          <div class="ih-stat__lbl">Watching</div>
        </div>
        <div class="ih-stat" style="--clr:#10B981">
          <div class="ih-stat__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div class="ih-stat__num" data-count="${completed.length}">${completed.length}</div>
          <div class="ih-stat__lbl">Completed</div>
        </div>
        <div class="ih-stat" style="--clr:#F59E0B">
          <div class="ih-stat__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></div>
          <div class="ih-stat__num" data-count="${planning.length}">${planning.length}</div>
          <div class="ih-stat__lbl">Planning</div>
        </div>
        <div class="ih-stat" style="--clr:#FF6B35">
          <div class="ih-stat__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/></svg></div>
          <div class="ih-stat__num">${streak}</div>
          <div class="ih-stat__lbl">Day Streak</div>
        </div>
      </div>

      <!-- Watch Time + Chapters hero cards -->
      <div class="ih-hero-metrics">
        <div class="ih-metric-card" style="--grad: linear-gradient(135deg,#FF4B4B22,#FF4B4B08)">
          <div class="ih-metric-card__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="ih-metric-card__val">${watchHours >= 1000 ? (watchHours/1000).toFixed(1)+'k' : watchHours.toFixed(0)}h</div>
          <div class="ih-metric-card__sub">Total Watch Time</div>
          <div class="ih-metric-card__bar"><div style="width:${Math.min(100, (watchHours/500)*100)}%;background:linear-gradient(90deg,#FF4B4B,#FF8C42);"></div></div>
        </div>
        <div class="ih-metric-card" style="--grad: linear-gradient(135deg,#9B5CFF22,#9B5CFF08)">
          <div class="ih-metric-card__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B5CFF" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
          <div class="ih-metric-card__val">${chaptersRead.toLocaleString()}</div>
          <div class="ih-metric-card__sub">Chapters Read</div>
          <div class="ih-metric-card__bar"><div style="width:${Math.min(100,(chaptersRead/1000)*100)}%;background:linear-gradient(90deg,#9B5CFF,#C084FC);"></div></div>
        </div>
      </div>

      <!-- Interactive Category Analytics Cards -->
      <div class="ih-section-title">Category Analytics (Click to View Titles)</div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:10px; margin-bottom:12px;">
        ${[
          { key:'anime', icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`, name:'Anime', clr:'#FF4B4B' },
          { key:'manhwa', icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B5CFF" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`, name:'Manhwa', clr:'#9B5CFF' },
          { key:'series', icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`, name:'Series', clr:'#F59E0B' },
          { key:'movies', icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22E5D0" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v16M18 4v16M2 8h20M2 16h20"/></svg>`, name:'Movies', clr:'#22E5D0' }
        ].map(cat => {
          const catTitles = titles.filter(t => t.category === cat.key || (cat.key === 'series' && ['kdrama','bl','gl','thai','series','tv'].includes(t.category)));
          const catDone = catTitles.filter(t => t.status === 'completed').length;
          const watchedUnits = catTitles.reduce((s,t) => s + (t.progress||0), 0);
          const hrs = cat.key === 'manhwa' ? 0 : (cat.key === 'movies' ? watchedUnits * 2 : (cat.key === 'series' ? watchedUnits * 0.7 : watchedUnits * 0.4));
          const subText = cat.key === 'manhwa' ? `${watchedUnits} ch read` : `${hrs.toFixed(0)}h watched`;
          
          return `
            <div class="ih-stat" style="--clr:${cat.clr}; cursor:pointer; padding:12px; display:flex; flex-direction:column; align-items:flex-start;" onclick="window._insightsExpandCategory('${cat.key}')">
              <div style="display:flex; justify-content:space-between; width:100%; align-items:center; margin-bottom:4px;">
                <span>${cat.icon}</span>
                <span style="font-size:10px; font-weight:700; color:var(--text-muted); background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:10px;">${catDone}/${catTitles.length} Done</span>
              </div>
              <div style="font-size:14px; font-weight:800; color:var(--text-primary); margin-top:2px;">${cat.name}</div>
              <div style="font-size:10px; color:${cat.clr}; font-weight:700; margin-top:4px;">${subText}</div>
            </div>
          `;
        }).join('')}
        
        <!-- Summary All Card -->
        <div class="ih-stat" style="--clr:#10B981; cursor:pointer; padding:12px; grid-column: 1 / -1; display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, rgba(16,185,129,0.12), rgba(34,229,208,0.05)); border:1px solid rgba(16,185,129,0.3);" onclick="window._insightsExpandCategory('all')">
          <div style="display:flex; align-items:center; gap:10px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            <div>
              <div style="font-size:14px; font-weight:800; color:#10B981;">All Categories Summary</div>
              <div style="font-size:11px; color:var(--text-muted);">${titles.length} Titles · ${completed.length} Completed (${compRate}% Rate)</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px; font-weight:800; color:var(--text-primary);">${watchHours.toFixed(0)}h</div>
            <div style="font-size:10px; color:var(--text-muted);">${chaptersRead} ch · ${titles.filter(t=>t.category!=='manhwa').reduce((s,t)=>s+(t.progress||0),0)} ep</div>
          </div>
        </div>
      </div>
      <div id="ihCategoryDetails" style="margin-bottom:16px;"></div>

      <!-- Top Genres -->
      ${topGenres.length > 0 ? `
        <div class="ih-section-title">Top Genres</div>
        <div class="ih-genres">
          ${topGenres.map(([genre, count], i) => {
            const pct = Math.round((count / maxGenreCount) * 100);
            const hue = [0, 27, 200, 270, 150][i];
            return `
              <div class="ih-genre-pill" style="--h:${hue}; cursor:pointer;" onclick="window._insightsExpandGenre('${genre}')">
                <span>${genre}</span>
                <div class="ih-genre-pill__bar"><div style="width:${pct}%"></div></div>
                <span class="ih-genre-pill__count">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div id="ihGenreDetails" style="margin-top:16px;"></div>
      ` : ''}

      <!-- Currently In Progress -->
      ${watching.length > 0 ? `
        <div class="ih-section-title">Continue Watching</div>
        <div class="ih-progress-list">
          ${watching.slice(0,4).map(t => {
            const total = t.episodes || t.chapters || t.totalEpisodes || 0;
            const pct = total > 0 ? Math.min(100, Math.round(((t.progress||0)/total)*100)) : 0;
            const isReading = t.category === 'manhwa';
            const unitWord = isReading ? 'Ch' : (t.category === 'movies' ? 'Movie' : 'Ep');
            return `
              <div class="ih-progress-item" onclick="window._insightsPickTitle && window._insightsPickTitle('${t.id}')">
                <img src="${getPoster(t)}" class="ih-progress-item__poster" onerror="this.style.display='none'">
                <div class="ih-progress-item__info">
                  <div class="ih-progress-item__title">${t.title}</div>
                  <div class="ih-progress-item__meta">${t.category.charAt(0).toUpperCase()+t.category.slice(1)} · ${unitWord} ${t.progress||0}${total>0?' / '+total:''}</div>
                  <div class="ih-progress-item__track">
                    <div class="ih-progress-item__fill" style="width:${pct}%"></div>
                  </div>
                </div>
                <div class="ih-progress-item__pct" style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                  <span>${pct}%</span>
                  <div style="display:flex; gap:4px; margin-top:4px;">
                    <button onclick="event.stopPropagation(); window.decrementTitleProgress('${t.id}')" style="background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:4px; padding:2px 6px; font-size:10px; cursor:pointer;" title="Remove 1 Episode">-1</button>
                    <button onclick="event.stopPropagation(); window.removeTitle('${t.id}')" style="background:rgba(255,75,75,0.2); border:none; color:#ff4b4b; border-radius:4px; padding:2px 6px; font-size:10px; cursor:pointer;" title="Delete Title">🗑️</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<div class="ih-empty">Nothing in progress yet — start watching!</div>'}
    </div>
  `;
}

function renderAnalyticsTab() {
  const titles = state.titles || [];
  const completed = titles.filter(t => t.status === 'completed');
  const inProgress = titles.filter(t => t.status === 'in-progress');

  // Watch time calc per category
  const catStats = {};
  ['anime','series','movies','manhwa'].forEach(c => {
    const catTitles = titles.filter(t => t.category === c);
    const watchedUnits = catTitles.reduce((s, t) => s + (t.progress || 0), 0);
    const completedCount = catTitles.filter(t => t.status === 'completed').length;
    catStats[c] = { count: catTitles.length, watchedUnits, completedCount };
  });

  const totalWatchH = ['anime','series'].reduce((s, c) => s + catStats[c].watchedUnits * 0.4, 0)
    + catStats.movies.watchedUnits * 2;
  const totalEps = catStats.anime.watchedUnits + catStats.series.watchedUnits;
  const totalCh = catStats.manhwa.watchedUnits;

  // Completion rate
  const compRate = titles.length > 0 ? Math.round((completed.length / titles.length) * 100) : 0;

  // Monthly activity (fake but representative based on actual count)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
  const baseActivity = Math.max(1, Math.floor(titles.length / 8));
  const activity = months.map((m, i) => ({ m, v: baseActivity + Math.round(Math.sin(i) * baseActivity * 0.5 + Math.random() * baseActivity * 0.3) }));
  const maxActivity = Math.max(...activity.map(a => a.v), 1);

  return `
    <div class="ih-analytics">
      <!-- Key metrics row -->
      <div class="ih-kpi-row">
        <div class="ih-kpi">
          <div class="ih-kpi__val">${totalWatchH.toFixed(0)}h</div>
          <div class="ih-kpi__lbl">Watch Time</div>
        </div>
        <div class="ih-kpi">
          <div class="ih-kpi__val">${totalEps}</div>
          <div class="ih-kpi__lbl">Episodes</div>
        </div>
        <div class="ih-kpi">
          <div class="ih-kpi__val">${totalCh}</div>
          <div class="ih-kpi__lbl">Chapters</div>
        </div>
        <div class="ih-kpi">
          <div class="ih-kpi__val">${compRate}%</div>
          <div class="ih-kpi__lbl">Finish Rate</div>
        </div>
      </div>

      <!-- Activity Chart -->
      <div class="ih-section-title">Activity Timeline</div>
      <div class="ih-bar-chart">
        ${activity.map(a => `
          <div class="ih-bar-chart__col">
            <div class="ih-bar-chart__bar" style="height:${Math.max(4, Math.round((a.v/maxActivity)*80))}px"
              title="~${a.v} titles this period"></div>
            <div class="ih-bar-chart__lbl">${a.m}</div>
          </div>
        `).join('')}
      </div>

      <!-- Category breakdown table -->
      <div class="ih-section-title">By Category</div>
      <div class="ih-cat-table">
        <div class="ih-cat-table__head">
          <span>Category</span><span>Titles</span><span>Watched</span><span>Done</span>
        </div>
        ${Object.entries(catStats).map(([cat, s]) => {
          const catSvg = {
            anime: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
            series: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
            movies: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22E5D0" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v16M18 4v16M2 8h20M2 16h20"/></svg>`,
            manhwa: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9B5CFF" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
          }[cat] || '';
          return `
            <div class="ih-cat-table__row">
              <span>${catSvg}${cat.charAt(0).toUpperCase()+cat.slice(1)}</span>
              <span>${s.count}</span>
              <span>${s.watchedUnits} ${cat==='manhwa'?'ch':'ep'}</span>
              <span style="color:#10b981">${s.completedCount}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Completion funnel -->
      <div class="ih-section-title">Your Journey</div>
      <div class="ih-funnel">
        <div class="ih-funnel__step" style="--w:100%;--clr:#FF4B4B">
          <span>Added</span><span>${titles.length}</span>
        </div>
        <div class="ih-funnel__step" style="--w:${titles.length > 0 ? Math.round(((inProgress.length+completed.length)/titles.length)*100) : 0}%;--clr:#F59E0B">
          <span>Started</span><span>${inProgress.length + completed.length}</span>
        </div>
        <div class="ih-funnel__step" style="--w:${compRate}%;--clr:#10b981">
          <span>Completed</span><span>${completed.length}</span>
        </div>
      </div>
    </div>
  `;
}

function renderAchievementsTab() {
  const titles = state.titles || [];
  const completed = titles.filter(t => t.status === 'completed');
  const categories = new Set(titles.map(t => t.category));
  const streak = checkAndUpdateStreak();
  const totalEps = titles.filter(t => t.category !== 'manhwa').reduce((s,t) => s + (t.progress||0), 0);
  const totalCh = titles.filter(t => t.category === 'manhwa').reduce((s,t) => s + (t.progress||0), 0);

  const ACHIEVEMENTS_DEF = [
    { id:'first_add', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`, label:'First Steps', desc:'Add your first title', clr:'#F59E0B', condition: () => titles.length >= 1 },
    { id:'first_done', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`, label:'Finisher', desc:'Complete your first title', clr:'#10B981', condition: () => completed.length >= 1 },
    { id:'binge_5', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22E5D0" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`, label:'Binge Mode', desc:'Add 5 or more titles', clr:'#22E5D0', condition: () => titles.length >= 5 },
    { id:'complete_10', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`, label:'Champion', desc:'Complete 10 titles', clr:'#FF4B4B', condition: () => completed.length >= 10 },
    { id:'ep_100', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B5CFF" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v16M18 4v16M2 8h20M2 16h20"/></svg>`, label:'100 Club', desc:'Watch 100+ episodes', clr:'#9B5CFF', condition: () => totalEps >= 100 },
    { id:'ep_1000', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`, label:'Episode God', desc:'Watch 1000+ episodes', clr:'#FF6B35', condition: () => totalEps >= 1000 },
    { id:'ch_100', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C084FC" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`, label:'Page Turner', desc:'Read 100+ chapters', clr:'#C084FC', condition: () => totalCh >= 100 },
    { id:'all_cats', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06D6A0" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`, label:'All-Rounder', desc:'Explore all 4 categories', clr:'#06D6A0', condition: () => categories.size >= 4 },
    { id:'streak7', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/></svg>`, label:'Week Warrior', desc:'7-day activity streak', clr:'#FF4B4B', condition: () => streak >= 7 },
    { id:'streak30', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`, label:'Monthly Devotion', desc:'30-day streak', clr:'#F59E0B', condition: () => streak >= 30 },
    { id:'night_owl', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`, label:'Night Owl', desc:'Watched something after midnight', clr:'#4F46E5', condition: () => false },
    { id:'completionist', icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`, label:'Perfectionist', desc:'100% complete all added titles', clr:'#10B981', condition: () => titles.length > 0 && titles.every(t => t.status === 'completed') },
  ];

  const unlocked = ACHIEVEMENTS_DEF.filter(a => a.condition());

  return `
    <div class="ih-achievements">
      <div class="ih-section-title" style="display:flex;align-items:center;gap:8px">
        <span>Unlocked</span>
        <span class="ih-badge">${unlocked.length}/${ACHIEVEMENTS_DEF.length}</span>
      </div>
      <div class="ih-ach-grid">
        ${ACHIEVEMENTS_DEF.map(a => {
          const done = a.condition();
          return `
            <div class="ih-ach-card ${done ? 'unlocked' : 'locked'}" style="--clr:${a.clr}">
              <div class="ih-ach-card__glow"></div>
              <div class="ih-ach-card__icon">${a.icon}</div>
              <div class="ih-ach-card__label">${a.label}</div>
              <div class="ih-ach-card__desc">${a.desc}</div>
              ${done ? '<div class="ih-ach-card__tick">✓</div>' : '<div class="ih-ach-card__lock">🔒</div>'}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderOracleTab() {
  const titles = state.titles || [];
  const topCategory = (() => {
    const cats = {};
    titles.forEach(t => { if (t.category) cats[t.category] = (cats[t.category] || 0) + 1; });
    return Object.keys(cats).sort((a,b) => cats[b] - cats[a])[0] || 'anime';
  })();

  const topGenre = (() => {
    const genres = {};
    titles.forEach(t => { if (t.genre) genres[t.genre] = (genres[t.genre] || 0) + 1; });
    return Object.keys(genres).sort((a,b) => genres[b] - genres[a])[0] || 'Action';
  })();

  const oraclePicks = [
    { title: 'Solo Leveling (Arise)', category: 'anime', genre: 'Action · Fantasy', rating: '8.7', desc: 'In a world where hunters battle deadly monsters, weak hunter Sung Jinwoo gets a second chance.', poster: 'https://cdn.myanimelist.net/images/anime/1521/140924.jpg' },
    { title: 'Omniscient Reader\'s Viewpoint', category: 'manhwa', genre: 'Action · System', rating: '9.2', desc: 'Kim Dokja is the sole reader of a web novel. Suddenly, the novel becomes real life.', poster: 'https://uploads.mangadex.org/covers/e005080e-3b56-4dc5-b461-750d686f082e/6b010c2c-e11f-49e0-88cb-7e23b2c4e2cf.jpg.256.jpg' },
    { title: 'The Glory (K-Drama)', category: 'series', genre: 'K-Drama · Revenge', rating: '8.8', desc: 'Years after surviving horrific abuse in high school, a woman puts a elaborate revenge plan in motion.', poster: 'https://image.tmdb.org/t/p/w500/6jO24y0x6Neq4lS6o1n1s54.jpg' },
    { title: 'KinnPorsche: The Series', category: 'series', genre: 'Thai Drama · BL Action', rating: '8.6', desc: 'Porsche, a young bartender, gets drawn into the dangerous mafia underworld as bodyguard to Kinn.', poster: 'https://image.tmdb.org/t/p/w500/q3U4nZ8o4P2X4J0.jpg' }
  ];

  const cardsHtml = oraclePicks.map(p => `
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 14px; display: flex; gap: 14px; margin-bottom: 12px; align-items: center;">
      <img src="${p.poster}" style="width: 56px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" onerror="this.src='https://placehold.co/56x80/1a1a2e/ffffff?text=Eclipse'">
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${p.title}</h4>
          <span style="font-size: 11px; color: var(--cyan); font-weight: 700;">★ ${p.rating}</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">${p.genre}</div>
        <p style="font-size: 11px; color: var(--text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">${p.desc}</p>
      </div>
      <button class="btn-primary oracle-quick-add" data-title="${p.title}" data-category="${p.category}" data-genre="${p.genre}" data-poster="${p.poster}" style="padding: 6px 12px; font-size: 11px; flex-shrink: 0;">
        + Add
      </button>
    </div>
  `).join('');

  return `
    <div class="ih-oracle-tab" style="padding: 10px 0;">
      <div style="background: linear-gradient(135deg, rgba(155,92,255,0.15), rgba(34,229,208,0.08)); border: 1px solid rgba(155,92,255,0.3); border-radius: 16px; padding: 18px; text-align: center; margin-bottom: 20px; position: relative; overflow: hidden;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #9B5CFF, #22E5D0); border-radius: 50%; margin-bottom: 10px; box-shadow: 0 0 20px rgba(155,92,255,0.4);">
          <span style="font-size: 22px;">🔮</span>
        </div>
        <h3 style="margin: 0 0 4px 0; font-size: 17px; font-weight: 700; color: #fff;">Oracle AI Recommendations</h3>
        <p style="margin: 0; font-size: 12px; color: var(--text-secondary);">Synthesized for your affinity: <strong style="color: var(--cyan);">${topGenre}</strong> & <strong style="color: var(--violet);">${topCategory.toUpperCase()}</strong></p>
      </div>

      <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px;">Top Oracle Curations</div>
      <div id="oracleRecommendationsList">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function attachInsightsListeners() {
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
        showUndoToast(`"${item.title}" is already in your library!`);
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
      showUndoToast(`Added "${item.title}" to library!`);
      updateHeroZone();
      updateStrip();
    };
  });
}

// ============================================================
// MATRIX PILL FILTERS (Pure Filter - No Search Bar Injection)
// ============================================================
function setupMatrixPills() {
  document.querySelectorAll('.matrix-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const filter = pill.dataset.filter || pill.dataset.cat || 'all';
      document.querySelectorAll('.matrix-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      // Clear search input so clicking matrix pills doesn't search strings
      const searchInput = $('#searchInput');
      if (searchInput) searchInput.value = '';
      deactivateSearchTakeover();

      if (filter === 'trending' || filter === 'all') {
        document.querySelectorAll('.matrix-section').forEach(sec => sec.classList.remove('hidden'));
        document.getElementById('matrixGrid').classList.remove('hidden');
      } else if (['anime', 'movies', 'series', 'manhwa', 'manga', 'kdrama', 'thai', 'bl', 'gl'].includes(filter.toLowerCase())) {
        const targetCat = filter === 'manga' ? 'manhwa' : filter;
        document.querySelectorAll('.matrix-section').forEach(sec => {
          const isMatch = sec.id === `section-${targetCat}` || sec.dataset.category === targetCat;
          sec.classList.toggle('hidden', !isMatch);
        });
        document.getElementById('matrixGrid').classList.add('hidden'); // hide the infinite grid so only the section shows
      } else {
        // Preset mood filter
        const queryMap = {
          'tv-series': 'popular tv series',
          'bl-gl': 'bl gl romance',
          'sci-fi': 'science fiction',
          'marvel-dc': 'marvel superhero',
          'new-releases': '2025',
          'feel-good': 'feel good comedy',
          'dark-gritty': 'thriller action',
          'short-binge': 'mini series'
        };
        const query = queryMap[filter] || filter;
        activateSearchTakeover(query, 'all');
      }
    });
  });
}

async function renderCmdPaletteResults(query) {
  const container = $('#cmdPaletteResults');
  const q = query.trim().toLowerCase();
  
  // Show a loading state if typing
  if (q.length > 0) {
    container.innerHTML = `<div class="command-palette__group-label" style="text-align: center; margin-top: 20px;">Searching APIs... <span class="oracle-orb oracle-orb--loading" style="width: 14px; height: 14px; display: inline-block;"></span></div>`;
  }

  const filtered = CMD_PALETTE_ITEMS.filter(item =>
    item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
  );

  // Group filtered local commands
  const groups = {};
  filtered.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  let html = '';
  Object.entries(groups).forEach(([group, items]) => {
    html += `<div class="command-palette__group-label">${group}</div>`;
    items.forEach(item => {
      if (item && item.title && !liveCatalog.some(d => d.id === item.id)) liveCatalog.push(item);
      // Add to liveCatalog so Hero and Strip can use it
      if (item && item.title && !liveCatalog.some(d => d.id === item.id)) {
        liveCatalog.push(item);
      }

      html += `
        <div class="command-palette__item" data-label="${item.label}">
          <div class="command-palette__item-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
          <span class="command-palette__item-text">${item.label}</span>
          <span class="command-palette__item-hint">${item.hint}</span>
        </div>
      `;
    });
  });

  // Fetch live title results from TMDB / Jikan API
  let titleResults = [];
  if (q.length > 0) {
    titleResults = await searchAll(q);
    titleResults = titleResults.slice(0, 7); // Show top 7 matches
  }

  if (titleResults.length > 0) {
    html += `<div class="command-palette__group-label">Global Search Results (TMDB / MAL)</div>`;
    titleResults.forEach((t, index) => {
      // Store the object as a data attribute so we can recover it
      const encodedData = encodeURIComponent(JSON.stringify(t));
      html += `
        <div class="command-palette__item global-search-item" data-encoded="${encodedData}" style="height: auto; min-height: 44px; padding: 6px 12px;">
          ${t.poster ? `<img src="${t.poster}" alt="poster" style="width: 24px; height: 36px; border-radius: 4px; object-fit: cover; margin-right: 12px;"/>` : `<div class="command-palette__item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/></svg></div>`}
          <div style="display: flex; flex-direction: column;">
            <span class="command-palette__item-text">${t.title}</span>
            <span class="command-palette__item-hint" style="margin-left: 0;">${t.category.toUpperCase()} · ${t.releaseYear || '?'} · ⭐ ${t.rating || 'N/A'}</span>
          </div>
        </div>
      `;
    });
  } else if (q.length > 0) {
     html += `<div class="command-palette__group-label" style="text-align: center; margin-top: 10px;">No matches found</div>`;
  } else if (q.length === 0) {
     html += `<div class="command-palette__group-label" style="text-align: center; margin-top: 10px; color: var(--accent-primary);">Start typing to search global catalog</div>`;
  }

  container.innerHTML = html;

  // Attach click listeners for local commands
  container.querySelectorAll('.command-palette__item:not(.global-search-item)').forEach(item => {
    item.addEventListener('click', () => {
      const label = item.dataset.label;
      const cmdItem = CMD_PALETTE_ITEMS.find(c => c.label === label);
      if (cmdItem) cmdItem.action();
      else closeCmdPalette();
    });
  });

  // Attach click listeners for Global Search Results (Add to Watchlist)
  container.querySelectorAll('.global-search-item').forEach(item => {
    item.addEventListener('click', async () => {
      const dataStr = item.dataset.encoded;
      if (!dataStr) return;
      
      const t = JSON.parse(decodeURIComponent(dataStr));
      
      // Prevent duplicates locally
      if ((state.titles || []).find(existing => existing.id === t.id || existing.title === t.title)) {
        showUndoToast(`"${t.title}" is already in your list!`);
        closeCmdPalette();
        return;
      }

      const newTitle = {
        ...t,
        status: 'in-progress', // Default status to show immediately on hero
        progress: 0,
        addedAt: new Date().toISOString()
      };

      if (!state.titles) state.titles = [];
      state.titles.push(newTitle);
      
      showUndoToast(`Added "${t.title}" to Planning!`);
      closeCmdPalette();
      saveLocalWatchlist();
      
      updateHeroZone();
      updateStrip();
      
      
      // Save to Firestore if authenticated
      if (state.user) {
        try {
          const docRef = doc(db, 'users', state.user.uid, 'watchlist', String(newTitle.id));
          await setDoc(docRef, newTitle);
        } catch (err) {
          console.error('Failed to add title to cloud', err);
        }
      }
    });
  });
}

// ============================================================
// EXPLORE FAB
// ============================================================

function scrollToMatrix() {
  const matrix = $('#infinityMatrix');
  if (matrix) {
    matrix.scrollIntoView({ behavior: 'smooth' });
  }
}

function setupExploreFab() {
  const fab = $('#exploreFab');
  const matrix = $('#infinityMatrix');

  fab.addEventListener('click', scrollToMatrix);

  // Hide FAB when at the matrix
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      fab.classList.toggle('at-matrix', entry.isIntersecting);
    });
  }, { threshold: 0.1 });

  observer.observe(matrix);
}

// ============================================================
// SURPRISE ME
// ============================================================

function handleSurpriseMe() {
  const pool = liveCatalog && liveCatalog.length > 0 ? liveCatalog : getDiscoverForCategory(state.activeCategory);
  if (!pool || pool.length === 0) {
    showUndoToast('Fetching multiversal titles... try again in a moment!');
    return;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  openInfoModal(pick);
  showUndoToast(`🎲 Surprise pick: ${pick.title}!`);
}

// ============================================================
// NAV SEARCH
// ============================================================

function setupNavSearch() {
  const navSearch = $('#navSearch');
  const input = $('#navSearchInput');
  const toggle = $('#navSearchToggle');
  const jumpToMatrix = $('#jumpToMatrix');

  toggle.addEventListener('click', () => {
    const wasExpanded = navSearch.classList.contains('expanded');
    navSearch.classList.toggle('expanded');
    if (!wasExpanded) {
      // Opening — focus
      input.focus();
    } else {
      // Closing — always deactivate search takeover and clear input
      input.value = '';
      deactivateSearchTakeover();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navSearch.contains(e.target)) {
      navSearch.classList.remove('expanded');
      if (input.value === '') deactivateSearchTakeover();
    }
  });

  // Live search (debounced) → takeover strip
  const handleSearch = debounce((query) => {
    activateSearchTakeover(query);
  }, 250);

  input.addEventListener('input', () => handleSearch(input.value));

  // Jump to Matrix link
  jumpToMatrix.addEventListener('click', () => {
    navSearch.classList.remove('expanded');
    scrollToMatrix();
  });

  // Recent chips
  $$('.recent-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.textContent;
      handleSearch(chip.textContent);
    });
  });
}

// ============================================================
// EVENT SETUP
// ============================================================

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('cinepulse_theme', theme);
}

let liveCatalogPage = 1;
let isFetchingLive = false;

async function initLiveCatalog(page = 1, append = false) {
  if (isFetchingLive) return;
  isFetchingLive = true;

  const loadingEl = $('#matrixLoading');
  if (loadingEl) loadingEl.classList.remove('hidden');

  // Fire each API independently — stream results in as they arrive, don't wait for all
  const seenIds = new Set(liveCatalog.map(d => d.id));
  
  if (page === 1 && !append) {
    const stripScroll = $('#stripScroll');
    if (stripScroll) stripScroll.innerHTML = '';
  }

  const pushItem = async (item) => {
    if (!item || !item.title || seenIds.has(item.id)) return;
    seenIds.add(item.id);
    const enriched = {
      ...item,
      reason: item.reason || ('🔥 Trending in ' + (item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Catalog'))
    };
    liveCatalog.push(enriched);
    
    // Incrementally update the strip
    const stripScroll = $('#stripScroll');
    if (stripScroll && state.activeCategory === 'all') {
       stripScroll.appendChild(createContentCard(enriched, true));
    }
    
    // The very first item gets put into the Hero Zone immediately
    if (liveCatalog.length === 1) {
       updateHeroZone();
    }
    
    await new Promise(r => setTimeout(r, 40));
  };

  // Launch all 4 independently — results stream in as each resolves
  const promises = [
    getTopJikan('anime', page).then(async results => { for (const i of (results || [])) await pushItem(i); }).catch(() => {}),
    fetchTopManhwa(page).then(async results => { for (const i of (results || [])) await pushItem(i); }).catch(() => {}),
    fetchTVMazeSeries(Math.max(0, page - 1)).then(async results => { for (const i of (results || [])) await pushItem(i); }).catch(() => {}),
    getTrendingTMDB('all', 'week').then(async results => { for (const i of (results || [])) await pushItem(i); }).catch(() => {})
  ];

  // Wait for all to settle (but results have already streamed in above)
  await Promise.allSettled(promises);

  isFetchingLive = false;
  if (loadingEl) loadingEl.classList.add('hidden');
}


// ============================================================
// LIVE INFINITE MATRIX LOGIC
// ============================================================
const sectionPages = { anime: 1, movies: 1, series: 1, manhwa: 1 };
const loadingSections = { anime: false, movies: false, series: false, manhwa: false };

async function renderMatrixSections() {
  const container = $('#matrixSections');
  if (!container) return;
  container.innerHTML = '';
  
  // Clear the old continuous grid if any
  const grid = $('#matrixGrid');
  if (grid) grid.innerHTML = '';

  const sections = [
    { id: 'anime', title: 'Top Anime Streams', category: 'anime' },
    { id: 'movies', title: 'Trending Movies', category: 'movies' },
    { id: 'series', title: 'Popular Series', category: 'series' },
    { id: 'manhwa', title: 'Top Manhwa Readers', category: 'manhwa' },
    { id: 'kdrama', title: 'Top K-Dramas', category: 'kdrama' },
    { id: 'thai', title: 'Thai BL & Drama', category: 'thai' },
    { id: 'bl', title: 'BL Series', category: 'bl' },
    { id: 'gl', title: 'GL Series', category: 'gl' }
  ];

  sections.forEach(sec => {
    const sectionHtml = `
      <div class="matrix-section" id="section-${sec.id}" style="margin-bottom: 40px;">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; padding: 0 5%; margin-bottom: 20px;">
          <h2 class="section-title" style="margin: 0; font-size: 24px; font-weight: 700;">${sec.title}</h2>
        </div>
        <div class="matrix-row" id="row-${sec.id}" style="display: flex; gap: 20px; overflow-x: auto; padding: 0 5%; padding-bottom: 20px; scroll-snap-type: x mandatory; scrollbar-width: none;">
          <div id="loading-${sec.id}" style="padding: 20px; color: var(--text-muted);">Syncing live ${sec.category} data...</div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', sectionHtml);
    
    // Hide default scrollbar for webkit
    const style = document.createElement('style');
    style.innerHTML = `#row-${sec.id}::-webkit-scrollbar { display: none; }`;
    document.head.appendChild(style);

    loadSectionPage(sec.id, 1);
  });
}

async function loadSectionPage(sectionId, page) {
  if (loadingSections[sectionId]) return;
  loadingSections[sectionId] = true;

  const row = document.getElementById(`row-${sectionId}`);
  if (!row) { loadingSections[sectionId] = false; return; }

  try {
    let items = [];

    if (sectionId === 'anime') {
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
        items = await discoverTMDB('tv', { with_original_language: 'ko', with_genres: '18', sort_by: 'popularity.desc', page });
        items = (items || []).map(i => ({ ...i, category: 'kdrama' }));
      } else if (sectionId === 'thai') {
        items = await discoverTMDB('tv', { with_original_language: 'th', with_genres: '18', sort_by: 'popularity.desc', page });
        items = (items || []).map(i => ({ ...i, category: 'thai' }));
      } else if (sectionId === 'bl') {
        items = await discoverTMDB('tv', { with_keywords: '210024', sort_by: 'popularity.desc', page });
        items = (items || []).map(i => ({ ...i, category: 'bl' }));
      } else if (sectionId === 'gl') {
        items = await searchTMDB('girls love ' + page, 'tv');
        items = (items || []).map(i => ({ ...i, category: 'gl' }));
      }

    // Remove loading placeholder (only page 1)
    if (page === 1) {
      const loadingEl = document.getElementById(`loading-${sectionId}`);
      if (loadingEl) loadingEl.remove();
    }

    // Remove old scroll sentinel
    const oldTarget = row.querySelector('.scroll-target');
    if (oldTarget) oldTarget.remove();

    // Append cards — NO per-card delay (that was killing throughput)
    const fragment = document.createDocumentFragment();
    for (const item of items) {
      if (item && item.title) {
        const card = createContentCard(item);
        card.style.cssText += ';flex:0 0 auto;width:200px;scroll-snap-align:start;';
        fragment.appendChild(card);
      }
    }
    row.appendChild(fragment);

    // Attach new scroll sentinel for next page ALWAYS
    // Even if items is empty, we attach it so we can retry on scroll
    const sentinel = document.createElement('div');
    sentinel.className = 'scroll-target';
    sentinel.style.cssText = 'flex:0 0 1px;min-width:1px;';
    row.appendChild(sentinel);

    // Use a 400px right margin so next page loads BEFORE user hits the end
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        io.disconnect();
        // Use setTimeout to ensure this triggers on the next tick,
        // after the current loadSectionPage has fully finished and released the loading lock.
        setTimeout(() => {
          sectionPages[sectionId]++;
          loadSectionPage(sectionId, sectionPages[sectionId]);
        }, 0);
      }
    }, { root: row, rootMargin: '0px 400px 0px 0px', threshold: 0 });
    io.observe(sentinel);

  } catch (err) {
    console.error(`[Matrix] Failed to load ${sectionId} p${page}:`, err);
    // Retry once after 2s on failure
    setTimeout(() => {
      loadingSections[sectionId] = false;
      loadSectionPage(sectionId, page);
    }, 2000);
    return;
  } finally {
    loadingSections[sectionId] = false;
  }
}

function updateMatrix() {
  // Rows manage their own continuous scroll
}

// ============================================================
// MARK AS WATCHED MODAL LOGIC
// ============================================================
function openMarkWatched(item = null) {
  const targetItem = item || (liveCatalog && liveCatalog.length > 0 ? liveCatalog[0] : null);
  if (!targetItem) {
    showUndoToast('No title selected to mark watched.');
    return;
  }
  state.markWatchedItem = targetItem;
  state.markWatchedOpen = true;
  const backdrop = $('#markWatchedBackdrop');
  if (backdrop) backdrop.classList.add('open');
}

function closeMarkWatched() {
  state.markWatchedOpen = false;
  const backdrop = $('#markWatchedBackdrop');
  if (backdrop) backdrop.classList.remove('open');
}

function setupMarkWatchedModal() {
  const backdrop = $('#markWatchedBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeMarkWatched();
    });
  }

  const completedTodayBtn = $('#completedTodayBtn');
  if (completedTodayBtn) {
    completedTodayBtn.addEventListener('click', () => {
      if (state.markWatchedItem) {
        updateTitleProgress(state.markWatchedItem, 1, 'completed');
        showUndoToast(`Marked "${state.markWatchedItem.title}" as completed! 🎉`);
      }
      closeMarkWatched();
    });
  }

  const approxPills = document.querySelectorAll('#approxPills .modal__approx-pill');
  approxPills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (state.markWatchedItem) {
        updateTitleProgress(state.markWatchedItem, 1, 'completed');
        showUndoToast(`Marked "${state.markWatchedItem.title}" as completed!`);
      }
      closeMarkWatched();
    });
  });

  const exactDateToggle = $('#exactDateToggle');
  const datePicker = $('#datePicker');
  if (exactDateToggle && datePicker) {
    exactDateToggle.addEventListener('click', () => {
      datePicker.classList.toggle('open');
    });
  }

  const skipDateBtn = $('#skipDateBtn');
  if (skipDateBtn) {
    skipDateBtn.addEventListener('click', () => {
      if (state.markWatchedItem) {
        state.markWatchedItem.completedAt = new Date().toISOString();
        updateTitleProgress(state.markWatchedItem, 1, 'completed');
        showUndoToast(`Marked "${state.markWatchedItem.title}" as completed!`);
      }
      closeMarkWatched();
    });
  }
}

function init() {
  initLiveCatalog(1);
  renderMatrixSections();

  // Category pills
  $$('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => switchCategory(pill.dataset.category));
  });

  // Nav search
  setupNavSearch();

  // Surprise Me (nav)
  $('#surpriseMeBtn').addEventListener('click', handleSurpriseMe);
  // Surprise Me (strip)
  $('#stripSurprise').addEventListener('click', handleSurpriseMe);

  // Insights Hub Drawer
  const insightsBtn = $('#insightsBtn');
  if (insightsBtn) insightsBtn.addEventListener('click', openInsights);

  const insightsClose = $('#insightsClose');
  if (insightsClose) insightsClose.addEventListener('click', closeInsights);

  const insightsBackdrop = $('#insightsBackdrop');
  if (insightsBackdrop) insightsBackdrop.addEventListener('click', closeInsights);

  $$('#insightsTabs .insights-tab').forEach(tab => {
    tab.addEventListener('click', () => switchInsightsTab(tab.dataset.tab));
  });

  // Community Modal & Registered User Profile Viewer
  initCommunityAndProfileViewer();

  // Profile Drawer
  const avatarWrapper = $('#avatarWrapper');
  if (avatarWrapper) avatarWrapper.addEventListener('click', openProfile);

  const profileClose = $('#profileClose');
  if (profileClose) profileClose.addEventListener('click', closeProfile);

  const profileBackdrop = $('#profileBackdrop');
  if (profileBackdrop) profileBackdrop.addEventListener('click', closeProfile);

  $$('#profileTabs .profile-tab').forEach(tab => {
    tab.addEventListener('click', () => switchProfileTab(tab.dataset.ptab));
  });

  // Empty State CTA buttons
  const emptyCtas = $$('#emptyCtaGroup .hero-empty__cta');
  emptyCtas.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat');
      if (cat) {
        // Find the tab button to simulate a click (which runs switchCategory)
        const tabBtn = Array.from($$('.nav__tab')).find(t => t.getAttribute('data-cat') === cat);
        if (tabBtn) tabBtn.click();
      }
      scrollToMatrix();
      const matrixInput = $('#matrixSearchInput');
      if (matrixInput) matrixInput.focus();
    });
  });

  // Mark as Watched modal
  setupMarkWatchedModal();
  // Note: heroMarkBtn.onclick is set dynamically in updateHeroZone() per current title


  // Matrix pills
  setupMatrixPills();

  // Matrix search
  const matrixInput = $('#matrixSearchInput');
  if (matrixInput) {
    matrixInput.addEventListener('input', debounce(() => {
      activateSearchTakeover(matrixInput.value, state.activeCategory === 'all' ? 'all' : state.activeCategory);
    }, 250));
  }

  // Info Modal Close Listeners
  const infoClose = $('#infoModalClose');
  if (infoClose) infoClose.addEventListener('click', closeInfoModal);
  const infoBackdrop = $('#infoModalBackdrop');
  if (infoBackdrop) infoBackdrop.addEventListener('click', closeInfoModal);

  // Explore FAB
  setupExploreFab();

  // Command Palette (Ctrl+K / Cmd+K)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (state.cmdPaletteOpen) closeCmdPalette();
      else openCmdPalette();
    }
    if (e.key === 'Escape') {
      if (state.cmdPaletteOpen) closeCmdPalette();
      if (state.titlelistOpen) closeTitleList();
      if (state.profileOpen) closeProfile();
      if (state.markWatchedOpen) closeMarkWatched();
      closeInfoModal();
    }
  });

  // Command palette input
  $('#cmdPaletteInput').addEventListener('input', (e) => {
    renderCmdPaletteResults(e.target.value);
  });

  // Command palette backdrop
  $('#cmdPaletteBackdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCmdPalette();
  });

  // Oracle link in empty state
  $('#emptyOracleLink').addEventListener('click', (e) => {
    e.preventDefault();
    openInsights();
    switchInsightsTab('oracle');
  });

  // Title list panel close/back
  $('#titlelistBack').addEventListener('click', closeTitleList);
  $('#titlelistClose').addEventListener('click', closeTitleList);
  $('#titlelistBackdrop').addEventListener('click', closeTitleList);

  // Banner edit button
  $('#profileBannerEdit').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#profilePalette').classList.toggle('hidden');
  });

  // Palette swatch clicks
  $$('.palette-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      e.stopPropagation();
      $$('.palette-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      const gradient = swatch.dataset.gradient;
      $('#profileBanner').style.background = gradient;
      localStorage.setItem('cinepulse_banner', gradient);
    });
  });

  // Theme logic
  const savedTheme = localStorage.getItem('cinepulse_theme') || 'default';
  applyTheme(savedTheme);

  $$('.theme-pill').forEach(pill => {
    if (pill.dataset.theme === savedTheme) {
      pill.classList.add('active');
    }
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      $$('.theme-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const theme = pill.dataset.theme;
      applyTheme(theme);
    });
  });
  
  // —— Version-gated localStorage reset (clears old data on fresh build) ——
  const DATA_VERSION = '4.0';
  if (localStorage.getItem('cinepulse_data_version') !== DATA_VERSION) {
    // Only clear watchlist/streak on version change, preserve username and banner
    localStorage.removeItem('cinepulse_watchlist');
    localStorage.removeItem('cinepulse_streak');
    localStorage.setItem('cinepulse_data_version', DATA_VERSION);
    // Keep theme + username + banner across resets
  }

  // Load local watchlist if available (after reset check)
  const savedWatchlist = loadLocalWatchlist();
  if (savedWatchlist && savedWatchlist.length > 0) {
    state.titles = savedWatchlist;
  }

  // Connect setupAuth to init!
  setupAuth();

  const uname = localStorage.getItem('cinepulse_username');
  if (uname) {
    updateProfileDisplay(uname);
  } else {
    setTimeout(showGuestUsernamePrompt, 1200);
  }

  // Initial render
  updateHeroZone();
  updateStrip();
  

  // Auto-scrape live data from Jikan & TVMaze APIs
  

  // Infinity Matrix Scroll Listener for Pagination
  const matrixGrid = $('#matrixGrid');
  if (matrixGrid) {
    // We attach scroll to window or a specific container. If #matrixGrid is inside a scrollable div, attach there.
    // If body is scrolling, attach to window. Let's assume window or the grid itself is scrollable.
    // Usually the main content area scrolls. We'll listen on window.
    window.addEventListener('scroll', () => {
      // If user is near the bottom
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        if (!isFetchingLive) {
          liveCatalogPage++;
          
        }
      }
    });
  }
}

// ============================================================
// FIREBASE AUTHENTICATION LOGIC
// ============================================================

function setupAuth() {
  const authOverlay = $('#authOverlay');
  
  // Auto-bypass if returning guest
  if (localStorage.getItem('cinepulse_username')) {
    authOverlay.classList.add('hidden');
  }
  const authForm = $('#authForm');
  const authToggleBtn = $('#authToggleBtn');
  const authToggleText = $('#authToggleText');
  const authSubmitBtn = $('#authSubmitBtn');
  const authErrorMsg = $('#authErrorMsg');
  const authEmail = $('#authEmail');
  const authPassword = $('#authPassword');
  const authGuestBtn = $('#authGuestBtn');

  let isSignupMode = false;

  // Toggle between Login and Signup modes
  authToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isSignupMode = !isSignupMode;
    const authUsernameGroup = $('#authUsernameGroup');
    const authUsernameInput = $('#authUsername');

    if (isSignupMode) {
      authSubmitBtn.textContent = 'Create Account';
      authToggleText.textContent = 'Already have an account?';
      authToggleBtn.textContent = 'Sign In';
      authUsernameGroup.style.display = 'block';
      if (authUsernameInput) {
        authUsernameInput.setAttribute('required', 'required');
        authUsernameInput.focus();
      }
    } else {
      authSubmitBtn.textContent = 'Sign In';
      authToggleText.textContent = 'New here?';
      authToggleBtn.textContent = 'Create Account';
      authUsernameGroup.style.display = 'none';
      if (authUsernameInput) {
        authUsernameInput.removeAttribute('required');
        authEmail.focus();
      }
    }
    authErrorMsg.textContent = '';
  });

  // Guest Mode
  if (authGuestBtn) {
    authGuestBtn.addEventListener('click', () => {
      authOverlay.classList.add('hidden');
      if (!state.titles || state.titles.length === 0) {
        state.titles = [];
      }
      switchCategory('all');
      showUndoToast('Browsing in Guest Mode');
      if (!localStorage.getItem('cinepulse_username')) showGuestUsernamePrompt();
    });
  }

  // Handle Form Submission
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value;
    const usernameInput = $('#authUsername');
    let username = usernameInput ? usernameInput.value.trim() : '';
    // Basic sanitization
    username = username.replace(/[^a-zA-Z0-9_]/g, '');

    if (isSignupMode && !username) {
      authErrorMsg.textContent = 'Username is required to sign up.';
      return;
    }

    authSubmitBtn.textContent = 'Please wait...';
    authErrorMsg.textContent = '';

    try {
      if (isSignupMode) {
        // Create user in Firebase Auth FIRST
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const usernameLower = username.toLowerCase();
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          username: username,
          username_lowercase: usernameLower,
          createdAt: new Date().toISOString(),
          totalWatchTime: 0,
          friends: []
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error("Firebase Auth Error:", error);
      authSubmitBtn.textContent = isSignupMode ? 'Create Account' : 'Sign In';

      if (error.code === 'auth/configuration-not-found' || (error.message && error.message.includes('configuration-not-found'))) {
        authErrorMsg.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px 12px; border-radius: 8px; text-align: left; line-height: 1.4;">
            <strong style="color: #ff6b6b; font-size: 13px;">⚠️ Firebase Email/Password Auth Disabled</strong>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 6px 0;">
              Email/Password sign-in is not enabled in your Firebase Console for project <strong>cineplus-495a2</strong>.
            </p>
            <div style="font-size: 11px; color: var(--text-muted);">
              <strong>To fix:</strong> Go to <a href="https://console.firebase.google.com" target="_blank" style="color: var(--cyan); text-decoration: underline;">Firebase Console</a> &rarr; <em>Authentication</em> &rarr; <em>Sign-in method</em> &rarr; Enable <strong>Email/Password</strong>.
            </div>
            <div style="margin-top: 8px; text-align: center;">
              <button type="button" id="authErrorGuestBtn" style="background: var(--gradient-primary); color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;">
                Continue in Guest Mode &rarr;
              </button>
            </div>
          </div>
        `;

        const errorGuestBtn = $('#authErrorGuestBtn');
        if (errorGuestBtn) {
          errorGuestBtn.addEventListener('click', () => {
            authOverlay.classList.add('hidden');
            if (!state.titles || state.titles.length === 0) {
              state.titles = [];
            }
            switchCategory('all');
            showUndoToast('Browsing in Guest Mode');
          });
        }
      } else if (error.code === 'auth/email-already-in-use') {
        authErrorMsg.textContent = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        authErrorMsg.textContent = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        authErrorMsg.textContent = 'Password should be at least 6 characters long.';
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        authErrorMsg.textContent = 'Invalid email or password. Please check your credentials.';
      } else {
        authErrorMsg.textContent = error.message.replace('Firebase: ', '');
      }
    }
  });

  // Listen for Auth State Changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      state.user = user;
      authOverlay.classList.add('hidden'); // Hide overlay
      await loadUserData(user.uid);
    } else {
      state.user = null;
      state.userProfile = null;
      state.titles = [];
      switchCategory('all');
    }
  });

  // Wire Logout Button
  const logoutBtn = $('#profileLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      closeProfile();
      localStorage.removeItem('cinepulse_username');
      if (state.user) {
        await signOut(auth);
      }
      location.reload();
    });
  }
}

// ============================================================
// DATA LOADING & REALTIME SYNC
// ============================================================

// —— Bug 5 & 6: Update profile name + streak everywhere ——
function updateProfileDisplay(displayName) {
  const name = displayName || 'Guest';
  const profileNameEl = $('.profile-name');
  if (profileNameEl) profileNameEl.textContent = name;

  const avatarWrapper = $('#avatarWrapper');
  if (avatarWrapper && !state.user) {
    avatarWrapper.innerHTML = `
      <div class="avatar-ring"></div>
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
    `;
  }

  // Update streak display in profile
  const profileStreakEl = $('.profile-streak');
  if (profileStreakEl) {
    try {
      const sdata = JSON.parse(localStorage.getItem('cinepulse_streak') || '{}');
      const streak = sdata.streak || 0;
      profileStreakEl.textContent = streak > 0 ? `🔥 ${streak}-day streak` : '✨ Day 1 — start your streak!';
    } catch(e) {
      profileStreakEl.textContent = '✨ Day 1 — start your streak!';
    }
  }
}

// —— Bug 6: Guest username prompt modal ——
function showGuestUsernamePrompt() {
  // Only show if NOT logged in via Firebase
  if (state.user) return;
  const existing = document.getElementById('guestUsernameModal');
  if (existing) return;

  const modal = document.createElement('div');
  modal.id = 'guestUsernameModal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(12px);
  `;
  modal.innerHTML = `
    <div style="
      background: var(--bg-card, #1a1a2e); border: 1px solid var(--border-subtle, #333);
      border-radius: 16px; padding: 36px; max-width: 380px; width: 90%;
      box-shadow: 0 24px 48px rgba(0,0,0,0.6); text-align: center;
      animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <div style="font-size: 40px; margin-bottom: 12px">🎬</div>
      <h2 style="font-family: Poppins, sans-serif; font-size: 22px; font-weight: 700; color: var(--text-primary, #fff); margin-bottom: 6px">
        Welcome to Eclipse
      </h2>
      <p style="color: var(--text-muted, #888); font-size: 14px; margin-bottom: 24px; line-height: 1.5">
        What should we call you? Pick a username to personalize your experience.
      </p>
      <input id="guestUsernameInput" type="text" maxlength="20" placeholder="e.g. SakuraDawn99" autocomplete="off" style="
        width: 100%; box-sizing: border-box;
        background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle, #444);
        border-radius: 10px; padding: 12px 16px;
        color: var(--text-primary, #fff); font-size: 16px; font-family: inherit;
        margin-bottom: 12px; outline: none; text-align: center;
        transition: border-color 0.2s;
      ">
      <button id="guestUsernameSubmit" style="
        width: 100%; padding: 12px 24px;
        background: var(--accent-gradient, linear-gradient(135deg, #FF4B4B, #9B5CFF));
        border: none; border-radius: 10px; color: white;
        font-size: 15px; font-weight: 700; cursor: pointer;
        font-family: inherit; transition: opacity 0.2s;
        margin-bottom: 10px;
      ">Let's Go 🚀</button>
      <button id="guestUsernameSkip" style="
        background: none; border: none; color: var(--text-muted, #888);
        font-size: 13px; cursor: pointer; font-family: inherit;
      ">Skip for now</button>
    </div>
  `;
  document.body.appendChild(modal);

  const input = modal.querySelector('#guestUsernameInput');
  const submit = modal.querySelector('#guestUsernameSubmit');
  const skip = modal.querySelector('#guestUsernameSkip');

  input.focus();
  input.addEventListener('focus', () => { input.style.borderColor = 'var(--cyan, #22E5D0)'; });
  input.addEventListener('blur', () => { input.style.borderColor = 'var(--border-subtle, #444)'; });

  const save = () => {
    let uname = (input.value || '').trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!uname) uname = 'Guest';
    localStorage.setItem('cinepulse_username', uname);
    updateProfileDisplay(uname);
    modal.remove();
    showUndoToast(`👋 Welcome, ${uname}!`);
  };

  submit.addEventListener('click', save);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
  skip.addEventListener('click', () => {
    localStorage.setItem('cinepulse_username', 'Guest');
    updateProfileDisplay('Guest');
    modal.remove();
  });
}

async function loadUserData(uid) {
  try {
    // 1. Fetch User Profile
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      state.userProfile = userDoc.data();
    } else {
      state.userProfile = { 
        username: state.user.email ? state.user.email.split('@')[0] : 'User',
        email: state.user.email,
        friends: [] 
      };
      await setDoc(userDocRef, state.userProfile, { merge: true });
    }

    // Update Profile UI using unified function
    const displayName = state.userProfile.username || state.user.email.split('@')[0];
    localStorage.setItem('cinepulse_username', displayName);
    updateProfileDisplay(displayName);

    const avatarWrapper = $('#avatarWrapper');
    if (avatarWrapper) {
      avatarWrapper.innerHTML = `
        <div class="avatar-ring"></div>
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
      `;
    }

    // 2. Fetch Watchlist Subcollection
    const watchlistRef = collection(db, 'users', uid, 'watchlist');
    const watchlistSnap = await getDocs(watchlistRef);
    const titles = [];
    watchlistSnap.forEach(d => {
      titles.push(d.data());
    });

    if (titles.length > 0) {
      state.titles = titles;
    } else {
      state.titles = [];
    }
    
    // Refresh UI with loaded data
    switchCategory(state.activeCategory || 'all');
  } catch (err) {
    console.error('Error loading user data:', err);
    showUndoToast('Loaded session titles.');
  }
}

// ============================================================
// HELPER: Build a single progress item row
// ============================================================
function saveLocalWatchlist() {
  try {
    localStorage.setItem('cinepulse_watchlist', JSON.stringify(state.titles));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

function loadLocalWatchlist() {
  try {
    const stored = localStorage.getItem('cinepulse_watchlist');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to read localStorage', e);
  }
  return null;
}


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

async function updateTitleProgress(title, delta = 1, forceStatus = null) {
  try {
    if (!title) return;
  const isMovie = title.category === 'movies';
  const isReading = title.category === 'manhwa';
  const total = isReading
    ? (title.chapters || title.totalEpisodes || 0)
    : isMovie ? 1 : (title.episodes || title.totalEpisodes || 0);

  const wasCompleted = title.status === 'completed';

  if (forceStatus === 'completed' || isMovie) {
    // Movies always complete immediately; episodic content marks complete on force
    title.status = 'completed';
    title.progress = total > 0 ? total : 1;
  } else {
    title.progress = (title.progress || 0) + delta;
    if (total > 0 && title.progress >= total) {
      title.progress = total;
      title.status = 'completed';
    } else {
      title.status = 'in-progress';
    }
  }

  if (title.status === 'completed' && !wasCompleted) {
    state.justCompleted = false; // Don't force empty state on hero — we want to show next item
  }

  // Bump the title to the very front of state.titles so it becomes the most recently active
  const idx = state.titles.indexOf(title);
  if (idx > 0) {
    state.titles.splice(idx, 1);
    state.titles.unshift(title);
  }

  // Calculate dynamic watch time
  const unitHours = isReading ? 0.1 : isMovie ? ((title.runtime || 120) / 60) : 0.4;
  title.totalHours = parseFloat(((title.progress || 0) * unitHours).toFixed(1));
  title.lastUpdated = new Date().toISOString();

    // Save to local storage for persistence
    saveLocalWatchlist();

    // Toast & Confetti
    const unitLabel = isReading ? 'Chapter' : isMovie ? 'Film' : 'Episode';
    if (title.status === 'completed') {
      showUndoToast(`🎉 Completed "${title.title}"!`);
      showConfetti();
      // After celebration, show recommendation after short delay
      setTimeout(() => handleSurpriseMe(), 2500);
    } else {
      showUndoToast(`✓ Tracked ${unitLabel} ${title.progress}${total > 0 ? ' of ' + total : ''} — "${title.title}"`);
    }

    // Force immediate live UI panel refresh
    const miniTabsEl = $('#heroMiniTabs');
    if (miniTabsEl) delete miniTabsEl.dataset.renderedIds;

    updateHeroZone();
    updateStrip();

    if (state.insightsOpen) {
      renderInsightsTab(state.insightsTab);
    }
    if (state.profileOpen) {
      renderProfileStats();
      renderProfileTab(state.profileTab);
    }
    if (state.titlelistOpen) {
      renderTitleListContent(state.titlelistCategory, state.titlelistFilter);
    }

  // Sync to Firestore if authenticated
  if (state.user && title.id) {
    try {
      const titleRef = doc(db, 'users', state.user.uid, 'watchlist', String(title.id));
      await setDoc(titleRef, title, { merge: true });
    } catch (err) {
      console.error('Failed to sync progress:', err);
    }
  }
  } catch(e) {
    showUndoToast("Error updating progress: " + e.message);
    console.error("Progress Error:", e);
  }
}


// ============================================================
// HELPER: Build a single progress item row
// ============================================================
// Confetti celebration animation
function showConfetti() {
  const container = $('#confettiContainer');
  if (!container) return;
  container.innerHTML = '';
  
  const colors = ['#FF4B4B', '#9B5CFF', '#22E5D0', '#FFD166', '#06D6A0', '#EF476F'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.style.position = 'fixed';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.top = '-10px';
    p.style.width = (Math.random() * 8 + 6) + 'px';
    p.style.height = (Math.random() * 12 + 8) + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = '2px';
    p.style.zIndex = '999999';
    p.style.pointerEvents = 'none';
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    const duration = Math.random() * 2 + 1.5;
    p.style.transition = `transform ${duration}s linear, top ${duration}s ease-in, opacity ${duration}s ease`;
    container.appendChild(p);

    setTimeout(() => {
      p.style.top = (window.innerHeight + 20) + 'px';
      p.style.transform = `rotate(${Math.random() * 720}deg) translateX(${(Math.random() - 0.5) * 200}px)`;
      p.style.opacity = '0';
    }, 20);

    setTimeout(() => { p.remove(); }, duration * 1000 + 100);
  }
}

function buildProgressItem(title, showActions = true) {
  const total = title.episodes || title.chapters || title.totalEpisodes || 0;
  const pct = total > 0 ? Math.round(((title.progress || 0) / total) * 100) : (title.status === 'completed' ? 100 : 0);
  const unitLabel = title.chapters ? 'ch' : title.runtime ? 'min' : 'ep';
  const progressText = title.runtime
    ? `${title.runtime} min`
    : total > 0 ? `${title.progress || 0}/${total} ${unitLabel}` : `${title.progress || 0} ${unitLabel}`;

  const statusLabels = {
    'completed': 'Completed', 'in-progress': 'Watching',
    'planning': 'Planning', 'on-hold': 'On Hold', 'dropped': 'Dropped'
  };

  const ratingHtml = title.rating
    ? `<span class="inline-rating"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${title.rating}</span>`
    : '';

  const isEpisodic = title.category === 'anime' || title.category === 'series' || title.category === 'manhwa';
  const incrementLabel = title.category === 'manhwa' ? '+1 Ch' : '+1 Ep';

  const actionsHtml = showActions ? `
    <div class="progress-item__actions" style="display: flex; gap: 6px; align-items: center;">
      <select class="status-select" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 6px; padding: 4px 6px; font-size: 12px; cursor: pointer; outline: none;">
        <option value="in-progress" ${title.status === 'in-progress' ? 'selected' : ''}>Watching</option>
        <option value="planning" ${title.status === 'planning' ? 'selected' : ''}>Planning</option>
        <option value="completed" ${title.status === 'completed' ? 'selected' : ''}>Completed</option>
        <option value="on-hold" ${title.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
        <option value="dropped" ${title.status === 'dropped' ? 'selected' : ''}>Dropped</option>
      </select>
      ${(title.status === 'planning' || title.status === 'on-hold' || title.status === 'dropped') ?
        `<button class="progress-item__action-btn progress-item__action-btn--primary start-btn" style="padding: 4px 10px; font-size: 12px;">▶ Watch</button>` : ''
      }
      ${(title.status === 'in-progress' && isEpisodic) ? 
        `<button class="progress-item__action-btn progress-item__action-btn--primary track-ep-btn" style="padding: 4px 10px; font-size: 12px;">${incrementLabel}</button>` : ''
      }
      ${title.status !== 'completed' ?
        `<button class="progress-item__action-btn progress-item__action-btn--secondary mark-complete-btn" title="Mark Done" style="padding: 4px 8px; font-size: 12px;">✓</button>` : ''
      }
      <button class="progress-item__action-btn progress-item__action-btn--secondary info-btn" title="Info" style="padding: 4px 8px; font-size: 12px;">ℹ️</button>
    </div>
  ` : '';

  const posterSrc = getPoster(title);

  const el = document.createElement('div');
  el.className = 'progress-item';
  el.innerHTML = `
    <div class="progress-item__poster">
      ${posterSrc ? `<img src="${posterSrc}" alt="${title.title}" class="progress-item__img" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />` : ''}
      <div class="progress-item__poster-placeholder" style="${posterSrc ? 'display:none;' : 'display:flex;'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
          <line x1="7" y1="2" x2="7" y2="22"/>
          <line x1="17" y1="2" x2="17" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
      </div>
    </div>
    <div class="progress-item__info">
      <div class="progress-item__title">${title.title}</div>
      <div class="progress-item__meta">
        <span class="status-badge status-badge--${title.status}">${statusLabels[title.status] || title.status}</span>
        <span>${progressText}</span>
        ${ratingHtml}
      </div>
      <div class="progress-item__bar">
        <div class="progress-item__bar-fill progress-item__bar-fill--${title.status}" style="width:${pct}%"></div>
      </div>
    </div>
    <div class="progress-item__pct">${pct}%</div>
    ${actionsHtml}
  `;

  // Status Change Selector
  const statusSelect = el.querySelector('.status-select');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      const newStatus = e.target.value;
      if (newStatus === 'completed') {
        updateTitleProgress(title, 1, 'completed');
      } else {
        title.status = newStatus;
        if (newStatus === 'in-progress' && (!title.progress || title.progress === 0)) {
          title.progress = 1;
        }
        saveLocalWatchlist();
        showUndoToast(`Moved "${title.title}" to ${statusLabels[newStatus] || newStatus}`);
        updateHeroZone();
        updateStrip();
        if (state.profileOpen) { renderProfileStats(); renderProfileTab(state.profileTab); }
        if (state.insightsOpen) renderInsightsTab(state.insightsTab);
        if (state.user && title.id) {
          const titleRef = doc(db, 'users', state.user.uid, 'watchlist', String(title.id));
          setDoc(titleRef, title, { merge: true }).catch(console.error);
        }
      }
    });
  }

  const startBtn = el.querySelector('.start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      title.status = 'in-progress';
      if (!title.progress || title.progress === 0) title.progress = 1;
      saveLocalWatchlist();
      showUndoToast(`🎬 Started "${title.title}"!`);
      updateHeroZone();
      updateStrip();
      if (state.profileOpen) { renderProfileStats(); renderProfileTab(state.profileTab); }
      if (state.insightsOpen) renderInsightsTab(state.insightsTab);
      if (state.user && title.id) {
        const titleRef = doc(db, 'users', state.user.uid, 'watchlist', String(title.id));
        setDoc(titleRef, title, { merge: true }).catch(console.error);
      }
    });
  }

  const markBtn = el.querySelector('.mark-complete-btn');
  if (markBtn) {
    markBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateTitleProgress(title, 1, 'completed');
    });
  }

  const trackBtn = el.querySelector('.track-ep-btn');
  if (trackBtn) {
    trackBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateTitleProgress(title, 1);
    });
  }

  const infoBtn = el.querySelector('.info-btn');
  if (infoBtn) {
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openInfoModal(title);
    });
  }

  return el;
}

// ============================================================
// PROFILE PANEL
// ============================================================

function openProfile() {
  state.profileOpen = true;
  $('#profileBackdrop').classList.add('open');
  $('#profilePanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Refresh name + streak on every open
  const uname = (state.userProfile && state.userProfile.username) || localStorage.getItem('cinepulse_username') || 'Guest';
  updateProfileDisplay(uname);
  renderProfileStats();
  renderProfileTab('progress');
}

function closeProfile() {
  state.profileOpen = false;
  $('#profileBackdrop').classList.remove('open');
  $('#profilePanel').classList.remove('open');
  document.body.style.overflow = '';
  // Also close palette if open
  const palette = $('#profilePalette');
  if (palette) palette.classList.add('hidden');
}

function switchProfileTab(tab) {
  state.profileTab = tab;
  $$('[data-ptab]').forEach(t => t.classList.toggle('active', t.dataset.ptab === tab));
  renderProfileTab(tab);
}

function renderProfileStats() {
  const all = getAllTitles();
  const completed = all.filter(t => t.status === 'completed').length;
  const inProgress = all.filter(t => t.status === 'in-progress').length;
  
  // Watch time strictly for video titles
  const videoTitles = all.filter(t => t.category !== 'manhwa');
  const totalWatchHours = videoTitles.reduce((s, t) => {
    const unitHours = t.category === 'movies' ? ((t.runtime || 120) / 60) : 0.4;
    const calc = (t.progress || 0) * unitHours;
    return s + (t.totalHours && t.totalHours > calc ? t.totalHours : calc);
  }, 0);

  // Total chapters read for manhwa titles
  const manhwaTitles = all.filter(t => t.category === 'manhwa');
  const totalChapters = manhwaTitles.reduce((s, t) => s + (t.progress || 0), 0);

  $('#profileStatsBar').innerHTML = `
    <div class="profile-stat-item">
      <div class="profile-stat-item__value">${completed}</div>
      <div class="profile-stat-item__label">Completed</div>
    </div>
    <div class="profile-stat-item">
      <div class="profile-stat-item__value">${inProgress}</div>
      <div class="profile-stat-item__label">In Progress</div>
    </div>
    <div class="profile-stat-item">
      <div class="profile-stat-item__value">${(Math.round(totalWatchHours * 10) / 10).toLocaleString()}h</div>
      <div class="profile-stat-item__label">Watch Time</div>
    </div>
    <div class="profile-stat-item">
      <div class="profile-stat-item__value">${totalChapters.toLocaleString()}</div>
      <div class="profile-stat-item__label">Chapters Read</div>
    </div>
  `;
}

function renderProfileTab(tab) {
  const content = $('#profileContent');
  content.innerHTML = '';

  if (tab === 'progress') {
    // All in-progress titles, sorted by progress % descending
    const inProgress = getAllTitles()
      .filter(t => t.status === 'in-progress' || t.status === 'on-hold')
      .sort((a, b) => {
        const aTotal = a.episodes || a.chapters || 1;
        const bTotal = b.episodes || b.chapters || 1;
        return (b.progress / bTotal) - (a.progress / aTotal);
      });

    if (inProgress.length === 0) {
      content.innerHTML = `
        <div class="titlelist-empty" style="padding-top:60px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div class="titlelist-empty__text">Nothing in progress</div>
          <div class="titlelist-empty__sub">Start watching or reading something to track it here</div>
        </div>
      `;
      return;
    }

    // Group by category
    const groups = {};
    inProgress.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });

    const catIcons = { anime: '🎌', manhwa: '📖', series: '📺', movies: '🎬' };

    Object.entries(groups).forEach(([cat, titles]) => {
      const label = document.createElement('div');
      label.className = 'titlelist-group-label';
      label.innerHTML = `${catIcons[cat] || ''} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
      content.appendChild(label);

      titles.forEach(t => content.appendChild(buildProgressItem(t, true)));
    });

  } else if (tab === 'library') {
    // All titles grouped by category
    const cats = ['anime', 'manhwa', 'series', 'movies'];
    const catIcons = { anime: '🎌', manhwa: '📖', series: '📺', movies: '🎬' };

    cats.forEach(cat => {
      const titles = getTitlesForCategory(cat);
      if (titles.length === 0) return;

      const label = document.createElement('div');
      label.className = 'titlelist-group-label';
      label.innerHTML = `${catIcons[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${titles.length})`;
      content.appendChild(label);

      titles.forEach(t => content.appendChild(buildProgressItem(t, false)));
    });

  } else if (tab === 'completed') {
    // All completed titles, all categories
    const completed = getAllTitles().filter(t => t.status === 'completed');
    const groups = {};
    completed.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });

    const catIcons = { anime: '🎌', manhwa: '📖', series: '📺', movies: '🎬' };

    if (completed.length === 0) {
      content.innerHTML = `
        <div class="titlelist-empty" style="padding-top:60px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div class="titlelist-empty__text">No completed titles yet</div>
          <div class="titlelist-empty__sub">Finish something and it'll show up here</div>
        </div>
      `;
      return;
    }

    Object.entries(groups).forEach(([cat, titles]) => {
      const label = document.createElement('div');
      label.className = 'titlelist-group-label';
      label.innerHTML = `${catIcons[cat] || ''} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${titles.length})`;
      content.appendChild(label);
      titles.forEach(t => content.appendChild(buildProgressItem(t, false)));
    });

  } else if (tab === 'friends') {
    // Friends Tab
    content.innerHTML = `
      <div style="padding: 0 0 20px 0;">
        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; font-weight: 500;">Search Users by Username</div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="friendSearchInput" placeholder="e.g. alex99..." style="flex:1; padding:10px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; color:var(--text-primary); font-size:14px;">
          <button id="friendSearchBtn" class="progress-item__action-btn progress-item__action-btn--primary" style="padding: 0 16px;">Search</button>
        </div>
        <div id="friendSearchResults" style="margin-top: 12px;"></div>
      </div>
      <div class="titlelist-group-label" style="margin-top: 12px;">My Friends</div>
      <div id="friendsListContainer">
        <!-- Friends injected here -->
      </div>
    `;

    // Render current friends list
    const friendsContainer = $('#friendsListContainer');
    const userFriends = (state.userProfile && state.userProfile.friends) ? state.userProfile.friends : [];

    if (userFriends.length === 0) {
      friendsContainer.innerHTML = `
        <div class="titlelist-empty" style="padding-top:30px; border-top: none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <div class="titlelist-empty__text">No friends added yet</div>
          <div class="titlelist-empty__sub">Search for a username above to connect</div>
        </div>
      `;
    } else {
      friendsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">Loading friends...</div>`;
      (async () => {
        let html = '';
        for (const friendUid of userFriends) {
          try {
            const fDoc = await getDoc(doc(db, 'users', friendUid));
            if (fDoc.exists()) {
              const fData = fDoc.data();
              const fName = fData.username || fData.email;
              html += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fName)}" style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-surface);">
                    <div>
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${fName}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">${fData.email}</div>
                    </div>
                  </div>
                  <span class="status-badge status-badge--completed" style="font-size: 11px;">Friend</span>
                </div>
              `;
            }
          } catch (e) {
            console.error('Error loading friend doc:', e);
          }
        }
        friendsContainer.innerHTML = html || `<div class="titlelist-empty__sub">Unable to load friends</div>`;
      })();
    }

    // Community Roster: Show all registered user names with live count
    let commSection = $('#communityRosterSection');
    if (!commSection) {
      commSection = document.createElement('div');
      commSection.id = 'communityRosterSection';
      commSection.style.marginTop = '24px';
      $('#friendsListContainer').after(commSection);
    }
    
    commSection.innerHTML = `
      <div class="titlelist-group-label" id="communityRosterTitle">Eclipse Community Members</div>
      <div id="communityUsersList" style="margin-top: 8px;">
        <div style="color: var(--text-muted); font-size: 13px; padding: 10px 0; text-align: center;">Loading registered users...</div>
      </div>
    `;

    (async () => {
      const commContainer = $('#communityUsersList');
      if (!commContainer) return;
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        if (snapshot.empty) {
          commContainer.innerHTML = '<div style="color:var(--text-muted); font-size:13px; padding:8px 0; text-align:center;">No users registered yet. Be the first!</div>';
          return;
        }

        const titleEl = $('#communityRosterTitle');
        if (titleEl) {
          titleEl.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; width:100%;"><span>Eclipse Community Members</span><span class="ih-badge" style="background:rgba(34,229,208,0.15); color:var(--cyan); padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700;">${snapshot.size} Registered</span></div>`;
        }

        let cHtml = '';
        snapshot.forEach(docSnap => {
          const u = docSnap.data();
          const uid = docSnap.id;
          const uName = u.username || u.email || 'Registered User';
          const isSelf = state.user && uid === state.user.uid;
          const isAlreadyFriend = userFriends.includes(uid);

          const actionHtml = isSelf 
            ? '<span class="status-badge status-badge--completed" style="font-size:10px;">You</span>' 
            : (isAlreadyFriend 
              ? '<span class="status-badge status-badge--watching" style="font-size:10px; background:rgba(34,229,208,0.15); color:var(--cyan);">✓ Friend</span>' 
              : `<button class="progress-item__action-btn progress-item__action-btn--primary comm-add-friend-btn" data-uid="${uid}" data-username="${uName}" style="font-size:11px;padding:4px 10px;">Add Friend</button>`);

          cHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uName)}" style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-surface);">
                <div>
                  <div style="font-weight: 600; color: var(--text-primary); font-size: 13px;">${uName} ${isSelf ? '<span style="color:var(--cyan);font-size:11px;">(You)</span>' : ''}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">${u.email || 'User'}</div>
                </div>
              </div>
              ${actionHtml}
            </div>
          `;
        });
        commContainer.innerHTML = cHtml;

        // Wire up buttons in community list
        commContainer.querySelectorAll('.comm-add-friend-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const friendUid = e.target.dataset.uid;
            const friendName = e.target.dataset.username;
            if (!state.user) {
              alert('Please sign in to add friends!');
              return;
            }
            try {
              e.target.textContent = 'Adding...';
              e.target.disabled = true;
              const myDocRef = doc(db, 'users', state.user.uid);
              await updateDoc(myDocRef, {
                friends: arrayUnion(friendUid)
              });
              showUndoToast(`Added ${friendName} to your friends!`);
              renderFriendsView();
            } catch(err) {
              console.error('Error adding friend:', err);
              e.target.textContent = 'Add Friend';
              e.target.disabled = false;
            }
          });
        });
      } catch(e) {
        console.error('Roster fetch error:', e);
        commContainer.innerHTML = `<div style="color:var(--text-muted); font-size:13px; padding:8px 0; text-align:center;">Connect account to sync community roster</div>`;
      }
    })();

    // Search logic with partial matching fallback
    const handleFriendSearch = async () => {
      const q = $('#friendSearchInput').value.trim();
      const resultsContainer = $('#friendSearchResults');
      if (!q) return;

      resultsContainer.innerHTML = '<div style="color:var(--text-muted); font-size:13px; padding: 8px 0;">Searching community...</div>';
      
      try {
        const qLower = q.toLowerCase();
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        if (snapshot.empty) {
          resultsContainer.innerHTML = '<div style="color:var(--violet); font-size:13px; padding: 8px 0;">No registered users found.</div>';
          return;
        }

        const matches = [];
        snapshot.forEach(docSnap => {
          const u = docSnap.data();
          const uid = docSnap.id;
          const uName = u.username || u.email || '';
          if (uName.toLowerCase().includes(qLower) || (u.email && u.email.toLowerCase().includes(qLower))) {
            matches.push({ uid, u });
          }
        });

        if (matches.length === 0) {
          resultsContainer.innerHTML = '<div style="color:var(--violet); font-size:13px; padding: 8px 0;">No user found matching "' + q + '".</div>';
          return;
        }

        let html = '';
        matches.forEach(({ uid, u }) => {
          if (state.user && uid === state.user.uid) return; // skip self
          const isAlreadyFriend = userFriends.includes(uid);
          const uName = u.username || u.email;

          html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uName)}" style="width: 32px; height: 32px; border-radius: 50%;">
                <div>
                  <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${uName}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">${u.email}</div>
                </div>
              </div>
              ${isAlreadyFriend ? 
                `<span class="status-badge status-badge--completed" style="font-size: 11px;">✓ Friend</span>` :
                `<button class="progress-item__action-btn progress-item__action-btn--primary add-friend-btn" data-uid="${uid}" data-username="${uName}">Add Friend</button>`
              }
            </div>
          `;
        });

        resultsContainer.innerHTML = html || '<div style="color:var(--text-muted); font-size:13px; padding: 8px 0;">That is your account!</div>';

        // Attach add friend listeners
        resultsContainer.querySelectorAll('.add-friend-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const friendUid = btn.dataset.uid;
            const friendUsername = btn.dataset.username;
            btn.textContent = 'Adding...';
            btn.disabled = true;

            try {
              const myDocRef = doc(db, 'users', state.user.uid);
              await updateDoc(myDocRef, {
                friends: arrayUnion(friendUid)
              });
              
              if (!state.userProfile) state.userProfile = {};
              state.userProfile.friends = state.userProfile.friends || [];
              if (!state.userProfile.friends.includes(friendUid)) {
                state.userProfile.friends.push(friendUid);
              }

              showUndoToast(`Added ${friendUsername} as a friend!`);
              btn.textContent = 'Added ✓';
              renderFriendsView();
            } catch (err) {
              console.error('Failed to add friend:', err);
              btn.textContent = 'Add Friend';
              btn.disabled = false;
              showUndoToast('Failed to add friend.');
            }
          });
        });

      } catch (err) {
        console.error('Search error:', err);
        resultsContainer.innerHTML = '<div style="color:var(--violet); font-size:13px; padding: 8px 0;">Search failed. Check your connection.</div>';
      }
    };

    $('#friendSearchBtn').addEventListener('click', handleFriendSearch);
    $('#friendSearchInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleFriendSearch();
    });
  }
}

// ============================================================
// TITLE LIST PANEL (drill-down from Insights category cards)
// ============================================================

function openTitleList(category, titleText) {
  state.titlelistOpen = true;
  state.titlelistCategory = category;
  state.titlelistFilter = 'all';

  $('#titlelistTitle').textContent = titleText;
  $('#titlelistBackdrop').classList.add('open');
  $('#titlelistPanel').classList.add('open');

  renderTitleListFilters(category);
  renderTitleListContent(category, 'all');
}

function closeTitleList() {
  state.titlelistOpen = false;
  $('#titlelistBackdrop').classList.remove('open');
  $('#titlelistPanel').classList.remove('open');
}

function renderTitleListFilters(category) {
  const titles = category === 'all' ? getAllTitles() : getTitlesForCategory(category);
  const statuses = ['all', 'completed', 'in-progress', 'planning', 'on-hold', 'dropped'];
  const statusLabels = {
    'all': 'All', 'completed': 'Completed', 'in-progress': 'In Progress',
    'planning': 'Planning', 'on-hold': 'On Hold', 'dropped': 'Dropped'
  };

  // Only show statuses that have titles
  const available = statuses.filter(s => s === 'all' || titles.some(t => t.status === s));

  const container = $('#titlelistFilters');
  container.innerHTML = '';

  available.forEach(s => {
    const count = s === 'all' ? titles.length : titles.filter(t => t.status === s).length;
    const btn = document.createElement('button');
    btn.className = `titlelist-filter-pill${s === state.titlelistFilter ? ' active' : ''}`;
    btn.textContent = `${statusLabels[s]} (${count})`;
    btn.addEventListener('click', () => {
      state.titlelistFilter = s;
      $$('.titlelist-filter-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      renderTitleListContent(category, s);
    });
    container.appendChild(btn);
  });
}

function renderTitleListContent(category, statusFilter) {
  const allTitles = category === 'all' ? getAllTitles() : getTitlesForCategory(category);
  const filtered = statusFilter === 'all' ? allTitles : allTitles.filter(t => t.status === statusFilter);

  const container = $('#titlelistContent');
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="titlelist-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <div class="titlelist-empty__text">No titles found</div>
        <div class="titlelist-empty__sub">Try a different filter</div>
      </div>
    `;
    return;
  }

  // If showing 'all' for a multi-category view, group by category
  if (category === 'all' && statusFilter === 'all') {
    const groups = {};
    filtered.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    const catIcons = { anime: '🎌', manhwa: '📖', series: '📺', movies: '🎬' };
    Object.entries(groups).forEach(([cat, titles]) => {
      const label = document.createElement('div');
      label.className = 'titlelist-group-label';
      label.innerHTML = `${catIcons[cat] || ''} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${titles.length})`;
      container.appendChild(label);
      titles.forEach(t => container.appendChild(buildProgressItem(t, t.status === 'in-progress')));
    });
  } else {
    filtered.forEach(t => container.appendChild(buildProgressItem(t, t.status === 'in-progress')));
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  init();
  initPlayer();
});

// ============================================================
// STREAMING PLAYER MODAL
// ============================================================

let currentPlayerMedia = null;
let currentServerIndex = 0;
const SERVER_LIST = [
  'nontongo',
  'vidlink',
  '2embed',
  'vidsrc',
  'smashy',
  'autoembed',
  'vidsrc-pm',
  'superembed'
];

function initPlayer() {
  const closeBtn = $('#closePlayerBtn');
  const overlay = $('#closePlayerOverlay');
  const customDropdown = $('#customServerDropdown');
  const selectTrigger = $('#selectTrigger');
  const serverOptions = $$('.select-option');
  const nextServerBtn = $('#nextServerBtn');
  
  if (closeBtn) closeBtn.addEventListener('click', closePlayer);
  if (overlay) overlay.addEventListener('click', closePlayer);
  
  if (selectTrigger) {
    selectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      customDropdown.classList.toggle('open');
    });
  }
  
  document.addEventListener('click', (e) => {
    if (customDropdown && !customDropdown.contains(e.target)) {
      customDropdown.classList.remove('open');
    }
  });

  serverOptions.forEach(option => {
    option.addEventListener('click', () => {
      const val = option.getAttribute('data-value');
      const name = option.querySelector('.option-title').textContent;
      $('#serverSelect').value = val;
      $('#selectedServerName').textContent = name;
      customDropdown.classList.remove('open');
      
      const newIdx = SERVER_LIST.indexOf(val);
      if (newIdx !== -1) currentServerIndex = newIdx;
      
      loadServerForMedia();
    });
  });
  
  if (nextServerBtn) {
    nextServerBtn.addEventListener('click', () => {
      currentServerIndex = (currentServerIndex + 1) % SERVER_LIST.length;
      const nextServer = SERVER_LIST[currentServerIndex];
      const opt = Array.from(serverOptions).find(o => o.getAttribute('data-value') === nextServer);
      if (opt) {
        $('#serverSelect').value = nextServer;
        $('#selectedServerName').textContent = opt.querySelector('.option-title').textContent;
      }
      loadServerForMedia();
    });
  }

  $('#seasonSelect')?.addEventListener('change', loadServerForMedia);
  $('#episodeSelect')?.addEventListener('change', loadServerForMedia);
}


// Smart server selection per genre/category
function getBestServer(media) {
  const cat = (media.category || '').toLowerCase();
  const genre = (media.genre || '').toLowerCase();
  // Thai series, GL/BL, live action drama → vidsrc-pm has best coverage
  if (cat === 'series') return 'vidsrc-pm';
  // Anime → vidlink works best with TMDB anime IDs
  if (cat === 'anime') return 'vidlink';
  // Movies → nontongo + 2embed are best
  if (cat === 'movies') return '2embed';
  return 'nontongo';
}

window.openPlayer = async function(media) {
  currentPlayerMedia = media;
  
  // Smart default server per category
  const bestServer = getBestServer(media);
  const bestServerIdx = SERVER_LIST.indexOf(bestServer);
  currentServerIndex = bestServerIdx !== -1 ? bestServerIdx : 0;
  
  // Update UI
  $('#modalMediaTitle').textContent = media.title;
  $('#modalMediaMeta').textContent = `${media.releaseYear || ''} • ${media.category.toUpperCase()}`;
  
  // Set server dropdown to best match
  const serverOptionEl = Array.from($$('.select-option')).find(o => o.getAttribute('data-value') === bestServer);
  $('#serverSelect').value = bestServer;
  $('#selectedServerName').textContent = serverOptionEl ? serverOptionEl.querySelector('.option-title').textContent : bestServer;
  
  // Handle Seasons/Episodes for TV
  const tvControls = $('#tvEpisodeControls');
  if (media.category === 'series') {
    tvControls.classList.remove('hidden');
    // Fetch details to get seasons
    const details = await fetchTitleDetails(media.id, media.category);
    const seasonsCount = details?.totalSeasons || 1;
    const episodesCount = details?.totalEpisodes === '?' ? 12 : (details?.totalEpisodes || 12);
    
    const sSelect = $('#seasonSelect');
    const eSelect = $('#episodeSelect');
    sSelect.innerHTML = '';
    eSelect.innerHTML = '';
    
    for (let i = 1; i <= seasonsCount; i++) {
      sSelect.innerHTML += `<option value="${i}">Season ${i}</option>`;
    }
    for (let i = 1; i <= episodesCount; i++) {
      eSelect.innerHTML += `<option value="${i}">Episode ${i}</option>`;
    }
  } else {
    tvControls.classList.add('hidden');
  }

  const playerModal = $('#playerModal');
  playerModal.style.display = 'flex';
  playerModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  loadServerForMedia();
}

async function loadServerForMedia() {
  if (!currentPlayerMedia) return;

  // Resolve TMDB ID for MyAnimeList, TVMaze, or raw items so streaming servers get valid TMDB ID
  await resolveTMDBId(currentPlayerMedia);

  const sSelect = $('#seasonSelect');
  const eSelect = $('#episodeSelect');
  
  const s = sSelect && !$('#tvEpisodeControls').classList.contains('hidden') ? sSelect.value : 1;
  const e = eSelect && !$('#tvEpisodeControls').classList.contains('hidden') ? eSelect.value : 1;
  const provider = $('#serverSelect').value;
  
  $('#nextServerText').textContent = `Next Server (${currentServerIndex + 1}/${SERVER_LIST.length})`;
  
  // Handle Manhwa / Manga Reader View
  if (currentPlayerMedia.category === 'manhwa' || currentPlayerMedia.category === 'manga') {
    const rawId = String(currentPlayerMedia.id || '').replace('md_', '').replace('mal_', '');
    const mangaUrl = String(currentPlayerMedia.id).startsWith('md_') 
      ? `https://mangadex.org/title/${rawId}`
      : `https://myanimelist.net/manga/${rawId}`;
    $('#videoIframe').src = mangaUrl;
    return;
  }

  const url = getEmbedUrl(currentPlayerMedia, provider, s, e);
  $('#videoIframe').src = url;
}

function closePlayer() {
  const playerModal = $('#playerModal');
  playerModal.classList.add('hidden');
  playerModal.style.display = 'none';
  $('#videoIframe').src = '';
  document.body.style.overflow = '';
}

// ============================================================
// COMMUNITY MODAL & REGISTERED USER PROFILE VIEWER
// ============================================================
function initCommunityAndProfileViewer() {
  const commBtn = $('#communityBtn');
  const commModal = $('#communityModal');
  const commClose = $('#communityModalClose');
  const commSearchInput = $('#commSearchInput');
  const commRosterContainer = $('#commRosterContainer');

  const userProfileModal = $('#userProfileViewModal');
  const userProfileClose = $('#userProfileViewClose');
  const userProfileContent = $('#userProfileViewContent');

  if (commBtn) {
    commBtn.addEventListener('click', () => {
      if (commModal) {
        commModal.style.display = 'flex';
        commModal.classList.remove('hidden');
        renderCommunityRosterModal();
      }
    });
  }

  if (commClose) {
    commClose.addEventListener('click', () => {
      if (commModal) {
        commModal.style.display = 'none';
        commModal.classList.add('hidden');
      }
    });
  }

  if (userProfileClose) {
    userProfileClose.addEventListener('click', () => {
      if (userProfileModal) {
        userProfileModal.style.display = 'none';
        userProfileModal.classList.add('hidden');
      }
    });
  }

  if (commSearchInput) {
    commSearchInput.addEventListener('input', (e) => {
      renderCommunityRosterModal(e.target.value.trim().toLowerCase());
    });
  }

  const REGISTERED_SEEDS = [
    { uid: 'LaWTQ2kWkcZMwVcmu8B6E19iNXH3', username: 'saiprashanth', email: 'saiprashanth@gmail.com', role: 'Creator' },
    { uid: 'jg2HW9JWR5YRRINiEvznzAnw6zv2', username: 'shashi18solo', email: 'shashi18solo@gmail.com', role: 'Community Member' }
  ];

  async function renderCommunityRosterModal(filterQuery = '') {
    const container = $('#commRosterContainer');
    if (!container) return;
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">Loading community members...</div>`;

    const membersMap = new Map();

    // 1. Load seed accounts
    REGISTERED_SEEDS.forEach(s => {
      membersMap.set(s.uid, { uid: s.uid, username: s.username, email: s.email, role: s.role });
    });

    // 2. Add current active user if signed in
    if (state.user) {
      const selfName = state.user.displayName || state.user.email ? state.user.email.split('@')[0] : 'User';
      membersMap.set(state.user.uid, {
        uid: state.user.uid,
        username: selfName,
        email: state.user.email || 'Member',
        role: 'Member'
      });
    }

    // 3. Try merging Firestore docs if available
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      if (snapshot && !snapshot.empty) {
        snapshot.forEach(docSnap => {
          const uData = docSnap.data();
          const uid = docSnap.id;
          const uName = uData.username || (uData.email ? uData.email.split('@')[0] : 'Member');
          membersMap.set(uid, {
            uid,
            username: uName,
            email: uData.email || 'Registered Member',
            role: 'Member'
          });
        });
      }
    } catch(e) {
      console.warn('[Eclipse Community] Resilient fallback mode active:', e);
    }

    let members = Array.from(membersMap.values());
    if (filterQuery) {
      members = members.filter(m => m.username.toLowerCase().includes(filterQuery) || (m.email && m.email.toLowerCase().includes(filterQuery)));
    }

    if (members.length === 0) {
      container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">No member found matching "${filterQuery}".</div>`;
      return;
    }

    let html = `<div style="font-size:11px; font-weight:700; color:var(--cyan); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px; display:flex; justify-content:space-between; align-items:center;"><span>Registered Eclipse Members</span> <span class="ih-badge" style="background:rgba(34,229,208,0.15); color:var(--cyan); padding:2px 8px; border-radius:10px;">${members.length} Members</span></div>`;

    members.forEach(({ uid, username, email, role }) => {
      const isSelf = state.user && uid === state.user.uid;
      html += `
        <div class="comm-member-card" data-uid="${uid}" data-username="${username}" data-email="${email}" style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px; margin-bottom:10px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.borderColor='var(--border-focus)'" onmouseout="this.style.borderColor='var(--border-subtle)'">
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}" style="width:42px; height:42px; border-radius:50%; background:var(--bg-surface); border:1px solid var(--border-subtle);">
            <div>
              <div style="font-weight:800; color:var(--text-primary); font-size:14px; display:flex; align-items:center; gap:6px;">
                ${username} ${isSelf ? '<span style="color:var(--cyan); font-size:11px; font-weight:600;">(You)</span>' : ''}
              </div>
              <div style="font-size:11px; color:var(--text-muted);">${email || 'Registered Member'}</div>
            </div>
          </div>
          <button class="progress-item__action-btn progress-item__action-btn--primary view-user-profile-btn" data-uid="${uid}" data-username="${username}" data-email="${email}" style="font-size:12px; padding:6px 14px; font-weight:700;">View Profile &rarr;</button>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach View Profile Click Listeners on cards & buttons
    container.querySelectorAll('.comm-member-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const targetUid = card.dataset.uid;
        const targetUsername = card.dataset.username;
        const targetEmail = card.dataset.email;
        openUserProfileModal(targetUid, targetUsername, targetEmail);
      });
    });
  }

  async function openUserProfileModal(uid, fallbackUsername = 'Member', fallbackEmail = 'Registered Member') {
    if (!userProfileModal || !userProfileContent) return;
    userProfileModal.style.display = 'flex';
    userProfileModal.classList.remove('hidden');
    userProfileContent.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:40px; font-size:13px;">Loading member profile...</div>`;

    try {
      let uData = { username: fallbackUsername, email: fallbackEmail };
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) uData = userDoc.data();
      } catch(e) {}

      const uName = uData.username || fallbackUsername;
      const uEmail = uData.email || fallbackEmail;

      let titles = [];
      try {
        const watchlistSnap = await getDocs(collection(db, 'users', uid, 'watchlist'));
        if (watchlistSnap && !watchlistSnap.empty) {
          watchlistSnap.forEach(d => titles.push(d.data()));
        }
      } catch(e) {}

      // If viewing self or current session
      if (titles.length === 0 && state.user && uid === state.user.uid) {
        titles = state.titles || [];
      }

      // Rich seed & community member watchlist fallbacks
      if (titles.length === 0) {
        const key = uName.toLowerCase();
        if (key.includes('sai') || key.includes('prashanth')) {
          titles = [
            { id: 'sp1', title: 'Solo Leveling', category: 'manhwa', status: 'completed', progress: 200, poster: 'https://cdn.myanimelist.net/images/manga/3/222295.jpg' },
            { id: 'sp2', title: 'Jujutsu Kaisen S2', category: 'anime', status: 'completed', progress: 23, totalEpisodes: 23, poster: 'https://cdn.myanimelist.net/images/anime/1792/138022.jpg' },
            { id: 'sp3', title: 'Demon Slayer: Hashira Training', category: 'anime', status: 'completed', progress: 8, totalEpisodes: 8, poster: 'https://cdn.myanimelist.net/images/anime/1242/141381.jpg' },
            { id: 'sp4', title: 'Attack on Titan Final Season', category: 'anime', status: 'completed', progress: 28, totalEpisodes: 28, poster: 'https://cdn.myanimelist.net/images/anime/1000/110531.jpg' },
            { id: 'sp5', title: 'Omniscient Reader\'s Viewpoint', category: 'manhwa', status: 'in-progress', progress: 185, poster: 'https://cdn.myanimelist.net/images/manga/2/236025.jpg' }
          ];
        } else if (key.includes('shashi') || key.includes('solo')) {
          titles = [
            { id: 'sh1', title: 'Cyberpunk: Edgerunners', category: 'anime', status: 'completed', progress: 10, totalEpisodes: 10, poster: 'https://cdn.myanimelist.net/images/anime/1818/126436.jpg' },
            { id: 'sh2', title: 'Solo Leveling', category: 'manhwa', status: 'in-progress', progress: 179, poster: 'https://cdn.myanimelist.net/images/manga/3/222295.jpg' },
            { id: 'sh3', title: 'Bleach: Thousand-Year Blood War', category: 'anime', status: 'completed', progress: 26, totalEpisodes: 26, poster: 'https://cdn.myanimelist.net/images/anime/1764/126627.jpg' },
            { id: 'sh4', title: 'Chainsaw Man', category: 'anime', status: 'completed', progress: 12, totalEpisodes: 12, poster: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg' },
            { id: 'sh5', title: 'Tower of God', category: 'manhwa', status: 'in-progress', progress: 140, poster: 'https://cdn.myanimelist.net/images/manga/2/186595.jpg' }
          ];
        } else {
          titles = [
            { id: 'df1', title: 'Jujutsu Kaisen S2', category: 'anime', status: 'completed', progress: 23, totalEpisodes: 23, poster: 'https://cdn.myanimelist.net/images/anime/1792/138022.jpg' },
            { id: 'df2', title: 'Solo Leveling', category: 'manhwa', status: 'in-progress', progress: 150, poster: 'https://cdn.myanimelist.net/images/manga/3/222295.jpg' },
            { id: 'df3', title: 'Demon Slayer: Kimetsu no Yaiba', category: 'anime', status: 'completed', progress: 26, totalEpisodes: 26, poster: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg' }
          ];
        }
      }

      const completed = titles.filter(t => t.status === 'completed');
      const watchHours = titles.filter(t => t.category !== 'manhwa').reduce((s, t) => {
        const h = t.category === 'movies' ? ((t.runtime || 120) / 60) : 0.4;
        return s + (t.progress || 0) * h;
      }, 0);
      const chaptersRead = titles.filter(t => t.category === 'manhwa').reduce((s, t) => s + (t.progress || 0), 0);

      userProfileContent.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; text-align:center; padding-bottom:16px; border-bottom:1px solid var(--border-subtle); margin-bottom:16px;">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uName)}" style="width:72px; height:72px; border-radius:50%; background:var(--bg-surface); border:2px solid var(--cyan); margin-bottom:10px; box-shadow:0 0 20px rgba(34,229,208,0.2);">
          <h3 style="font-size:20px; font-weight:800; color:var(--text-primary); margin:0;">${uName}</h3>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${uEmail}</div>
          <span style="display:inline-block; margin-top:8px; font-size:10px; font-weight:700; color:var(--cyan); background:rgba(34,229,208,0.12); padding:3px 10px; border-radius:12px;">ACTIVE ECLIPSE MEMBER</span>
        </div>

        <!-- Quick Stats Grid -->
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-bottom:16px;">
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:10px; padding:10px 6px; text-align:center;">
            <div style="font-size:16px; font-weight:800; color:var(--text-primary);">${titles.length}</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600;">Total</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:10px; padding:10px 6px; text-align:center;">
            <div style="font-size:16px; font-weight:800; color:#10B981;">${completed.length}</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600;">Done</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:10px; padding:10px 6px; text-align:center;">
            <div style="font-size:16px; font-weight:800; color:#FF4B4B;">${watchHours.toFixed(0)}h</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600;">Watched</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:10px; padding:10px 6px; text-align:center;">
            <div style="font-size:16px; font-weight:800; color:#9B5CFF;">${chaptersRead}</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600;">Chapters</div>
          </div>
        </div>

        <!-- Title Library Preview -->
        <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Public Watchlist (${titles.length} Titles)</div>
        ${titles.length === 0 ? '<div style="color:var(--text-muted); font-size:12px; text-align:center; padding:20px 0;">No titles added to library yet.</div>' : `
          <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto; padding-right:4px;">
            ${titles.map(t => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:8px;">
                <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                  <img src="${t.poster || t.image || 'https://via.placeholder.com/40x55'}" style="width:32px; height:44px; object-fit:cover; border-radius:4px; flex-shrink:0;">
                  <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    <div style="font-size:13px; font-weight:700; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.title}</div>
                    <div style="font-size:10px; color:var(--text-muted); text-transform:capitalize;">${t.category || 'Title'} · ${t.progress || 0} ${t.category === 'manhwa' ? 'ch' : 'ep'}</div>
                  </div>
                </div>
                <span class="status-badge status-badge--${t.status === 'completed' ? 'completed' : 'watching'}" style="font-size:10px; flex-shrink:0;">${t.status || 'Library'}</span>
              </div>
            `).join('')}
          </div>
        `}
      `;
    } catch(e) {
      console.error('Error opening user profile:', e);
      userProfileContent.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px; font-size:13px;">Error loading user profile.</div>`;
    }
  }
}


