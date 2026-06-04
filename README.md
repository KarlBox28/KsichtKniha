# KsichtKniha

A student social network built with **Express.js** and a vanilla JavaScript SPA frontend. Users can register, post rich-text content, like and comment on posts, and browse other members' profiles and activity.

> **KsichtKniha** = Czech slang for "FaceBook" — *ksicht* (face) + *kniha* (book).

---

## Features

- **Auth** — register (age 13+ enforced), login via JWT, bcrypt-hashed passwords
- **Wall** — global feed, Quill rich-text editor, optional image upload, edit/delete own posts
- **Likes** — toggle like, inline count, expandable list of who liked and when
- **Comments** — per-post comments sorted newest-first
- **Users** — directory sorted by surname with post counts
- **Profile** — user detail with four activity tabs (Posts / Liked / Commented / All), editable from the navbar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Web framework | Express.js |
| Database | MySQL (via `mysql2`) |
| Authentication | JWT (`jsonwebtoken`) + bcrypt |
| File uploads | Multer |
| Rich-text editor | Quill.js 1.3.7 |
| Frontend | Vanilla JS SPA (no build step) |
| Styling | Custom CSS — Google Fonts (Syne + Plus Jakarta Sans) |

---

## Project Structure

```
├── server.mjs                  # Entry point — Express app, routes
├── .env                        # Environment variables (see setup)
├── db/
│   └── db.mjs                  # MySQL connection pool
├── controllers/
│   ├── auth.controller.mjs     # login, register
│   ├── user.controller.mjs     # getUsers, userInfo, userInfoById, editUserInfo, userDetailPosts
│   ├── post.controller.mjs     # newPost, updatePost, deletePost, getAllPosts, likePost, postLikes, postComments, comment
│   └── image.controller.mjs    # uploadAvatar, uploadPostImage
├── middlewares/
│   ├── authentication.middleware.mjs  # JWT verification
│   ├── image.middleware.mjs           # Multer configuration
│   └── logging.middleware.mjs         # Request logger
├── static/
│   └── uploads/                # Uploaded images (auto-created on startup)
└── frontend/
    ├── index.html              # Shell — navbar, modals, CDN scripts
    ├── index.js                # SPA logic — routing, rendering, API calls
    └── styles.css              # All styles
```

---

## API Reference

All endpoints except `/api/login` and `/api/register` require a `Bearer` token in the `Authorization` header.

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/login` | Log in, returns `{ token }` |
| `POST` | `/api/register` | Create account, returns `{ token }` |

### Users
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users` | List all users (sorted by surname) |
| `GET` | `/api/user-info` | Current user's profile |
| `GET` | `/api/user-info/:id` | Profile + post/like counts for user `id` |
| `POST` | `/api/user-info` | Update current user's profile |
| `POST` | `/api/upload-avatar` | Upload profile photo (`multipart/form-data`, field `profile-image`) |
| `GET` | `/api/user-detail-posts/:id` | All posts authored / liked / commented by user `id` |

### Posts
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/posts` | All posts, newest first, with like/comment counts and `liked_by_me` |
| `POST` | `/api/post` | Create post `{ title, body }` |
| `PUT` | `/api/post/:id` | Update post `{ title, body }` (owner only) |
| `DELETE` | `/api/post/:id` | Delete post (owner only) |
| `POST` | `/api/post-image/:id` | Attach image to post (`multipart/form-data`, field `post-image`) |

### Likes & Comments
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/like-post` | Toggle like `{ postId }` |
| `GET` | `/api/post-likes/:id` | List of users who liked post `id` |
| `POST` | `/api/comment` | Add comment `{ postId, body }` |
| `GET` | `/api/post-comments/:id` | Comments for post `id`, newest first |

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ksichtkniha
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example env file and fill in your values:

```bash
cp _env .env
```

```env
APP_PORT=3000

# Leave blank — a secret is generated automatically on first run
APP_JWT_SECRET=

# MySQL connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ksichtkniha
```

> `APP_JWT_SECRET` is auto-generated and written to `.env` on first startup if left empty.

### 4. Import the database

```bash
mysql -u your_db_user -p ksichtkniha < database/export.sql
```

### 5. Start the server

```bash
node server.mjs
```

The app is now running at [http://localhost:3000](http://localhost:3000).

---

## Security Notes

- All database queries use **parameterized statements** (mysql2) — no raw string interpolation
- Passwords hashed with **bcrypt** before storage
- JWTs signed with a randomly generated 64-byte secret
- Post body HTML is rendered as-is from Quill; it is strongly recommended to sanitize it server-side with [`sanitize-html`](https://www.npmjs.com/package/sanitize-html) before saving to the database

---

## License

This project was created as a school assignment. No license is applied.
