import { PoolConnection } from "mysql2/promise";
import { mysql } from 'yesql';
import { SqlTemplate, StenoTemplate } from "./model";

export class StenoTemplateService {
    constructor(public connection: PoolConnection) {}

    async getStenoTemplates(names: string[]) {
        const sql = mysql('SELECT p.* FROM steno.sql_prepared_template p WHERE p.spt_name IN (:names) ')({ names });
        const [results] = await this.connection.query(sql);
        return (results as any).map(o => ({
            name: o.spt_name,
            template: JSON.parse(o.spt_template.toString('utf8')),
            version: o.spt_version
        }));
    }

    async getSqlTemplates(names: string[]) {
        const sql = mysql(`SELECT s.* FROM steno.sql_template s WHERE CONCAT(s.st_group,':',s.st_name) IN (:names)`)({names});
        const [results] = await this.connection.query(sql)
        return (results as any).map(o => ({
            name: o.st_name,
            group: o.st_group,
            sql: o.st_sql.toString('utf8'),
            version: o.st_version
        }));
    }

    async saveSqlTemplate(template: SqlTemplate) {
        const insertSql = mysql(`
            INSERT INTO steno.sql_template (st_group, st_name, st_sql)
            VALUES (:group, :name, :sql)
            ON DUPLICATE KEY UPDATE st_sql = :sql, st_version = st_version + 1, st_update_dt = now();
        `)(template);
        await this.connection.query(insertSql);

        const selectSql = mysql('SELECT * FROM steno.sql_template WHERE st_group = :group AND st_name = :name')(template);
        const [results] = await this.connection.query(selectSql);
        (results as any).forEach(async rec => {
            const insertLogSql = mysql(`
                INSERT INTO steno.sql_template_log (st_group, st_name, st_sql, st_version, st_update_dt, st_create_dt)
                VALUES (:st_group, :st_name, :st_sql, :st_version, :st_update_dt, :st_create_dt);
            `)(rec);
            await this.connection.query(insertLogSql);
        });
        const response = await this.getSqlTemplates([ `${template.group}:${template.name}`]);
        return response.find(o => !!o);
    }


    async saveStenoTemplate(template: StenoTemplate) {
        const insertSql = mysql(`
            INSERT INTO steno.sql_prepared_template (spt_name, spt_template)
            VALUES(:name, :template)
            ON DUPLICATE KEY UPDATE spt_template = :template, spt_version = spt_version + 1, spt_update_dt = NOW();
        `)(template);

        await this.connection.query(insertSql);
        const selectSql = mysql(`SELECT * FROM steno.sql_prepared_template WHERE spt_name = :name`)(template);
        const [results] = await this.connection.query(selectSql);
        (results as any).forEach(async rec => {
            const insertLogSql = mysql(`
                INSERT INTO steno.sql_prepared_template_log (spt_name, spt_template, spt_version, spt_create_dt, spt_update_dt) 
                VALUES (:spt_name, :spt_template, :spt_version, :spt_create_dt, :spt_update_dt);
            `)(rec);
            await this.connection.query(insertLogSql);
        });

        const response = await this.getStenoTemplates([template.name]);
        return response.find(o => !!o);
    }
}