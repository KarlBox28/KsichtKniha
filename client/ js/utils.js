//js/utils.js
// Small helpers used across multiple pages.

/** HTML-escape a value to prevent XSS. */
export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format an ISO date string for Czech locale display. */
export function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleString('cs-CZ', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Calculate age from a date-of-birth string (YYYY-MM-DD). */
export function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

/** Show an error banner (element with class .form-error). */
export function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

/** Hide an error / success banner. */
export function hideMessage(el) {
  el.style.display = 'none';
  el.textContent = '';
}

/** Show a success banner (element with class .form-success). */
export function showSuccess(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

/** Build an avatar element: img if url given, else initials div. */
export function avatarHTML(avatarPath, firstName, lastName, cssClass = 'post-avatar') {
  const initials = ((firstName?.[0] ?? '?') + (lastName?.[0] ?? '')).toUpperCase();
  if (avatarPath) {
    return `<img class="${cssClass}" src="/api/static/${esc(avatarPath)}"
              alt="${esc(initials)}"
              onerror="this.outerHTML='<div class=\\'${cssClass}\\'>${initials}</div>'">`;
  }
  return `<div class="${cssClass}">${initials}</div>`;
}

/** Redirect to login page if the user is not authenticated. */
export function requireAuth() {
  if (!localStorage.getItem('kb_token')) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

const GENDER_LABELS = { M: 'Muž', F: 'Žena', O: 'Jiné' };
export function genderLabel(code) {
  return GENDER_LABELS[code] ?? '';
}
