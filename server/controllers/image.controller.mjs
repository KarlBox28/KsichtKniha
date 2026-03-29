import getPool from "../db/db.mjs";

export async function uploadAvatar(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nebyl nahrán žádný obrázek.' });

        const db = await getPool();
        const userId = req.user.id; // předpokládáme, že uživatel je autentizovaný a máme JWT middleware
        const profile_image = req.file.filename;

        // Aktualizace uživatele v DB
        await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [profile_image, userId]);

        res.status(200).json({ message: 'Profilový obrázek aktualizován.', profile_image_url: `/api/static/uploads/${profile_image}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
export async function uploadPostImage(req, res) {

}