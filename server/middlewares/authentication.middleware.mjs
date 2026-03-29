import jwt from 'jsonwebtoken';

export default function jwtAuthMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ message: "Chybí token" });
    }

    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: "Neplatný formát tokenu" });
    }

    try {
        req.user = jwt.verify(token, process.env.APP_JWT_SECRET); // např. { id, role }
        next();
    } catch (err) {
        return res.status(403).json({ message: "Neplatný nebo expirovaný token" });
    }
}

