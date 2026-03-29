import mysql from 'mysql2/promise';

let pool;
export default async function getPool() {
    try {
        if (!pool) {
            pool = mysql.createPool({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
            });
        }

        await pool.query("SELECT 1");
        return pool;
    } catch (ex) {
        console.error(ex.message);
    }
}