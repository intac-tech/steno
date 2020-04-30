import { Injectable } from "@nestjs/common";
import { Connection } from "src/db/connection";
import { SqlTemplate, StenoTemplate } from "./model";
import { StenoTemplateService } from "./steno.template";

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
            const [tables] = await conn.execute('show tables');
            const result = [];
            for(const tbl of tables) {
                const table = tbl.Tables_in_steno;
                if(!table.startsWith('steno_')) {
                    const [desc] = await conn.execute(`desc ${table}`);
                    result.push({
                        table: table,
                        fields: desc.map(o => ({
                            name: o.Field,
                            type: o.Type,
                            nullable: o.Null,
                            key: o.Key,
                            default: o.Default
                        }))
                    });
                }
            }
    
            return result;
        });
    }
}