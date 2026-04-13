const API = '';
let token = localStorage.getItem('kb_token');
let currentUser = JSON.parse(localStorage.getItem('kb_user') || 'null');
let editingPostId = null;

// ─── AUTH ───────────────────────────────────────────────────
function setAuth(t, u) {
    token = t; currentUser = u;
    localStorage.setItem('kb_token', t);
    localStorage.setItem('kb_user', JSON.stringify(u));
}
function clearAuth() {
    token = null; currentUser = null;
    localStorage.removeItem('kb_token');
    localStorage.removeItem('kb_user');
}
function authHeaders() {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}
async function apiFetch(url, opts = {}) {
    const res = await fetch(API + url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Chyba serveru');
    return data;
}

// ─── NAVIGATION ─────────────────────────────────────────────
function navigate(view, params = {}) {
    window.scrollTo(0, 0);
    renderNavbar();
    switch(view) {
        case 'login':    renderLogin(); break;
        case 'register': renderRegister(); break;
        case 'wall':     renderWall(); break;
        case 'users':    renderUsers(); break;
        case 'user':     renderUserDetail(params.id); break;
        default:         renderLogin();
    }
}

// ─── NAVBAR ─────────────────────────────────────────────────
function renderNavbar() {
    const nb = document.getElementById('navbar');
    if (!token) { nb.style.display = 'none'; return; }
    nb.style.display = '';
    const links = document.getElementById('nav-links');
    links.innerHTML = `
    <a href="#" onclick="navigate('wall')">Zeď</a>
    <a href="#" onclick="navigate('users')">Uživatelé</a>
  `;
    const nu = document.getElementById('nav-user');
    const avatarHtml = currentUser?.profile_image
        ? `<img class="nav-avatar" src="${API}/api/static/uploads/${currentUser.profile_image}">`
        : `<img class="nav-avatar" src="${API}/api/static/default.jpg">`;
    nu.innerHTML = `
    <div class="nav-user-info" onclick="openProfileModal()" title="Upravit profil">
      ${avatarHtml}
      <span class="nav-user-name">${currentUser?.first_name || ''} ${currentUser?.last_name || ''}</span>
    </div>
    <button class="btn-logout" onclick="logout()">Odhlásit</button>
  `;
}
function logout() {
    clearAuth(); navigate('login');
}

// ─── LOGIN ───────────────────────────────────────────────────
function renderLogin() {
    document.getElementById('navbar').style.display = 'none';
    const p = document.getElementById('page');
    p.className = 'narrow';
    p.innerHTML = `
    <div class="auth-header">
      <span class="auth-logo">Ksicht<span>Kniha</span></span>
      <p class="auth-tagline">Sociální síť pro studenty</p>
    </div>
    <div class="card">
      <div class="card-body">
        <div id="login-error" class="form-error" style="display:none"></div>
        <div class="form-group">
          <label class="form-label">Uživatelské jméno</label>
          <input type="text" id="login-username" placeholder="např. jan.novak" autocomplete="username">
        </div>
        <div class="form-group">
          <label class="form-label">Heslo</label>
          <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="doLogin()">Přihlásit se</button>
      </div>
    </div>
    <div class="auth-switch">
      Nemáš účet? <a href="#" onclick="navigate('register')">Registruj se</a>
    </div>`;
    document.getElementById('login-password').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
}
async function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const err = document.getElementById('login-error');
    err.style.display = 'none';
    if (!username || !password) { showErr(err, 'Vyplň všechna pole.'); return; }
    try {
        const data = await apiFetch('/api/login', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ username, password })
        });
        setAuth(data.token, "");
        const user_data = await apiFetch('/api/user-info', {
            method: 'GET', headers: authHeaders(),
        });
        setAuth(data.token, user_data);
        navigate('wall');
    } catch(e) { showErr(err, e.message); }
}

// ─── REGISTER ────────────────────────────────────────────────
function renderRegister() {
    document.getElementById('navbar').style.display = 'none';
    const p = document.getElementById('page');
    p.className = 'narrow';
    p.innerHTML = `
    <div class="auth-header">
      <span class="auth-logo">Ksicht<span>Kniha</span></span>
      <p class="auth-tagline">Nový účet</p>
    </div>
    <div class="card">
      <div class="card-body">
        <div id="reg-error" class="form-error" style="display:none"></div>
        <div id="reg-success" class="form-success" style="display:none"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <div class="form-group">
            <label class="form-label">Jméno</label>
            <input type="text" id="reg-jmeno" placeholder="Jan">
          </div>
          <div class="form-group">
            <label class="form-label">Příjmení</label>
            <input type="text" id="reg-prijmeni" placeholder="Novák">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Uživatelské jméno</label>
          <input type="text" id="reg-username" placeholder="jan.novak">
        </div>
        <div class="form-group">
          <label class="form-label">Heslo</label>
          <input type="password" id="reg-password" placeholder="Min. 6 znaků">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <div class="form-group">
            <label class="form-label">Datum narození</label>
            <input type="date" id="reg-dob">
          </div>
          <div class="form-group">
            <label class="form-label">Pohlaví</label>
            <select id="reg-gender">
              <option value="">Vyber...</option>
              <option value="M">Muž</option>
              <option value="F">Žena</option>
              <option value="O">Jiné</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Profilová fotka</label>
          <label class="file-label">
            📷 Vybrat foto
            <input type="file" id="reg-photo" accept="image/*" onchange="previewPhoto(this)">
          </label>
          <img id="photo-preview" class="photo-preview" style="display:none">
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:0.5rem" onclick="doRegister()">Vytvořit účet</button>
      </div>
    </div>
    <div class="auth-switch">
      Máš účet? <a href="#" onclick="navigate('login')">Přihlásit se</a>
    </div>`;
}
function previewPhoto(input) {
    const prev = document.getElementById('photo-preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => { prev.src = e.target.result; prev.style.display = 'block'; };
        reader.readAsDataURL(input.files[0]);
    }
}
async function doRegister() {
    const err = document.getElementById('reg-error');
    const suc = document.getElementById('reg-success');
    err.style.display = 'none'; suc.style.display = 'none';
    const jmeno = document.getElementById('reg-jmeno').value.trim();
    const prijmeni = document.getElementById('reg-prijmeni').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const dob = document.getElementById('reg-dob').value;
    const gender = document.getElementById('reg-gender').value;
    if (!jmeno || !prijmeni || !username || !password || !dob || !gender) {
        showErr(err, 'Vyplň všechna povinná pole.'); return;
    }
    // Age check (13+)
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age--;
    if (age < 13) { showErr(err, 'Musíš mít alespoň 13 let pro registraci.'); return; }
    if (password.length < 6) { showErr(err, 'Heslo musí mít alespoň 6 znaků.'); return; }
    try {
        const data = await apiFetch('/api/register', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ first_name: jmeno, last_name: prijmeni, username: username, password: password, age: age, sex: gender })
        });
        setAuth(data.token, "");
        // Upload avatar if selected
        const photoFile = document.getElementById('reg-photo').files[0];
        if (photoFile && data.token) {
            const fd = new FormData();
            fd.append('profile-image', photoFile);
            await fetch(API + '/api/upload-avatar', {
                method: 'POST', headers: { 'Authorization': `Bearer ${data.token}` }, body: fd
            });
        }

        const user_data = await apiFetch('/api/user-info', {
            method: 'GET', headers: authHeaders(),
        });
        setAuth(data.token, user_data);
        navigate('wall');
    } catch(e) { showErr(err, e.message); }
}

// ─── WALL ────────────────────────────────────────────────────
let allPosts = [];
async function renderWall() {
    if (!token) { navigate('login'); return; }
    const p = document.getElementById('page');
    p.className = '';
    p.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Zeď</div>
        <div class="page-subtitle">Nejnovější příspěvky komunity</div>
      </div>
    </div>
    <div class="new-post-card">
      <h3>Nový příspěvek</h3>
      <div id="new-post-error" class="form-error" style="display:none"></div>
      <div class="form-group">
        <input type="text" id="np-title" placeholder="Nadpis příspěvku">
      </div>
      <div class="form-group">
        <div id="np-quill-editor" style="height:120px"></div>
      </div>
      <div class="new-post-footer">
        <label class="file-label">
          Přidat obrázek
          <input type="file" id="np-image" accept="image/*" onchange="showNewPostFileName(this)">
        </label>
        <span class="file-name" id="np-fname"></span>
        <button class="btn btn-primary" style="margin-left:auto" onclick="submitPost()">Publikovat</button>
      </div>
    </div>
    <div id="posts-container"><div class="spinner"></div></div>`;

    // Inicializuj Quill až po nastavení innerHTML — element musí existovat v DOM
    window.npQuill = new Quill('#np-quill-editor', {
        theme: 'snow',
        placeholder: 'Co je nového? Sdílej to s ostatními…',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['clean']
            ]
        }
    });

    await loadPosts();
}
function showNewPostFileName(input) {
    document.getElementById('np-fname').textContent = input.files[0]?.name || '';
}
function showEditPostFileName(input) {
    document.getElementById('edit-np-fname').textContent = input.files[0]?.name || '';
}
async function loadPosts() {
    try {
        const data = await apiFetch('/api/posts', {
            method: 'GET', headers: authHeaders()
        });
        allPosts = Array.isArray(data) ? data : [];
        renderPosts(allPosts, 'posts-container');
    } catch(e) {
        document.getElementById('posts-container').innerHTML = `<div class="form-error">Nepodařilo se načíst příspěvky: ${e.message}</div>`;
    }
}
function renderPosts(posts, containerId) {
    const c = document.getElementById(containerId);
    if (!posts.length) {
        c.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>Zatím žádné příspěvky</p></div>`;
        return;
    }
    c.innerHTML = posts.map(post => renderPostHTML(post)).join('');
}
function renderPostHTML(post) {
    const isOwn = post.author_id == currentUser.user_id;
    const liked = post.liked_by_me;
    const avatarSrc = post.user_image;
    const avatarHtml = avatarSrc
        ? `<img class="post-avatar" src="${API}/api/static/uploads/${avatarSrc}" alt="user avatar">`
        : `<img class="post-avatar" src="${API}/api/static/default.jpg" alt="user avatar">`;
    const authorName = `${post.first_name} ${post.last_name}`.trim();
    const authorId = post.author_id;
    const likeCount = post.like_count;
    const commentCount = post.comment_count;
    const imageHtml = post.image
        ? `<img class="post-image" src="${API}/api/static/uploads/${post.image}" alt="Obrázek příspěvku">`
        : '';
    const date = formatDate(post.created_at);

    // post.body je HTML z Quillu — renderujeme přímo jako innerHTML.
    // Quillův obsah pochází z naší vlastní DB, ale pro jistotu
    // sanitizuj na backendu pomocí sanitize-html (npm).
    const bodyHtml = post.body || '';

    return `
  <div class="post-card" id="post-${post.post_id}">
    <div class="post-header">
      ${avatarHtml}
      <div class="post-meta">
        <a class="post-author" onclick="navigate('user',{id:${authorId}})">${esc(authorName)}</a>
        <div class="post-date">${date}</div>
      </div>
      ${isOwn ? `
      <div class="post-actions-header">
        <button class="btn btn-outline btn-sm" onclick="openEditModal(${post.post_id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deletePost(${post.post_id})">🗑️</button>
      </div>` : ''}
    </div>
    ${post.title ? `<div class="post-title">${esc(post.title)}</div>` : ''}
    <div class="post-content ql-editor" style="padding:0 1.25rem 0.75rem">${bodyHtml}</div>
    <div id="raw-body-${post.post_id}" style="display:none">${esc(bodyHtml)}</div>
    ${imageHtml}
    <div class="post-footer">
      <button class="like-btn ${liked ? 'liked' : ''}" onclick="toggleLike(${post.post_id},this)">
        <span class="heart">${liked ? '❤️' : '🤍'}</span>
        Líbí se mi
      </button>
      <button class="like-count-btn" onclick="toggleLikesPanel(${post.post_id})">${likeCount} líbí se</button>
      <button class="comment-toggle-btn" onclick="toggleComments(${post.post_id})">
        💬 ${commentCount} komentářů
      </button>
    </div>
    <div id="likes-panel-${post.post_id}" style="display:none" class="likes-panel">
      <div class="likes-panel-title">Líbí se</div>
      <div id="likes-list-${post.post_id}">Načítám...</div>
    </div>
    <div id="comments-${post.post_id}" style="display:none" class="comments-section">
      <div id="comments-list-${post.post_id}"></div>
      <div class="comment-form">
        <input class="comment-input" id="comment-input-${post.post_id}" placeholder="Přidat komentář..." onkeydown="if(event.key==='Enter')submitComment(${post.post_id})">
        <button class="comment-send" onclick="submitComment(${post.post_id})">➤</button>
      </div>
    </div>
  </div>`;
}
async function submitPost() {
    const title   = document.getElementById('np-title').value.trim();
    const content = window.npQuill.root.innerHTML.trim();
    const err     = document.getElementById('new-post-error');
    err.style.display = 'none';
    // Quill prázdný editor vrací '<p><br></p>'
    if (!content || content === '<p><br></p>') {
        showErr(err, 'Napiš něco před publikováním.'); return;
    }
    try {
        const data = await apiFetch('/api/post', {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ title: title, body: content })
        });
        const postId = data.insertId;
        const imgFile = document.getElementById('np-image').files[0];
        if (imgFile && postId) {
            const fd = new FormData(); fd.append('post-image', imgFile);
            await fetch(`${API}/api/post-image/${postId}`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
            });
        }
        document.getElementById('np-title').value = '';
        window.npQuill.setContents([]);
        document.getElementById('np-image').value = '';
        document.getElementById('np-fname').textContent = '';
        await loadPosts();
    } catch(e) { showErr(err, e.message); }
}
async function deletePost(id) {
    if (!confirm('Opravdu smazat příspěvek?')) return;
    try {
        await apiFetch(`/api/post/${id}`, { method: 'DELETE', headers: authHeaders() });
        await loadPosts();
    } catch(e) { alert(e.message); }
}
function openEditModal(id) {
    editingPostId = id;
    // Titul čteme z DOM — bezpečné, protože jsme ho vyescapovali při renderování
    const card = document.getElementById(`post-${id}`);
    const titleEl = card.querySelector('.post-title');
    document.getElementById('edit-title').value = titleEl ? titleEl.textContent.trim() : '';
    // Body čteme z hidden elementu, kde je uložen jako escaped HTML
    const rawBody = document.getElementById(`raw-body-${id}`).textContent;
    window.editQuill.root.innerHTML = rawBody;
    document.getElementById('edit-error').style.display = 'none';
    document.getElementById('edit-modal').style.display = 'flex';
    document.getElementById('edit-np-image').value = '';
}
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    document.getElementById('edit-title').value = '';
    window.editQuill.setContents([]);
    document.getElementById('edit-np-fname').innerHTML = '';
    document.getElementById('edit-np-image').value = '';
    editingPostId = null;
}
async function saveEditPost() {
    const title   = document.getElementById('edit-title').value.trim();
    const content = window.editQuill.root.innerHTML.trim();
    const imgFile = document.getElementById('edit-np-image').files[0];
    const err     = document.getElementById('edit-error');
    err.style.display = 'none';
    if (!content || content === '<p><br></p>') {
        showErr(err, 'Text nemůže být prázdný.'); return;
    }
    try {
        await apiFetch(`/api/post/${editingPostId}`, {
            method: 'PUT', headers: authHeaders(),
            body: JSON.stringify({ title: title, body: content })
        });
        if (imgFile) {
            const fd = new FormData(); fd.append('post-image', imgFile);
            await fetch(`${API}/api/post-image/${editingPostId}`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
            });
        }
        closeEditModal();
        await loadPosts();
    } catch(e) { showErr(err, e.message); }
}
async function toggleLike(postId, btn) {
    try {
        await apiFetch('/api/like-post', {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ postId: postId })
        });
        await loadPosts();
    } catch(e) { alert(e.message); }
}
async function toggleLikesPanel(postId) {
    const panel = document.getElementById(`likes-panel-${postId}`);
    if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
    panel.style.display = '';
    try {
        const data = await apiFetch(`/api/post-likes/${postId}`, { headers: authHeaders() });
        const likes = Array.isArray(data) ? data : [];
        const list = document.getElementById(`likes-list-${postId}`);
        if (!likes.length) { list.innerHTML = '<em style="font-size:0.85rem;color:var(--muted)">Nikdo zatím</em>'; return; }
        list.innerHTML = likes.map(l => {
            const av = l.profile_image
                ? `<img class="mini-avatar" src="${API}/api/static/uploads/${l.profile_image}" style="width:24px;height:24px;border-radius:50%;object-fit:cover">`
                : `<img class="mini-avatar" src="${API}/api/static/default.jpg" style="width:24px;height:24px;border-radius:50%;object-fit:cover">`;
            return `<div class="like-user-row">${av}<span>${l.first_name || ''} ${l.last_name || ''}</span><span class="like-date">${formatDate(l.liked_at)}</span></div>`;
        }).join('');
    } catch(e) {
        document.getElementById(`likes-list-${postId}`).innerHTML = '<span style="font-size:0.85rem;color:var(--muted)">Není k dispozici</span>';
    }
}
async function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section.style.display !== 'none') { section.style.display = 'none'; return; }
    section.style.display = '';
    await loadComments(postId);
}
async function loadComments(postId) {
    const list = document.getElementById(`comments-list-${postId}`);
    try {
        const data = await apiFetch(`/api/post-comments/${postId}`, { headers: authHeaders() });
        const comments = Array.isArray(data) ? data : [];
        renderComments(comments, list);
    } catch(e) {
        document.getElementById(`comments-list-${postId}`).innerHTML = '<span style="font-size:0.85rem;color:var(--muted)">Není k dispozici</span>';
    }
}
function renderComments(comments, container) {
    if (!comments.length) { container.innerHTML = '<p style="font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem">Žádné komentáře. Buď první!</p>'; return; }
    container.innerHTML = [...comments].sort((a,b) => new Date(b.commented_at) - new Date(a.commented_at))
        .map(c => {
            const av = c.profile_image
                ? `<img class="comment-avatar" src="${API}/api/static/uploads/${c.profile_image}" style="width:32px;height:32px;border-radius:50%;object-fit:cover">`
                : `<img class="comment-avatar" src="${API}/api/static/default.jpg" style="width:32px;height:32px;border-radius:50%;object-fit:cover">`;
            const name = `${c.first_name} ${c.last_name}`.trim();
            return `<div class="comment-item">${av}<div class="comment-body"><div class="comment-author">${esc(name)}</div><div class="comment-text">${esc(c.body)}</div><div class="comment-date">${formatDate(c.commented_at)}</div></div></div>`;
        }).join('');
}
async function submitComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    try {
        await apiFetch(`/api/comment`, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ postId: postId, body: text })
        });
        input.value = '';
        await loadComments(postId);
        await toggleComments(postId);
        await loadPosts();
    } catch(e) { alert('Nepodařilo se přidat komentář: ' + e.message); }
}

// ─── USERS ───────────────────────────────────────────────────
async function renderUsers() {
    if (!token) { navigate('login'); return; }
    const p = document.getElementById('page');
    p.className = '';
    p.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Uživatelé</div>
        <div class="page-subtitle">Všichni registrovaní uživatelé</div>
      </div>
    </div>
    <div id="users-container"><div class="spinner"></div></div>`;
    try {
        const data = await apiFetch('/api/users', { headers: authHeaders() });
        const users = Array.isArray(data) ? data : [];
        const sorted = [...users].sort((a,b) => (a.last_name||'').localeCompare(b.last_name||'', 'cs'));
        const c = document.getElementById('users-container');
        if (!sorted.length) {
            c.innerHTML = `<div class="empty-state"><div class="icon">👻</div><p>Žádní uživatelé</p></div>`;
            return;
        }
        c.innerHTML = `<div class="users-grid">${sorted.map(u => {
            const avHtml = u.profile_image
                ? `<img class="user-card-avatar" src="${API}/api/static/uploads/${u.profile_image}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid var(--yellow)">`
                : `<img class="user-card-avatar" src="${API}/api/static/default.jpg" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid var(--yellow)">`;
            const genderMap = {M:'Muž',F:'Žena',O:'Jiné'};
            return `<div class="user-card" onclick="navigate('user',{id:${u.user_id}})">
        ${avHtml}
        <div class="user-card-name">${esc(u.first_name||'')} ${esc(u.last_name||'')}</div>
        <div class="user-card-info">${genderMap[u.sex]||''} · ${u.age} let</div>
        <div class="user-card-posts">${u.post_count} příspěvků</div>
      </div>`;
        }).join('')}</div>`;
    } catch(e) {
        document.getElementById('users-container').innerHTML = `<div class="form-error">Nepodařilo se načíst uživatele: ${e.message}</div>`;
    }
}

// ─── USER DETAIL ─────────────────────────────────────────────
async function renderUserDetail(userId) {
    if (!token) { navigate('login'); return; }
    const p = document.getElementById('page');
    p.className = '';
    p.innerHTML = `<button class="back-btn" onclick="navigate('users')">← Zpět na uživatele</button><div class="spinner"></div>`;

    try {
        const [user, detailPosts] = await Promise.all([
            apiFetch(`/api/user-info/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            apiFetch(`/api/user-detail-posts/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        const ownPosts       = detailPosts.filter(p => p.relation === 'own');
        const likedPosts     = detailPosts.filter(p => p.relation === 'liked');
        const commentedPosts = detailPosts.filter(p => p.relation === 'commented');

        const activityMap = new Map();
        detailPosts.forEach(post => activityMap.set(post.post_id, post));
        const activityPosts = [...activityMap.values()]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const genderMap = { M: 'Muž', F: 'Žena', O: 'Jiné' };
        const avHtml = user.profile_image
            ? `<img class="user-detail-avatar" src="${API}/api/static/uploads/${user.profile_image}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:4px solid var(--yellow)">`
            : `<img class="user-detail-avatar" src="${API}/api/static/default.jpg" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:4px solid var(--yellow)">`;

        p.innerHTML = `
          <button class="back-btn" onclick="navigate('users')">← Zpět na uživatele</button>

          <div class="user-detail-header">
            ${avHtml}
            <div class="user-detail-info">
              <div class="user-detail-name">${esc(user.first_name)} ${esc(user.last_name)}</div>
              <div class="user-detail-meta">
                @${esc(user.username)} · ${genderMap[user.sex] || ''} · ${user.age || ''} let
              </div>
              <div class="user-detail-stats">
                <div class="stat-pill"><strong>${user.post_count}</strong> příspěvků</div>
                <div class="stat-pill"><strong>${user.like_count}</strong> lajků dáno</div>
                <div class="stat-pill"><strong>${likedPosts.length + commentedPosts.length}</strong>${(likedPosts.length + commentedPosts.length) <= 4 ? " interakce" : " interakcí"} s ostatními</div>
              </div>
            </div>
          </div>

          <div class="section-title">Aktivita uživatele</div>

          <div class="tabs">
            <button class="tab-btn active" id="tab-own" onclick="switchUserTab('own')">
              Příspěvky (${ownPosts.length})
            </button>
            <button class="tab-btn" id="tab-liked" onclick="switchUserTab('liked')">
              Olajkoval (${likedPosts.length})
            </button>
            <button class="tab-btn" id="tab-commented" onclick="switchUserTab('commented')">
              Komentoval (${commentedPosts.length})
            </button>
            <button class="tab-btn" id="tab-all" onclick="switchUserTab('all')">
              Vše (${activityPosts.length})
            </button>
          </div>

          <div id="user-posts-container"></div>`;

        window._userDetailData = { ownPosts, likedPosts, commentedPosts, activityPosts };
        switchUserTab('own');

    } catch (e) {
        p.innerHTML = `
          <button class="back-btn" onclick="navigate('users')">← Zpět</button>
          <div class="form-error" style="display:block">Chyba: ${esc(e.message)}</div>`;
    }
}

function switchUserTab(tab) {
    ['own', 'liked', 'commented', 'all'].forEach(t => {
        document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab);
    });

    const { ownPosts, likedPosts, commentedPosts, activityPosts } = window._userDetailData;
    const map = { own: ownPosts, liked: likedPosts, commented: commentedPosts, all: activityPosts };
    const posts = map[tab] ?? [];
    const container = document.getElementById('user-posts-container');

    if (!posts.length) {
        const labels = { own: 'příspěvky', liked: 'olajkované příspěvky', commented: 'komentáře', all: 'aktivitu' };
        container.innerHTML = `
          <div class="empty-state">
            <div class="icon">📭</div>
            <p>Žádné ${labels[tab] ?? 'záznamy'}</p>
          </div>`;
        return;
    }

    container.innerHTML = posts.map(post => renderPostHTML(post)).join('');
}

// ─── PROFILE EDIT MODAL ──────────────────────────────────────
function openProfileModal() {
    const avatarSrc = currentUser?.profile_image
        ? `${API}/api/static/uploads/${currentUser.profile_image}`
        : `${API}/api/static/default.jpg`;
    document.getElementById('profile-modal-preview').src = avatarSrc;
    document.getElementById('profile-modal-fname').value  = currentUser?.first_name || '';
    document.getElementById('profile-modal-lname').value  = currentUser?.last_name  || '';
    document.getElementById('profile-modal-gender').value = currentUser?.sex || 'M';
    document.getElementById('profile-modal-photo').value  = '';
    document.getElementById('profile-modal-error').style.display = 'none';
    document.getElementById('profile-modal').style.display = 'flex';
}
function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}
function previewProfilePhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => { document.getElementById('profile-modal-preview').src = e.target.result; };
        reader.readAsDataURL(input.files[0]);
    }
}
async function saveProfile() {
    const fname  = document.getElementById('profile-modal-fname').value.trim();
    const lname  = document.getElementById('profile-modal-lname').value.trim();
    const gender = document.getElementById('profile-modal-gender').value;
    const photo  = document.getElementById('profile-modal-photo').files[0];
    const err    = document.getElementById('profile-modal-error');
    const btn    = document.getElementById('profile-modal-save-btn');
    err.style.display = 'none';
    if (!fname || !lname) { showErr(err, 'Vyplň jméno a příjmení.'); return; }
    btn.disabled = true;
    btn.textContent = 'Ukládám…';
    try {
        const updated = await apiFetch('/api/user-info', {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ first_name: fname, last_name: lname, sex: gender, age: currentUser.age })
        });
        if (photo) {
            const fd = new FormData();
            fd.append('profile-image', photo);
            const res = await fetch(API + '/api/upload-avatar', {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
            });
            const avatarData = await res.json();
            if (!res.ok) throw new Error(avatarData.error || 'Chyba nahrání obrázku');
            updated.profile_image = avatarData.profile_image_url.replace('/api/static/uploads/', '');
        }
        setAuth(token, { ...currentUser, ...updated });
        renderNavbar();
        closeProfileModal();
    } catch(e) {
        showErr(err, e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Uložit';
    }
}

// ─── HELPERS ─────────────────────────────────────────────────
function showErr(el, msg) { el.textContent = msg; el.style.display = ''; }
function esc(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleString('cs-CZ', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ─── INIT ────────────────────────────────────────────────────
if (token) { navigate('wall'); }
else { navigate('login'); }