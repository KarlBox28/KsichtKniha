import getPool from "../db/db.mjs";

export async function uploadAvatar(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nebyl nahrán žádný obrázek.' });

        const db = await getPool();
        const userId = req.user.id; // předpokládáme, že uživatel je autentizovaný a máme JWT middleware
        const profile_image = req.file.filename;

        let [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        let user = rows[0];

        if (user.profile_image) {
            // Odstranění starého obrázku z disku
            const fs = await import('fs/promises');
            const path = await import('path');
            const oldImagePath = path.join('static', 'uploads', user.profile_image);
            await fs.rm(oldImagePath);
        }

        // Aktualizace uživatele v DB
        await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [profile_image, userId]);

        res.status(200).json({ message: 'Profilový obrázek aktualizován.', profile_image_url: `/api/static/uploads/${profile_image}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
export async function uploadPostImage(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nebyl nahrán žádný obrázek.' });

        let id = req.params.id;

        const db = await getPool();
        const userId = req.user.id; // předpokládáme, že uživatel je autentizovaný a máme JWT middleware
        const post_image = req.file.filename;

        let [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
        let post = rows[0];

        if(!post) { return res.status(400).json({ error: 'Příspěvek nenalezen.' }); }
        if(post.user_id !== userId) { return res.status(403).json({ error: 'Nemáte oprávnění upravit tento příspěvek.' }); }

        if (post.image) {
            // Odstranění starého obrázku z disku
            const fs = await import('fs/promises');
            const path = await import('path');
            const oldImagePath = path.join('static', 'uploads', post.image);
            await fs.rm(oldImagePath);

        }

        await db.query('UPDATE posts SET image = ? WHERE id = ?', [post_image, userId]);

        res.status(200).json({ message: 'Obrázek aktualizován.', profile_image_url: `/api/static/uploads/${post_image}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}