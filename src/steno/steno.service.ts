import { StenoRequest } from "./model";
import { StenoTemplateService } from "./steno.template";
import { resolveProperty, VARIABLE_PATTERN } from "src/common/util";
import { pg } from "yesql";

class VariableHolder {
    private evaluatedVariables = {};
    constructor(public variables: any) {}

    evaluate(prop: string) {
        if(VARIABLE_PATTERN.test(prop)) {
            let value = this.evaluatedVariables[prop];
            if(!value) {
                value = resolveProperty(prop, this.variables);
                if(value !== prop) {
                    this.evaluatedVariables[prop] = value;
                }
            }
            return value;
        }
        return prop;
    }

    set(name, value: any) {
        this.variables[name] = value;
    }
}

export class StenoService {
    constructor(public templateSvc: StenoTemplateService) {}

    async execute(request: StenoRequest) {
        const templateKeys = (obj) => Object.keys(obj)
                                            .map(key => {
                                                const [alias, name] = key.split('@');
                                                return { 
                                                    alias: alias,
                                                    name: name || alias,
                                                    request: obj[key] 
                                                };
                                            })
                                            .sort((a, b) => {
                                                const priorityA = a.request.priority || 0;
                                                const priorityB = a.request.priority || 0;

                                                return (priorityA - priorityB) * -1;
                                            });

        const variables = new VariableHolder(request.variables || {});
        const mutationsKeys = templateKeys(request.mutation || {});
        const queryKeys = templateKeys(request.query || {});
        const names = mutationsKeys.map(o => o.name).concat(queryKeys.map(o => o.name));
        const templates = await this.templateSvc.getSqlTemplates(names);

        // TODO: check template permissions
        
        const mutationResponse  = await this.executeSql(mutationsKeys, templates, variables, true);
        const queryResponse = await this.executeSql(queryKeys, templates, variables);
        const response = {};
        
        Object.keys(mutationResponse.response)
              .forEach(k => response[k] = mutationResponse.response[k]);

        Object.keys(queryResponse.response)
              .forEach(k => response[k] = queryResponse.response[k]);
        
        return { response, hasError: mutationResponse.hasError || queryResponse.hasError };
    }

    private async executeSql(keys: any[], templates: any[], variables: VariableHolder,  mutation?: boolean) {
        const response = {};
        let hasError = false;
        for await (const name of keys) {
            const sqlTemplate = templates.find(o => `${o.group}:${o.name}` === name.name);
            if (!sqlTemplate) {
                response[name.alias] = { error: { code: 100, message: `Template not found ${name}` } };
            } else {
                response[name.alias] = await this.executeSqlTemplate(sqlTemplate, name, variables, mutation)
                                                 .catch((e) => ({ error: { code: 101, message: JSON.stringify(e) } }));
                if(!!response[name.alias].error) {
                    hasError = true;
                }
            }
        }

        if (hasError && mutation) {
            Object.values(response)
                  .filter((o: any) => !o.error)
                  .map((o: any) => {
                    o.error = { code: 102, message: 'Transaction Error' }
                  });
        }

        return { response, hasError };
    }

    private evaluate(obj: any, variables: VariableHolder) {
        if(typeof(obj) === 'string') {
            obj = variables.evaluate(obj);
            if(typeof(obj) === 'object') {
                obj = this.evaluate(obj, variables);
            }

        } else if(Array.isArray(obj)) {
            obj.forEach((o, i) => {
                obj[i] = this.evaluate(o, variables);
            });
        } else if (typeof(obj) === 'object') {
            const paramKeys = Object.keys(obj);
            paramKeys.forEach(k => {
                const val = obj[k];
                const typeK = typeof(val);
                const isString = typeK === 'string';
                if(isString && VARIABLE_PATTERN.test(val)) {
                    obj[k] = variables.evaluate(val);
                }
            });
        }
        return obj;
    }

    private async executeSqlTemplate(sqlTemplate, name, variables: VariableHolder, mutation = false) {
        const request = name.request;
        let params = this.evaluate(request.params || {}, variables);
        const conn = this.templateSvc.connection;
        const sql = sqlTemplate.sql;
        if (mutation) {
            if (Array.isArray(params)) {
                let results = [];
                for (const p of params) {
                    const res = await conn.query(pg(sql)(p));
                    results = results.concat(res.rows.map(o => o));
                }

                const result = {
                    count: results.length,
                    rows: results
                };

                variables.set(name.alias, result);
                return { result };
            } else {
                const response = await conn.query(pg(sql)(params));
                const result = {
                    count: response.rowCount,
                    rows: response.rows.map(o => o),
                    returned: response.rows.map(o => o).find(o => !!o)
                };
                variables.set(name.alias, result);
                return { result };
            }
        } else {
            const queryCount = `SELECT COUNT(1) as total FROM ( ${sql} ) o`;
            const query = ['SELECT o.* FROM ( ', sql, ' ) o'];
            const orderBy = request.orderBy || { columns: '', asc: false };
            const page = request.page || 0;
            const size = request.size || 25;
            const paginated = !!request.paginated;
            const singleResult = request.singleResult;
            const orderColumns = orderBy.columns.split(',')
                                        .map( o => (o || '').trim())
                                        .map( str => str.replace(new RegExp('\r?\n','g'), '') )
                                        .filter(o => !!o)
                                        .join(', ');
            if(!!orderColumns) {
                query.push(' ORDER BY ');
                query.push(orderColumns);
                query.push( orderBy.asc ? ' ASC ' : ' DESC ' );
            }

            if(paginated && page > 0) {
                const offset = size * (page - 1);
                query.push(' LIMIT ');
                query.push(size);
                query.push(' OFFSET ');
                query.push(offset);
            } else if (singleResult) {
                query.push(' LIMIT 1');
            }

            const rawSql = query.join('');
            const psSql = pg(rawSql)(params);
            console.log(`===================== ${name.name} =========================`);
            console.log(name.name, ' => ', psSql);
            console.log('======================== END ==============================');
            const results = await conn.query(psSql);
            const response = { count: undefined, result: results.rows, size: results.rowCount, page: undefined};

            if (paginated) {
                const results = await conn.query(pg(queryCount)(params));
                response.count = results.rows[0].total;
                response.page = page;
            }

            if (singleResult) {
                response.result = (response as any).result.find((o: any) => !!o);
            }

            return response;
        }
    }
}