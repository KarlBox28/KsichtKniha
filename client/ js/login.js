//js/login.js
import { apiFetch, setAuth, getToken } from './api.js';
import { showError } from './utils.js';

// Redirect if already logged in
if (getToken()) window.location.href = '/wall.html';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err      = document.getElementById('login-error');
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  err.style.display = 'none';

  if (!username || !password) {
    showError(err, 'Vyplň všechna pole.');
    return;
  }

  try {
    const data = await apiFetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    setAuth(data.token, data.user);
    window.location.href = '/wall.html';
  } catch (ex) {
    showError(err, ex.message);
  }
});
