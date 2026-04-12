import getPool from "../db/db.mjs";

export async function userInfoById(req, res) {
    let userId = req.params.id;
    const db = await getPool();

    let [rows] = await db.query("SELECT u.user_id, u.username, u.first_name, u.last_name, u.sex, u.age, u.profile_image, COUNT(DISTINCT p.post_id) as post_count, COUNT(DISTINCT l.post_id) as like_count FROM users u LEFT JOIN posts p ON p.user_id = u.user_id LEFT JOIN likes l ON l.user_id = u.user_id WHERE u.user_id = ? GROUP BY u.first_name, u.last_name, u.sex, u.age, u.profile_image", [userId]);
    let user = rows[0];

    if (!user) {
        return res.status(404).json({ message: "Uživatel nenalezen" });
    }

    res.status(200).json(user);
}

export async function userDetailPosts(req, res) {
    const userId = req.params.id;
    const db = await getPool();

    // Každý SELECT má stejné sloupce jako /api/posts, aby je frontend mohl renderovat stejně.
    // current_user_id pochází z JWT (req.user.user_id) pro výpočet liked_by_me.
    const currentUserId = req.user?.user_id ?? 0;

    const sql = `
        SELECT
            p.post_id,
            p.title,
            p.body,
            p.image,
            p.created_at,
            p.user_id        AS author_id,
            u.first_name,
            u.last_name,
            u.profile_image  AS user_image,
            COUNT(DISTINCT l.user_id)                                    AS like_count,
            COUNT(DISTINCT c.comment_id)                                 AS comment_count,
            CASE WHEN EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.post_id) THEN 'liked' ELSE NULL END AS liked_by_me,
            'own'            AS relation
        FROM posts p
        JOIN users u ON u.user_id = p.user_id
        LEFT JOIN likes l     ON l.post_id = p.post_id
        LEFT JOIN comments c  ON c.post_id = p.post_id
        LEFT JOIN likes l_me  ON l_me.post_id = p.post_id AND l_me.user_id = ?
        WHERE p.user_id = ?
        GROUP BY p.post_id
 
        UNION
 
        SELECT
            p.post_id,
            p.title,
            p.body,
            p.image,
            p.created_at,
            p.user_id        AS author_id,
            u.first_name,
            u.last_name,
            u.profile_image  AS user_image,
            COUNT(DISTINCT l.user_id)                                    AS like_count,
            COUNT(DISTINCT c.comment_id)                                 AS comment_count,
            CASE WHEN EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.post_id) THEN 'liked' ELSE NULL END AS liked_by_me,
            'liked'          AS relation
        FROM posts p
        JOIN users u   ON u.user_id = p.user_id
        JOIN likes ul  ON ul.post_id = p.post_id AND ul.user_id = ?
        LEFT JOIN likes l     ON l.post_id = p.post_id
        LEFT JOIN comments c  ON c.post_id = p.post_id
        LEFT JOIN likes l_me  ON l_me.post_id = p.post_id AND l_me.user_id = ?
        GROUP BY p.post_id
 
        UNION
 
        SELECT
            p.post_id,
            p.title,
            p.body,
            p.image,
            p.created_at,
            p.user_id        AS author_id,
            u.first_name,
            u.last_name,
            u.profile_image  AS user_image,
            COUNT(DISTINCT l.user_id)                                    AS like_count,
            COUNT(DISTINCT c.comment_id)                                 AS comment_count,
            CASE WHEN EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.post_id) THEN 'liked' ELSE NULL END AS liked_by_me,
            'commented'      AS relation
        FROM posts p
        JOIN users u    ON u.user_id = p.user_id
        JOIN comments uc ON uc.post_id = p.post_id AND uc.user_id = ?
        LEFT JOIN likes l     ON l.post_id = p.post_id
        LEFT JOIN comments c  ON c.post_id = p.post_id
        LEFT JOIN likes l_me  ON l_me.post_id = p.post_id AND l_me.user_id = ?
        GROUP BY p.post_id
 
        ORDER BY created_at DESC
    `;

    // Parametry v pořadí dle otazníků výše:
    // 'own':       [currentUserId, userId]
    // 'liked':     [userId, currentUserId, userId]
    // 'commented': [userId, currentUserId, userId]
    const params = [
        userId, currentUserId, userId,          // own
        userId, userId, currentUserId, userId,  // liked
        userId, userId, currentUserId, userId,  // commented
    ];

    const [rows] = await db.query(sql, params);
    res.status(200).json(rows);
}


export async function editUserInfo(req, res) {
    let userId = req.user.id;
    let db = await getPool(userId);
    const { first_name, last_name, age, sex } = req.body;
    try {
        await db.query("UPDATE users SET first_name = ?, last_name = ?, age = ?, sex = ?", [first_name, last_name, age, sex]);
        let [user] = await db.query("SELECT user_id, username, first_name, last_name, age, sex, profile_image FROM users WHERE user_id = ?", [userId]);
        res.status(200).json(user[0]);
    } catch (error) {
        res.status(400).send({error: error.message});
    }
}

export async function userInfo(req, res) {
    let userId = req.user.id;
    const db = await getPool();

    let [rows] = await db.query("SELECT user_id, username, first_name, last_name, age, sex, profile_image FROM users WHERE user_id = ?", [userId]);
    let user = rows[0];

    if (!user) {
        return res.status(404).json({ message: "Uživatel nenalezen" });
    }

    res.status(200).json(user);
}

export async function getUsers(req, res) {
    try {
        let db = await getPool();
        let [rows] = await db.query("SELECT u.user_id, u.first_name, u.last_name, u.sex, u.age, u.profile_image, COUNT(p.post_id) as post_count FROM users u LEFT JOIN posts p ON p.user_id = u.user_id GROUP BY u.first_name, u.last_name, u.sex, u.age, u.profile_image");

        res.status(200).json(rows);
    } catch(error) {
        res.status(400).send({error: error.message});
    }
}