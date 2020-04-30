import { Module } from "@nestjs/common";
import { StenoProvider } from "./steno-service.provider";
import { DBModule } from "src/db/db.module";
import { Connection } from "src/db/connection";
import { StenoTemplateProvider } from "./steno-template.provider";

@Module({
    imports: [DBModule],
    providers: [StenoProvider, StenoTemplateProvider],
    exports: [StenoProvider, StenoTemplateProvider]
})
export class StenoModule {
    constructor(private connection: Connection) {
        this.init();
    }

    async init() {
        console.log('initialize steno db');
        await this.connection.transaction(async (conn) => {
            await conn.query(`
            CREATE TABLE IF NOT EXISTS steno_template (
                st_group varchar(500) NOT NULL,
                st_name varchar(500) NOT NULL,
                st_sql blob,
                st_version bigint(20) DEFAULT 1,
                st_create_dt datetime DEFAULT NOW(),
                st_update_dt datetime DEFAULT NOW(),
                PRIMARY KEY (st_group, st_name)
            );`);

            await conn.query(`
            CREATE TABLE IF NOT EXISTS steno_template_log (
                st_id BIGINT(20) NOT NULL AUTO_INCREMENT,
                st_group VARCHAR(500) NOT NULL,
                st_name VARCHAR(500) NOT NULL,
                st_sql BLOB,
                st_version BIGINT(20) DEFAULT 1,
                st_create_dt DATETIME NOT NULL,
                st_update_dt DATETIME NOT NULL,
                PRIMARY KEY (st_id),
                UNIQUE KEY UNIQUE_IDX (st_group,st_name,st_version)
            );`);

            await conn.query(`
            CREATE TABLE IF NOT EXISTS steno_prepared_template (
                spt_name varchar(500) NOT NULL,
                spt_template blob,
                spt_version bigint(20) DEFAULT 1,
                spt_create_dt datetime DEFAULT NOW(),
                spt_update_dt datetime DEFAULT NOW(),
                PRIMARY KEY (spt_name)
            );`);

            await conn.query(
            `CREATE TABLE IF NOT EXISTS steno_prepared_template_log (
                spt_id BIGINT(20) NOT NULL AUTO_INCREMENT,
                spt_name VARCHAR(500) NOT NULL,
                spt_template BLOB,
                spt_version BIGINT(20) NOT NULL,
                spt_create_dt DATETIME NOT NULL,
                spt_update_dt DATETIME NOT NULL,
                PRIMARY KEY (spt_id),
                UNIQUE KEY UNIQUE_IDX (spt_name,spt_version)
            );`);

            await conn.query(
            `CREATE TABLE IF NOT EXISTS steno_test_table (
                test_id BIGINT(20) NOT NULL AUTO_INCREMENT,
                test_name VARCHAR(500) NOT NULL,
                test_version BIGINT(20) NOT NULL,
                test_create_dt DATETIME NOT NULL,
                PRIMARY KEY (test_id)
            );`)
        });
        console.log('done initialize steno db');
    }

}