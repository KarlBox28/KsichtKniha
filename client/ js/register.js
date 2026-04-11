//js/register.js
import { apiFetch, setAuth, getToken, apiUpload } from './api.js';
import { showError, showSuccess, calcAge } from './utils.js';

// Redirect if already logged in
if (getToken()) window.location.href = '/wall.html';

// Live photo preview
document.getElementById('reg-photo').addEventListener('change', function () {
  const preview = document.getElementById('photo-preview');
  if (!this.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => { preview.src = e.target.result; preview.style.display = 'block'; };
  reader.readAsDataURL(this.files[0]);
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('reg-error');
  const suc = document.getElementById('reg-success');
  err.style.display = 'none';
  suc.style.display = 'none';

  const jmeno    = document.getElementById('reg-jmeno').value.trim();
  const prijmeni = document.getElementById('reg-prijmeni').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const dob      = document.getElementById('reg-dob').value;
  const gender   = document.getElementById('reg-gender').value;

  // Client-side validations
  if (!jmeno || !prijmeni || !username || !password || !dob || !gender) {
    showError(err, 'Vyplň všechna povinná pole.'); return;
  }
  if (calcAge(dob) < 13) {
    showError(err, 'Musíš mít alespoň 13 let pro registraci.'); return;
  }
  if (password.length < 6) {
    showError(err, 'Heslo musí mít alespoň 6 znaků.'); return;
  }

  try {
    const data = await apiFetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        jmeno, prijmeni, username, password,
        datum_narozeni: dob,
        pohlavi: gender,
      }),
    });

    // Upload avatar right after registration if a token was returned
    const photoFile = document.getElementById('reg-photo').files[0];
    if (photoFile && data.token) {
      setAuth(data.token, data.user);
      await apiUpload('/api/upload-avatar', 'profile-image', photoFile);
    } else if (data.token) {
      setAuth(data.token, data.user);
    }

    if (data.token) {
      window.location.href = '/wall.html';
    } else {
      showSuccess(suc, 'Účet vytvořen! Přesměrování na přihlášení…');
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);
    }
  } catch (ex) {
    showError(err, ex.message);
  }
});
