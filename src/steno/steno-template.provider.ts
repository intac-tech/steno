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
}