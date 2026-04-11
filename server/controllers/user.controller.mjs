import getPool from "../db/db.mjs";

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
    console.log("Fetching user info for user: ", userId);
    const db = await getPool();

    let [rows] = await db.query("SELECT user_id, username, first_name, last_name, age, sex, profile_image FROM users WHERE user_id = ?", [userId]);
    let user = rows[0];

    if (!user) {
        return res.status(404).json({ message: "Uživatel nenalezen" });
    }

    res.status(200).json(user);
}