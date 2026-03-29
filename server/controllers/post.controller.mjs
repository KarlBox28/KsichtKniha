import getPool from "../db/db.mjs";

export async function newPost(req, res) {
    try {
        const db = await getPool();
        const userId = req.user.id;
        const { title, body } = req.body;

        let result = await db.query("INSERT INTO posts(user_id, title, body) VALUES (?, ?, ?)", [userId, title, body]);

        res.status(200).send();
    } catch (error) {
        res.status(400).send({error: error.message});
    }
}

export async function deletePost(req, res) {
    try {
        const db = await getPool();
        const userId = req.user.id;
        const id = req.params.id;

        let [rows] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
        let post = rows[0];

        if(!post) { res.status(400).send({error: "Post not found"}); }

        if(post.user_id !== userId) { res.status(403).send(); }

        await db.query("DELETE FROM posts WHERE id = ?", [id]);

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

        let [rows] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
        let post = rows[0];

        if(!post) { res.status(400).send({error: "Post not found"}); }

        if(post.id !== userId) { res.status(403).send(); }

        let result = await db.query("UPDATE posts SET title = ?, body = ? WHERE id = ?", [title, body, id]);

        res.status(200).send();

    } catch (error) {
        res.status(400).send({error: error.message});
    }
}

export async function getAllPosts(req, res) {
    const db = await getPool();

    let [posts] = await db.query("SELECT title, body, username as Author, image, posts.created_at FROM posts INNER JOIN users ON posts.user_id = users.id");
    res.status(200).send(posts);
}

export async function likePost(req, res) {
    try {
        let userId = req.user.id;
        let { postId } = req.body;
        const db = await getPool();

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