import getPool from "../db/db.mjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function login(req, res) {
        const db = await getPool();
        const { username, password } = req.body;

        const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

        const user = rows[0];

        if (!user) {
            console.log("User not found");
            res.status(403).send();
        }

        const pass_hash = crypto.pbkdf2Sync(
            password,
            user.password_salt,
            100000,
            64,
            'sha512'
        );

        if (!crypto.timingSafeEqual(pass_hash, user.password_hash)) {
            res.status(403).send();
        }

        const token = jwt.sign({ id: user.user_id, username: user.username, role: user.role }, process.env.APP_JWT_SECRET, {expiresIn: "1h"});
        res.status(200).send({"token": token});
}

export async function register(req, res) {
        const db = await getPool();
        const { username, password, first_name, last_name, age, sex } = req.body;

        if(age < 13) {
                res.status(400).json({message: "Minimal age needed for registration is 13"});
        }

        const password_salt = crypto.randomBytes(16).toString("hex");
        const password_hash = crypto.pbkdf2Sync(
            password,
            password_salt,
            100000,
            64,
            'sha512'
        );

        let [result] = await db.query('INSERT INTO users(username, password_hash, password_salt, first_name, last_name, age, sex) VALUES (?, ?, ?, ?, ?, ?, ?)',[username, password_hash, password_salt, first_name, last_name, age, sex]);
        const token = jwt.sign({ id: result.insertId, username: username, role: "user" }, process.env.APP_JWT_SECRET, {expiresIn: "1h"});
        res.status(200).send({"token": token});
}