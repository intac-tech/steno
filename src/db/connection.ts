import { Injectable } from "@nestjs/common";
import { createPool, Pool } from "mysql2/promise";

const config = {
    host     : process.env.DB_HOST,
    port     : parseInt(process.env.DB_PORT),
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE
};

const pool = createPool(config);

@Injectable()
export class Connection {
    constructor() {}

    async connection() {
        return await pool.getConnection();
    }

    async transaction<T>(handler: (connection) => Promise<T>) {
        const conn = await this.connection();
        try {
            await conn.beginTransaction();
            const resp = await handler(conn);
            await conn.commit();
            return resp;
        } catch (e) {
            conn.rollback().catch(console.error);
            throw e;
        } finally {
            conn.release();
        }
    }
}