import { Injectable } from "@nestjs/common";
import { Pool } from "pg";

@Injectable()
export class Connection {
    private pool: Pool;
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        })
    }

    async connection() {
        return await this.pool.connect();
    }

    async transaction<T>(handler: (connection) => Promise<T>) {
        const client = await this.connection();
        try {
            await client.query('BEGIN');
            const resp = await handler(client);
            await client.query('COMMIT');
            return resp;
        } catch (e) {
            console.error(e);
            await client.query('ROLLBACK').catch((err) => console.error(err));
        } finally {
            client.release();
        }
    }
}