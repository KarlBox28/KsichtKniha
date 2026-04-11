import getPool from "../db/db.mjs";

export async function comment(req, res) {
    try {
        const db = await getPool();
        const { postId, body } = req.body;
        await db.query("INSERT INTO comments(user_id, post_id, body) VALUES (?, ?, ?)", [req.user.id, postId, body]);
        res.status(200).send();
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}


export async function postLikes(req, res) {
    try {
        const db = await getPool();
        let [result] = await db.query("SELECT u.first_name, u.last_name, u.profile_image, l.liked_at FROM likes l INNER JOIN users u ON l.user_id = u.user_id WHERE post_id = ?", [req.params.id]);
        console.log(result);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}

export async function postComments(req, res) {
    try {
        const db = await getPool();
        let [result] = await db.query("SELECT u.first_name, u.last_name, u.profile_image, c.commented_at, c.body FROM comments c INNER JOIN users u ON u.user_id = c.user_id WHERE c.post_id = ?", [req.params.id]);
        console.log(result);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}


export async function newPost(req, res) {
    try {
        const db = await getPool();
        const userId = req.user.id;
        const { title, body } = req.body;

        let [result] = await db.query("INSERT INTO posts(user_id, title, body) VALUES (?, ?, ?)", [userId, title, body]);
        res.status(200).send({ insertId: result.insertId });
    } catch (error) {
        res.status(400).send({error: error.message});
    }
}

export async function deletePost(req, res) {
    try {
        const db = await getPool();
        const userId = req.user.id;
        const id = req.params.id;

        let [rows] = await db.query("SELECT * FROM posts WHERE post_id = ?", [id]);
        let post = rows[0];

        if(!post) { res.status(400).send({error: "Post not found"}); }

        if (post.image) {
            // Odstranění starého obrázku z disku
            const fs = await import('fs/promises');
            const path = await import('path');
            const oldImagePath = path.join('static', 'uploads', post.image);
            await fs.rm(oldImagePath);
        }

        if(post.user_id !== userId) { res.status(403).send(); }

        await db.query("DELETE FROM posts WHERE post_id = ?", [id]);

        res.status(200).send();
    } catch (error) {
        res.status(400).send({error: error.message});
    }
}

export async function updatePost(req, res) {
    try {
        const db = await getPool();
        const userId = req.user.id;
        const id = req.params.id;
        const { title, body } = req.body;

        let [rows] = await db.query("SELECT * FROM posts WHERE post_id = ?", [id]);
        let post = rows[0];

        if(!post) { res.status(400).send({error: "Post not found"}); }

        if(post.user_id !== userId) { res.status(403).send(); }

        let result = await db.query("UPDATE posts SET title = ?, body = ? WHERE post_id = ?", [title, body, id]);

        res.status(200).send();

    } catch (error) {
        res.status(400).send({error: error.message});
    }
}

export async function getAllPosts(req, res) {
    const db = await getPool();

    let [posts] = await db.query("SELECT p.post_id, p.title, p.body, p.user_id AS author_id, u.first_name, u.last_name, u.profile_image AS user_image, p.image, p.created_at, COUNT(l.user_id) AS like_count, COUNT(c.comment_id) AS comment_count, CASE WHEN (SELECT liked_at FROM likes WHERE user_id = ? AND post_id = p.post_id LIMIT 1) IS NOT NULL THEN 'liked' ELSE NULL END AS liked_by_me FROM posts p LEFT JOIN users u ON p.user_id = u.user_id LEFT JOIN likes l ON l.post_id = p.post_id LEFT JOIN comments c ON c.post_id = p.post_id GROUP BY p.post_id, p.title, p.body, p.user_id, u.first_name, u.last_name, u.profile_image, p.image, p.created_at ORDER BY p.created_at DESC;", [req.user.id]);
    res.status(200).send(posts);
}

export async function likePost(req, res) {
    try {
        let userId = req.user.id;
        const { postId } = req.body;
        const db = await getPool();

        console.log(`User ${userId} is trying to like/unlike post ${postId}`);

        let [likes] = await db.query("SELECT COUNT(post_id) as count FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId]);

        if(likes[0].count === 0) {
            //nema liknuto a chce liknout
            await db.query("INSERT INTO likes(user_id, post_id) VALUES (?, ?)", [userId, postId])
            res.status(200).send();
        } else {
            //odebrat like
            await db.query("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
            res.status(200).send();
        }
    } catch (error) {
        res.status(400).send({error: error.message});
    }
}