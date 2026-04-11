//js/users.js
import { apiGet } from './api.js';
import { requireAuth, esc, calcAge, genderLabel, avatarHTML } from './utils.js';
import { renderNav } from './nav.js';

requireAuth();
renderNav('users');

const container = document.getElementById('users-container');

async function loadUsers() {
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const data  = await apiGet('/api/users');
    const users = Array.isArray(data) ? data : (data.users ?? []);

    const sorted = [...users].sort((a, b) =>
      (a.prijmeni ?? '').localeCompare(b.prijmeni ?? '', 'cs')
    );

    if (!sorted.length) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="icon">👻</span>
          <p>Žádní uživatelé</p>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="users-grid">${sorted.map(userCardHTML).join('')}</div>`;
  } catch (e) {
    container.innerHTML = `
      <div class="form-error" style="display:block">
        Nepodařilo se načíst uživatele: ${e.message}
      </div>`;
  }
}

function userCardHTML(u) {
  const initials = ((u.jmeno?.[0] ?? '?') + (u.prijmeni?.[0] ?? '')).toUpperCase();
  const avatarEl = u.avatar
    ? `<img class="user-card-avatar" src="/api/static/${esc(u.avatar)}"
           alt="${initials}"
           onerror="this.outerHTML='<div class=\\'user-card-avatar\\'>${initials}</div>'">`
    : `<div class="user-card-avatar">${initials}</div>`;

  const age    = u.vek ?? calcAge(u.datum_narozeni);
  const gender = genderLabel(u.pohlavi);
  const posts  = u.post_count ?? u.pocet_prispevku ?? 0;

  return `
    <a class="user-card" href="/user-detail.html?id=${u.id}">
      ${avatarEl}
      <div class="user-card-name">${esc(u.jmeno ?? '')} ${esc(u.prijmeni ?? '')}</div>
      <div class="user-card-info">${gender}${age ? ` · ${age} let` : ''}</div>
      <div class="user-card-posts">📝 ${posts} příspěvků</div>
    </a>`;
}

loadUsers();
