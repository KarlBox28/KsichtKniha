//js/wall.js
import { requireAuth } from './utils.js';
import { renderNav } from './nav.js';
import { fetchPosts, renderPosts, initNewPostForm, saveEditPost, closeEditModal } from './posts.js';

requireAuth();
renderNav('wall');

const postsContainer = document.getElementById('posts-container');

async function reload() {
  postsContainer.innerHTML = '<div class="spinner"></div>';
  try {
    const posts = await fetchPosts();
    renderPosts(posts, postsContainer);
  } catch (e) {
    postsContainer.innerHTML = `
      <div class="form-error" style="display:block">
        Nepodařilo se načíst příspěvky: ${e.message}
      </div>`;
  }
}

// New-post form
initNewPostForm(reload);

// Edit modal buttons
document.getElementById('edit-cancel-btn').addEventListener('click', closeEditModal);
document.getElementById('edit-save-btn').addEventListener('click', () => saveEditPost(reload));

// Close modal on overlay click
document.getElementById('edit-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeEditModal();
});

// Initial load
reload();
