//js/posts.js
// Renders post cards, handles likes and comments.

import { apiGet, apiPost, apiPut, apiDelete, apiUpload, getToken } from './api.js';
import { esc, formatDate, avatarHTML, showError } from './utils.js';
import { getCurrentUser } from './api.js';

/** Fetch all posts from the server. */
export async function fetchPosts() {
  const data = await apiGet('/api/posts');
  return Array.isArray(data) ? data : (data.posts ?? []);
}

/**
 * Render a list of posts into the given container element.
 * @param {Array}       posts
 * @param {HTMLElement} container
 */
export function renderPosts(posts, container) {
  if (!posts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="icon">📭</span>
        <p>Zatím žádné příspěvky</p>
      </div>`;
    return;
  }
  container.innerHTML = posts.map(postCardHTML).join('');
  attachPostListeners(container);
}

/** Build the full HTML string for one post card. */
export function postCardHTML(post) {
  const me = getCurrentUser();
  const isOwn = me && (post.user_id === me.id || post.autor_id === me.id);
  const liked = post.liked_by_me || post.user_liked || false;

  const firstName  = post.jmeno       ?? post.autor_jmeno    ?? '?';
  const lastName   = post.prijmeni    ?? post.autor_prijmeni  ?? '';
  const avatarPath = post.avatar      ?? post.autor_avatar    ?? null;
  const authorId   = post.user_id     ?? post.autor_id;
  const likeCount  = post.like_count  ?? post.likes           ?? 0;
  const commentCount = post.comment_count ?? post.comments?.length ?? 0;
  const imageFile  = post.image       ?? post.obrazek         ?? null;
  const date       = formatDate(post.datum ?? post.created_at ?? post.datum_vytvoreni);

  const avatarEl = avatarHTML(avatarPath, firstName, lastName, 'post-avatar');
  const imageEl  = imageFile
    ? `<img class="post-image" src="/api/static/${esc(imageFile)}" alt="Obrázek příspěvku">`
    : '';
  const ownerBtns = isOwn ? `
    <div class="post-actions-header">
      <button class="btn btn-outline btn-sm js-edit-post"
              data-id="${post.id}"
              data-title="${esc(post.nadpis ?? '')}"
              data-content="${esc(post.text ?? post.obsah ?? '')}">✏️</button>
      <button class="btn btn-danger btn-sm js-delete-post" data-id="${post.id}">🗑️</button>
    </div>` : '';

  return `
    <article class="post-card" id="post-${post.id}">
      <div class="post-header">
        <a href="/user-detail.html?id=${authorId}">${avatarEl}</a>
        <div class="post-meta">
          <a class="post-author" href="/user-detail.html?id=${authorId}">
            ${esc(firstName)} ${esc(lastName)}
          </a>
          <div class="post-date">${date}</div>
        </div>
        ${ownerBtns}
      </div>

      ${post.nadpis ? `<div class="post-title">${esc(post.nadpis)}</div>` : ''}
      <div class="post-content">${esc(post.text ?? post.obsah ?? '')}</div>
      ${imageEl}

      <div class="post-footer">
        <button class="like-btn ${liked ? 'liked' : ''} js-like" data-id="${post.id}">
          <span>${liked ? '❤️' : '🤍'}</span>
          ${liked ? 'Olíbeno' : 'Líbí se mi'}
        </button>
        <button class="like-count-btn js-show-likes" data-id="${post.id}">
          ${likeCount} líbí se
        </button>
        <button class="comment-toggle-btn js-toggle-comments" data-id="${post.id}">
          💬 ${commentCount} komentářů
        </button>
      </div>

      <div class="likes-panel" id="likes-panel-${post.id}">
        <div class="likes-panel-title">Líbí se</div>
        <div class="likes-list" id="likes-list-${post.id}"></div>
      </div>

      <div class="comments-section" id="comments-${post.id}">
        <div class="comments-list" id="comments-list-${post.id}"></div>
        <div class="comment-form">
          <input class="comment-input" id="comment-input-${post.id}"
                 placeholder="Přidat komentář…">
          <button class="comment-send js-send-comment" data-id="${post.id}" title="Odeslat">➤</button>
        </div>
      </div>
    </article>`;
}

/** Wire up all interactive buttons inside a posts container. */
export function attachPostListeners(container) {
  container.querySelectorAll('.js-like').forEach(btn => {
    btn.addEventListener('click', () => handleLike(btn));
  });
  container.querySelectorAll('.js-show-likes').forEach(btn => {
    btn.addEventListener('click', () => toggleLikesPanel(btn.dataset.id));
  });
  container.querySelectorAll('.js-toggle-comments').forEach(btn => {
    btn.addEventListener('click', () => toggleComments(btn.dataset.id));
  });
  container.querySelectorAll('.js-send-comment').forEach(btn => {
    btn.addEventListener('click', () => submitComment(btn.dataset.id));
  });
  container.querySelectorAll('.comment-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitComment(input.id.replace('comment-input-', ''));
    });
  });
  container.querySelectorAll('.js-edit-post').forEach(btn => {
    btn.addEventListener('click', () => {
      openEditModal(btn.dataset.id, btn.dataset.title, btn.dataset.content);
    });
  });
  container.querySelectorAll('.js-delete-post').forEach(btn => {
    btn.addEventListener('click', () => handleDeletePost(btn.dataset.id, container));
  });
}

// ── LIKES ─────────────────────────────────────────────────────

async function handleLike(btn) {
  const postId = btn.dataset.id;
  try {
    await apiPost('/api/like-post', { post_id: Number(postId) });
    // Optimistic UI toggle
    const liked = btn.classList.toggle('liked');
    btn.querySelector('span').textContent = liked ? '❤️' : '🤍';
    btn.lastChild.textContent = ' ' + (liked ? 'Olíbeno' : 'Líbí se mi');
    // Refresh count label
    const countBtn = document.querySelector(`.js-show-likes[data-id="${postId}"]`);
    if (countBtn) {
      const current = parseInt(countBtn.textContent) || 0;
      countBtn.textContent = `${liked ? current + 1 : Math.max(0, current - 1)} líbí se`;
    }
  } catch (e) {
    alert('Nepodařilo se lajknout: ' + e.message);
  }
}

async function toggleLikesPanel(postId) {
  const panel = document.getElementById(`likes-panel-${postId}`);
  const isVisible = panel.style.display === 'block';
  panel.style.display = isVisible ? 'none' : 'block';
  if (isVisible) return;

  const list = document.getElementById(`likes-list-${postId}`);
  list.innerHTML = '<div class="spinner" style="margin:0.5rem auto;width:20px;height:20px;border-width:2px"></div>';

  try {
    const data = await apiGet(`/api/post-likes/${postId}`);
    const likes = Array.isArray(data) ? data : (data.likes ?? []);
    if (!likes.length) {
      list.innerHTML = '<em style="font-size:0.85rem;color:var(--muted)">Nikdo zatím</em>';
      return;
    }
    list.innerHTML = likes.map(l => {
      const av = l.avatar
        ? `<img class="mini-avatar" src="/api/static/${esc(l.avatar)}" alt="">`
        : `<div class="mini-avatar">${((l.jmeno?.[0]??'?')+(l.prijmeni?.[0]??'')).toUpperCase()}</div>`;
      return `<div class="like-user-row">
        ${av}
        <span>${esc(l.jmeno ?? '')} ${esc(l.prijmeni ?? '')}</span>
        <span class="like-date">${formatDate(l.datum ?? l.created_at)}</span>
      </div>`;
    }).join('');
  } catch {
    list.innerHTML = '<em style="font-size:0.85rem;color:var(--muted)">Nepodařilo se načíst</em>';
  }
}

// ── COMMENTS ──────────────────────────────────────────────────

async function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  const isVisible = section.style.display === 'block';
  section.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) await loadComments(postId);
}

async function loadComments(postId) {
  const list = document.getElementById(`comments-list-${postId}`);
  try {
    const data = await apiGet(`/api/post-comments/${postId}`);
    const comments = Array.isArray(data) ? data : (data.comments ?? []);
    renderComments(comments, list);
  } catch {
    list.innerHTML = '<p style="font-size:0.85rem;color:var(--muted)">Komentáře nedostupné</p>';
  }
}

function renderComments(comments, container) {
  if (!comments.length) {
    container.innerHTML = '<p style="font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem">Žádné komentáře — buď první!</p>';
    return;
  }
  const sorted = [...comments].sort(
    (a, b) => new Date(b.datum ?? b.created_at) - new Date(a.datum ?? a.created_at)
  );
  container.innerHTML = sorted.map(c => {
    const firstName = c.jmeno ?? c.autor_jmeno ?? '?';
    const lastName  = c.prijmeni ?? c.autor_prijmeni ?? '';
    const av = avatarHTML(c.avatar ?? c.autor_avatar, firstName, lastName, 'comment-avatar');
    return `<div class="comment-item">
      ${av}
      <div class="comment-body">
        <div class="comment-author">${esc(firstName)} ${esc(lastName)}</div>
        <div class="comment-text">${esc(c.text ?? c.obsah ?? '')}</div>
        <div class="comment-date">${formatDate(c.datum ?? c.created_at)}</div>
      </div>
    </div>`;
  }).join('');
}

async function submitComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;
  try {
    await apiPost('/api/comment', { post_id: Number(postId), text });
    input.value = '';
    await loadComments(postId);
    // Update comment count badge
    const toggle = document.querySelector(`.js-toggle-comments[data-id="${postId}"]`);
    if (toggle) {
      const list = document.getElementById(`comments-list-${postId}`);
      const count = list.querySelectorAll('.comment-item').length;
      toggle.textContent = `💬 ${count} komentářů`;
    }
  } catch (e) {
    alert('Nepodařilo se přidat komentář: ' + e.message);
  }
}

// ── EDIT / DELETE ──────────────────────────────────────────────

let _editingPostId = null;

export function openEditModal(id, title, content) {
  _editingPostId = id;
  document.getElementById('edit-title').value   = title;
  document.getElementById('edit-content').value = content;
  document.getElementById('edit-error').style.display = 'none';
  document.getElementById('edit-modal').classList.add('open');
}

export function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('open');
  _editingPostId = null;
}

export async function saveEditPost(reloadCallback) {
  const title   = document.getElementById('edit-title').value.trim();
  const content = document.getElementById('edit-content').value.trim();
  const err     = document.getElementById('edit-error');
  err.style.display = 'none';
  if (!content) { showError(err, 'Text nemůže být prázdný.'); return; }
  try {
    await apiPut(`/api/post/${_editingPostId}`, {
      nadpis: title, text: content, obsah: content,
    });
    closeEditModal();
    if (reloadCallback) await reloadCallback();
  } catch (e) {
    showError(err, e.message);
  }
}

async function handleDeletePost(postId, container) {
  if (!confirm('Opravdu smazat příspěvek?')) return;
  try {
    await apiDelete(`/api/post/${postId}`);
    const card = document.getElementById(`post-${postId}`);
    card?.remove();
    if (!container.querySelector('.post-card')) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="icon">📭</span>
          <p>Žádné příspěvky</p>
        </div>`;
    }
  } catch (e) {
    alert('Nepodařilo se smazat: ' + e.message);
  }
}

// ── NEW POST FORM ──────────────────────────────────────────────

/**
 * Wire up the new-post form on the wall page.
 * reloadCallback is called after successful submit to refresh the feed.
 */
export function initNewPostForm(reloadCallback) {
  const btn = document.getElementById('submit-post-btn');
  if (!btn) return;
  btn.addEventListener('click', () => submitNewPost(reloadCallback));

  const imgInput = document.getElementById('np-image');
  imgInput?.addEventListener('change', () => {
    const nameEl = document.getElementById('np-fname');
    if (nameEl) nameEl.textContent = imgInput.files[0]?.name ?? '';
  });
}

async function submitNewPost(reloadCallback) {
  const title   = document.getElementById('np-title').value.trim();
  const content = document.getElementById('np-content').value.trim();
  const err     = document.getElementById('new-post-error');
  err.style.display = 'none';
  if (!content) { showError(err, 'Napiš něco před publikováním.'); return; }

  try {
    const data = await apiPost('/api/post', {
      nadpis: title, text: content, obsah: content,
    });
    const postId = data.id ?? data.post_id ?? data.insertId;

    const imgFile = document.getElementById('np-image').files[0];
    if (imgFile && postId) {
      await apiUpload(`/api/post-image/${postId}`, 'post-image', imgFile);
    }

    // Reset form
    document.getElementById('np-title').value   = '';
    document.getElementById('np-content').value = '';
    document.getElementById('np-image').value   = '';
    const nameEl = document.getElementById('np-fname');
    if (nameEl) nameEl.textContent = '';

    if (reloadCallback) await reloadCallback();
  } catch (e) {
    showError(err, e.message);
  }
}
