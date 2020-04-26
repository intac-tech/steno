import { Injectable } from "@nestjs/common";
import { Connection } from "src/db/connection";
import { SqlTemplate, StenoTemplate } from "./model";
import { StenoTemplateService } from "./steno.template";

@Injectable()
export class StenoTemplateProvider {
    constructor(private connection: Connection) {}

    async getSqlTemplates(names: string[]) {
        return await this.connection.transaction(async (conn) => {
            const sql = new StenoTemplateService(conn);
            return await sql.getSqlTemplates(names);
        });
    }

    async getStenoTemplates(names: string[]) {
        return await this.connection.transaction(async (conn) => {
            const sql = new StenoTemplateService(conn);
            return await sql.getStenoTemplates(names);
        });
    }

    async saveTemplate(template: SqlTemplate) {
        return await this.connection.transaction(async (conn) => {
            const sql = new StenoTemplateService(conn);
            return await sql.saveSqlTemplate(template)
        });
    }

    async saveStenoTemplate(template: StenoTemplate) {
        return await this.connection.transaction(async (conn) => {
            const sql = new StenoTemplateService(conn);
            return await sql.saveStenoTemplate(template);
        });
    }
}