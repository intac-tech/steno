import { pg } from 'yesql';
import { SqlTemplate, StenoTemplate } from "./model";
import { PoolClient } from 'pg';

export class StenoTemplateService {
    constructor(public connection: PoolClient) {}

    async rollback() {
        await this.connection.query('ROLLBACK').catch((err) => console.error(err));
    }

    async getStenoTemplates(names: string[]) {
        const sql = pg('SELECT p.* FROM config.steno_prepared_template p WHERE p.spt_name = ANY (:names) ')({ names });
        const result = await this.connection.query(sql);
        return result.rows.map(o => ({
            name: o.spt_name,
            template: JSON.parse(o.spt_template.toString('utf8')),
            version: o.spt_version
        }));
    }

    async getSqlTemplates(names: string[]) {
        const sql = pg(`
            SELECT o.* FROM (
                SELECT s.*, (s.st_group || ':' || s.st_name) as group_name 
                FROM config.steno_template s 
            ) o
            WHERE o.group_name = ANY (:names)
        `)({names});
        const result = await this.connection.query(sql)
        return result.rows.map(o => ({
            name: o.st_name,
            group: o.st_group,
            sql: o.st_sql.toString('utf8'),
            version: o.st_version
        }));
    }

    async saveSqlTemplate(template: SqlTemplate) {
        const insertSql = pg(`
            INSERT INTO config.steno_template (st_group, st_name, st_sql)
            VALUES (:group, :name, :sql)
            ON CONFLICT (st_group, st_name) DO UPDATE
            SET st_sql = :sql, st_version = steno_template.st_version + 1, st_update_dt = now();
        `)(template);

        await this.connection.query(insertSql);
        const selectSql = pg('SELECT * FROM config.steno_template WHERE st_group = :group AND st_name = :name')(template);
        const result = await this.connection.query(selectSql);
        result.rows.forEach(async rec => {
            const insertLogSql = pg(`
                INSERT INTO config.steno_template_log (st_group, st_name, st_sql, st_version, st_update_dt, st_create_dt)
                VALUES (:st_group, :st_name, :st_sql, :st_version, :st_update_dt, :st_create_dt)
                RETURNING st_id;
            `)(rec);
            await this.connection.query(insertLogSql);
        });
        const response = await this.getSqlTemplates([ `${template.group}:${template.name}`]);
        return response.find(o => !!o);
    }


    async saveStenoTemplate(template: StenoTemplate) {
        const insertSql = pg(`
            INSERT INTO config.steno_prepared_template (spt_name, spt_template)
            VALUES(:name, :template)
            ON CONFLICT (spt_name) DO UPDATE
            SET spt_template = :template, spt_version = steno_prepared_template.spt_version + 1, spt_update_dt = NOW();
        `)(template);

        await this.connection.query(insertSql);
        const selectSql = pg(`SELECT * FROM config.steno_prepared_template WHERE spt_name = :name`)(template);
        const result = await this.connection.query(selectSql);
        result.rows.forEach(async rec => {
            const insertLogSql = pg(`
                INSERT INTO config.steno_prepared_template_log (spt_name, spt_template, spt_version, spt_create_dt, spt_update_dt) 
                VALUES (:spt_name, :spt_template, :spt_version, :spt_create_dt, :spt_update_dt)
                RETURNING spt_id;
            `)(rec);
            await this.connection.query(insertLogSql);
        });

        const response = await this.getStenoTemplates([template.name]);
        return response.find(o => !!o);
    }
}