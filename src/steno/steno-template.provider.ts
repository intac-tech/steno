import { Injectable } from "@nestjs/common";
import { Connection } from "src/db/connection";
import { SqlTemplate, StenoTemplate } from "./model";
import { StenoTemplateService } from "./steno.template";
import { PoolClient } from "pg";

@Injectable()
export class StenoTemplateProvider {
    constructor(private connection: Connection) {}

    private async processOnTemplate(handler: (sql: StenoTemplateService) => Promise<any>) {
        return await this.connection.transaction(async (conn) => await handler(new StenoTemplateService(conn)));
    }

    async getSqlTemplates(names: string[]) {
        return await this.processOnTemplate(async (sql) => await sql.getSqlTemplates(names));
    }

    async getStenoTemplates(names: string[]) {
        return await this.processOnTemplate(async (sql) => await sql.getStenoTemplates(names));
    }

    async saveTemplate(template: SqlTemplate) {
        return await this.processOnTemplate(async (sql) => await sql.saveSqlTemplate(template));
    }

    async saveStenoTemplate(template: StenoTemplate) {
        return await this.processOnTemplate(async (sql) => await sql.saveStenoTemplate(template));
    }

    async getTables() {
        return await this.connection.transaction(async (conn) => {
            const result = await conn.query(`
                SELECT * FROM pg_catalog.pg_tables 
                WHERE schemaname != 'pg_catalog'
                AND schemaname != 'information_schema'
                AND schemaname != 'config'
            `);

            const tables = [];
            for (const r of result.rows) {
                tables.push({
                    schema: r.schemaname,
                    table: r.tablename,
                    columns: await this.getTableColumns(r.tablename, r.schemaname, conn)
                });
            }
            return tables;
        });
    }

    async getTableColumns(table: string, schema: string, conn: PoolClient) {
        const result = await conn.query(`
            SELECT 
            column_name,
            ordinal_position,
            is_nullable,
            data_type,
            character_maximum_length,
            column_default,
            datetime_precision
            FROM information_schema.COLUMNS
            WHERE TABLE_NAME = '${table}' AND table_schema = '${schema}';
        `);

        return result.rows;
    }

    async executeSQL(sql: string) {
        await this.connection.transaction(async (conn) => {
            return await conn.query(sql);
        });
    }
}