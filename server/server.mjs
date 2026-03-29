import express from 'express';
import cors from 'cors';
import getPool from "./db/db.mjs";
import crypto from "crypto";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import jwtAuthMiddleware from "./middlewares/authentication.middleware.mjs";
import * as AuthController from "./controllers/auth.controller.mjs";
import * as ImageController from "./controllers/image.controller.mjs";
import {upload} from "./middlewares/image.middleware.mjs";
import * as UserController from "./controllers/user.controller.mjs";
import * as PostController from "./controllers/post.controller.mjs";

ensureJwtSecret();
getPool();

const app = express();
const port = process.env.APP_PORT || 3000;
app.use('/api/static', express.static('static'));

app.use(cors());
app.use(express.json());

app.post("/api/login", AuthController.login);
app.post("/api/register", AuthController.register);
app.post("/api/upload-avatar", jwtAuthMiddleware, upload.single('profile-image'), ImageController.uploadAvatar);
app.get("/api/user-info", UserController.userInfo);
app.post("/api/user-info", jwtAuthMiddleware, UserController.editUserInfo);
app.post("/api/post", jwtAuthMiddleware, PostController.newPost);
app.delete("/api/post/:id", jwtAuthMiddleware, PostController.deletePost);
app.put("/api/post/:id", jwtAuthMiddleware, PostController.updatePost);
app.post("/api/post-image/:id", jwtAuthMiddleware, upload.single('post-image'), ImageController.uploadPostImage);
app.get("/api/posts", PostController.getAllPosts);
app.post("/api/like-post", jwtAuthMiddleware, PostController.likePost);



app.listen(port, () => {
    console.log(`KsichtKniha server listening on port ${port}`)
})




function ensureJwtSecret() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.join(__dirname, ".env");

    let envContent = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, "utf8")
        : "";

    if (!process.env.APP_JWT_SECRET) {
        const newSecret = crypto.randomBytes(64).toString("hex");
        if (envContent.includes("APP_JWT_SECRET=")) {
            envContent = envContent.replace(
                /APP_JWT_SECRET=.*/g,
                `APP_JWT_SECRET=${newSecret}`
            );
        } else {
            envContent += `\nAPP_JWT_SECRET=${newSecret}`;
        }

        fs.writeFileSync(envPath, envContent);

        process.env.APP_JWT_SECRET = newSecret;

        console.log("JWT_SECRET vytvořen a uložen:", newSecret);
    }
}