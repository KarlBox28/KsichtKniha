//js/user-detail.js
import { apiGet } from './api.js';
import { requireAuth, esc, calcAge, genderLabel, avatarHTML } from './utils.js';
import { renderNav } from './nav.js';
import { fetchPosts, renderPosts, attachPostListeners } from './posts.js';

requireAuth();
renderNav('users');

const userId    = new URLSearchParams(location.search).get('id');
const container = document.getElementById('detail-container');

if (!userId) {
  container.innerHTML = '<div class="form-error" style="display:block">Chybí ID uživatele.</div>';
} else {
  loadDetail();
}

async function loadDetail() {
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const [user, allPostsRaw] = await Promise.all([
      apiGet(`/api/user-info?id=${userId}`),
      fetchPosts(),
    ]);

    const uid        = user.id ?? Number(userId);
    const userPosts  = allPostsRaw.filter(p => (p.user_id ?? p.autor_id) == uid);
    const likedPosts = allPostsRaw.filter(p =>
      p.liked_by_user_id == uid || (p.likers ?? []).includes(uid)
    );
    const commentedPosts = allPostsRaw.filter(p =>
      (p.comments ?? []).some(c => (c.user_id ?? c.autor_id) == uid)
    );

    // Merge all related posts (deduplicated by id)
    const relatedMap = new Map();
    [...userPosts, ...likedPosts, ...commentedPosts].forEach(p => relatedMap.set(p.id, p));
    const relatedPosts = [...relatedMap.values()];

    renderDetail(user, userPosts, relatedPosts);
  } catch (e) {
    container.innerHTML = `
      <div class="form-error" style="display:block">Chyba při načítání: ${e.message}</div>`;
  }
}

function renderDetail(user, userPosts, relatedPosts) {
  const initials = ((user.jmeno?.[0] ?? '?') + (user.prijmeni?.[0] ?? '')).toUpperCase();
  const avatarEl = user.avatar
    ? `<img class="user-detail-avatar" src="/api/static/${esc(user.avatar)}"
           alt="${initials}"
           onerror="this.outerHTML='<div class=\\'user-detail-avatar\\'>${initials}</div>'">`
    : `<div class="user-detail-avatar">${initials}</div>`;

  const age    = user.vek ?? calcAge(user.datum_narozeni);
  const gender = genderLabel(user.pohlavi);

  container.innerHTML = `
    <div class="user-detail-header">
      ${avatarEl}
      <div class="user-detail-info">
        <div class="user-detail-name">${esc(user.jmeno ?? '')} ${esc(user.prijmeni ?? '')}</div>
        <div class="user-detail-meta">
          @${esc(user.username ?? '')}
          ${gender ? ` · ${gender}` : ''}
          ${age    ? ` · ${age} let` : ''}
        </div>
        <div class="user-detail-stats">
          <div class="stat-pill"><strong>${userPosts.length}</strong> příspěvků</div>
          <div class="stat-pill"><strong>${relatedPosts.length}</strong> aktivit celkem</div>
        </div>
      </div>
    </div>

    <div class="section-title">📝 Aktivita uživatele</div>

    <div class="tabs">
      <button class="tab-btn active" id="tab-own">
        Příspěvky (${userPosts.length})
      </button>
      <button class="tab-btn" id="tab-all">
        Veškerá aktivita (${relatedPosts.length})
      </button>
    </div>

    <div id="tab-content"></div>`;

  // Tab switching
  const tabContent = document.getElementById('tab-content');

  function showTab(posts) {
    if (!posts.length) {
      tabContent.innerHTML = `
        <div class="empty-state">
          <span class="icon">📭</span><p>Žádná aktivita</p>
        </div>`;
      return;
    }
    tabContent.innerHTML = posts.map(p => {
      // inline import from posts module would be circular — use dynamic approach
      return postCardHTMLSimple(p);
    }).join('');
    attachPostListeners(tabContent);
  }

  document.getElementById('tab-own').addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    showTab(userPosts);
  });
  document.getElementById('tab-all').addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    showTab(relatedPosts);
  });

  showTab(userPosts);
}

// Thin wrapper — reuses posts.js postCardHTML via import
import { postCardHTML as postCardHTMLSimple } from './posts.js';
