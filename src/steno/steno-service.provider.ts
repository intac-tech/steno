import { Injectable } from "@nestjs/common";
import { Connection } from "src/db/connection";
import { StenoRequest } from "./model";
import { StenoService } from "./steno.service";
import { StenoTemplateService } from "./steno.template";

@Injectable()
export class StenoProvider {
    constructor(private conn: Connection) {}

    private async executeTemplate(templateSvc: StenoTemplateService, request: StenoRequest) {
        const sqlProvider = new StenoService(templateSvc);
        const result = await sqlProvider.execute(request);
        if(result.hasError) {
            await templateSvc.rollback();
        }
        return result.response;
    }

    async execute(request: StenoRequest) {
        return await this.conn.transaction(async (conn) => await this.executeTemplate(new StenoTemplateService(conn), request));
    }
    
    async executePs(name: string, variables = {}) {
        return await this.conn.transaction(async (conn) => {
            const templateSvc = new StenoTemplateService(conn);
            const templates = await templateSvc.getStenoTemplates([name]);
            const template = templates.find(o => !!o);
            if(!template) {
                throw { error: { message: `Template ${name} not found.`, code: 105 }};
            }

            const request: StenoRequest = template.template;
            request.variables = variables;
            return await this.executeTemplate(templateSvc, request);
        });
    }

}