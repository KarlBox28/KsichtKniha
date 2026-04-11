//js/nav.js
// Renders the top navigation bar and handles logout.

import { getCurrentUser, clearAuth } from './api.js';

/**
 * Inject the navbar into #navbar-placeholder.
 * Pass the key of the currently active page to highlight the correct link.
 * @param {'wall'|'users'} activePage
 */
export function renderNav(activePage) {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  const user = getCurrentUser();
  if (!user) return;

  const initials = ((user.jmeno?.[0] ?? '') + (user.prijmeni?.[0] ?? '')).toUpperCase() || '?';
  const avatarHtml = user.avatar
    ? `<img class="nav-avatar" src="/api/static/${user.avatar}"
           alt="${initials}"
           onerror="this.outerHTML='<div class=nav-avatar>${initials}</div>'">`
    : `<div class="nav-avatar">${initials}</div>`;

  placeholder.innerHTML = `
    <nav class="navbar">
      <div class="nav-inner">
        <a class="nav-logo" href="/wall.html">Ksicht<span>Kniha</span></a>
        <div class="nav-links">
          <a href="/wall.html"  class="${activePage === 'wall'  ? 'active' : ''}">🏠 Zeď</a>
          <a href="/users.html" class="${activePage === 'users' ? 'active' : ''}">👥 Uživatelé</a>
        </div>
        <div class="nav-user">
          ${avatarHtml}
          <span class="nav-user-name">${user.jmeno ?? ''} ${user.prijmeni ?? ''}</span>
          <button class="btn-logout" id="logout-btn">Odhlásit</button>
        </div>
      </div>
    </nav>`;

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearAuth();
    window.location.href = '/login.html';
  });
}
