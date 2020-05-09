import { Injectable } from "@nestjs/common";
import { Pool } from "pg";

const pool = new Pool({
    host: process.env.STENO_DB_HOST,
    port: parseInt(process.env.STENO_DB_PORT),
    user: process.env.STENO_DB_USER,
    password: process.env.STENO_DB_PASSWORD,
    database: process.env.STENO_DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

@Injectable()
export class Connection {

    async connection() {
        return await pool.connect();
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