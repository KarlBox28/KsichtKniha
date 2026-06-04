# KsichtKniha — API Documentation

Base URL: `http://localhost:3000`

All endpoints except **Login** and **Register** require a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Auth

### POST `/api/login`

```json
{
  "username": "jan.novak",
  "password": "tajneheslo"
}
```

**Response `200`**
```json
{
  "token": "<jwt>"
}
```

**Response `401`**
```json
{ "message": "Invalid credentials" }
```

---

### POST `/api/register`

```json
{
  "first_name": "Jan",
  "last_name":  "Novák",
  "username":   "jan.novak",
  "password":   "tajneheslo",
  "age":        17,
  "sex":        "M"
}
```

`sex` — `"M"` | `"F"` | `"O"`

**Response `200`**
```json
{
  "token": "<jwt>"
}
```

**Response `400`**
```json
{ "message": "Username already taken" }
```

---

## Users

### GET `/api/users`

No body. Returns all users sorted by surname.

**Response `200`**
```json
[
  {
    "user_id":       1,
    "username":      "jan.novak",
    "first_name":    "Jan",
    "last_name":     "Novák",
    "sex":           "M",
    "age":           17,
    "profile_image": "abc123.jpg",
    "post_count":    5
  }
]
```

`profile_image` — filename only; full URL is `/api/static/uploads/<profile_image>`. `null` when no photo uploaded.

---

### GET `/api/user-info`

No body. Returns the profile of the currently authenticated user.

**Response `200`**
```json
{
  "user_id":       1,
  "username":      "jan.novak",
  "first_name":    "Jan",
  "last_name":     "Novák",
  "sex":           "M",
  "age":           17,
  "profile_image": "abc123.jpg"
}
```

---

### GET `/api/user-info/:id`

No body.

**Response `200`**
```json
{
  "user_id":       1,
  "username":      "jan.novak",
  "first_name":    "Jan",
  "last_name":     "Novák",
  "sex":           "M",
  "age":           17,
  "profile_image": "abc123.jpg",
  "post_count":    5,
  "like_count":    12
}
```

**Response `404`**
```json
{ "message": "Uživatel nenalezen" }
```

---

### POST `/api/user-info`

Updates the authenticated user's profile.

```json
{
  "first_name": "Jan",
  "last_name":  "Novák",
  "sex":        "M",
  "age":        17
}
```

**Response `200`**
```json
{
  "first_name": "Jan",
  "last_name":  "Novák",
  "sex":        "M",
  "age":        17
}
```

---

### POST `/api/upload-avatar`

`Content-Type: multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `profile-image` | file | Image file (jpg, png, …) |

**Response `200`**
```json
{
  "profile_image_url": "/api/static/uploads/abc123.jpg"
}
```

---

### GET `/api/user-detail-posts/:id`

Returns all posts the user authored, liked, or commented on. Each row has an extra `relation` field.

**Response `200`**
```json
[
  {
    "post_id":       3,
    "title":         "Ahoj světe",
    "body":          "<p>Text příspěvku</p>",
    "image":         "img456.jpg",
    "created_at":    "2025-03-01T10:00:00.000Z",
    "author_id":     1,
    "first_name":    "Jan",
    "last_name":     "Novák",
    "user_image":    "abc123.jpg",
    "like_count":    4,
    "comment_count": 2,
    "liked_by_me":   1,
    "relation":      "own"
  }
]
```

`relation` — `"own"` | `"liked"` | `"commented"`

`liked_by_me` — `1` if the requesting user has liked the post, `0` otherwise.

---

## Posts

### GET `/api/posts`

No body. Returns all posts newest-first.

**Response `200`**
```json
[
  {
    "post_id":       3,
    "title":         "Ahoj světe",
    "body":          "<p>Text příspěvku</p>",
    "image":         "img456.jpg",
    "created_at":    "2025-03-01T10:00:00.000Z",
    "author_id":     1,
    "first_name":    "Jan",
    "last_name":     "Novák",
    "user_image":    "abc123.jpg",
    "like_count":    4,
    "comment_count": 2,
    "liked_by_me":   "liked"
  }
]
```

`liked_by_me` — `"liked"` if the requesting user has liked the post, `null` otherwise.

`body` — HTML string from the Quill editor.

`image` / `user_image` — filename only; full URL is `/api/static/uploads/<filename>`. `null` if none.

---

### POST `/api/post`

```json
{
  "title": "Nadpis příspěvku",
  "body":  "<p>HTML obsah z Quillu</p>"
}
```

`title` is optional.

**Response `200`**
```json
{ "insertId": 7 }
```

Use `insertId` immediately after to upload a post image via `/api/post-image/:id`.

---

### PUT `/api/post/:id`

Owner only.

```json
{
  "title": "Upravený nadpis",
  "body":  "<p>Upravený obsah</p>"
}
```

**Response `200`** — empty body

**Response `403`** — not the owner

---

### DELETE `/api/post/:id`

No body. Owner only. Also deletes the associated image file from disk.

**Response `200`** — empty body

**Response `403`** — not the owner

---

### POST `/api/post-image/:id`

`Content-Type: multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `post-image` | file | Image to attach to the post |

**Response `200`** — empty body

---

## Likes

### POST `/api/like-post`

Toggles like on/off — one call to like, another to unlike.

```json
{ "postId": 3 }
```

**Response `200`** — empty body

---

### GET `/api/post-likes/:id`

No body.

**Response `200`**
```json
[
  {
    "first_name":    "Jana",
    "last_name":     "Dvořáková",
    "profile_image": "xyz789.jpg",
    "liked_at":      "2025-03-02T14:23:00.000Z"
  }
]
```

---

## Comments

### POST `/api/comment`

```json
{
  "postId": 3,
  "body":   "Skvělý příspěvek!"
}
```

**Response `200`** — empty body

---

### GET `/api/post-comments/:id`

No body.

**Response `200`**
```json
[
  {
    "first_name":    "Jana",
    "last_name":     "Dvořáková",
    "profile_image": "xyz789.jpg",
    "body":          "Skvělý příspěvek!",
    "commented_at":  "2025-03-02T14:30:00.000Z"
  }
]
```

Results are sorted newest-first.

---

## Error format

All error responses follow the same shape:

```json
{ "message": "Human-readable error description" }
```

or

```json
{ "error": "Human-readable error description" }
```

HTTP status codes used: `200` success, `400` bad request, `401` unauthorized, `403` forbidden, `404` not found, `500` server error.
