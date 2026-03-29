import getPool from "../db/db.mjs";

export async function likePost(req, res) {
    let userId = req.user.id;
    let { postId } = req.body;
    const db = await getPool();

    

}