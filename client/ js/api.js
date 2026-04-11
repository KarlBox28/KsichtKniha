//js/api.js
// Low-level helpers for talking to the backend.

export const API_BASE = '';

/** Returns stored JWT token (or null). */
export function getToken() {
  return localStorage.getItem('kb_token');
}

/** Returns parsed current-user object (or null). */
export function getCurrentUser() {
  return JSON.parse(localStorage.getItem('kb_user') || 'null');
}

/** Persist auth data after login / register. */
export function setAuth(token, user) {
  localStorage.setItem('kb_token', token);
  localStorage.setItem('kb_user', JSON.stringify(user));
}

/** Wipe auth data on logout. */
export function clearAuth() {
  localStorage.removeItem('kb_token');
  localStorage.removeItem('kb_user');
}

/** Authorization header object for fetch calls. */
export function authHeaders(extraHeaders = {}) {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
}

/**
 * Fetch wrapper that:
 *  - Prefixes API_BASE
 *  - Parses JSON
 *  - Throws a readable Error on non-2xx responses
 */
export async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
}

/**
 * GET shorthand — automatically attaches Authorization header.
 */
export function apiGet(path) {
  return apiFetch(path, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
}

/**
 * POST shorthand with JSON body.
 */
export function apiPost(path, body) {
  return apiFetch(path, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

/**
 * PUT shorthand with JSON body.
 */
export function apiPut(path, body) {
  return apiFetch(path, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

/**
 * DELETE shorthand.
 */
export function apiDelete(path) {
  return apiFetch(path, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

/**
 * Multipart file upload via FormData.
 * fieldName   – form field name expected by multer
 * file        – File object
 * path        – API endpoint path
 */
export async function apiUpload(path, fieldName, file) {
  const fd = new FormData();
  fd.append(fieldName, file);
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}
