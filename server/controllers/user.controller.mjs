import getPool from "../db/db.mjs";

export async function userInfoById(req, res) {
    let userId = req.params.id;
    const db = await getPool();

    let [rows] = await db.query("SELECT u.user_id, u.username, u.first_name, u.last_name, u.sex, u.age, u.profile_image, COUNT(p.post_id) as post_count, COUNT(l.post_id) as like_count FROM users u LEFT JOIN posts p ON p.user_id = u.user_id LEFT JOIN likes l ON l.user_id = u.user_id WHERE u.user_id = ? GROUP BY u.first_name, u.last_name, u.sex, u.age, u.profile_image", [userId]);
    let user = rows[0];

    if (!user) {
        return res.status(404).json({ message: "Uživatel nenalezen" });
    }

    res.status(200).json(user);
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