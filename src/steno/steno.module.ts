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
            await conn.query(`CREATE SCHEMA IF NOT EXISTS config;`);
            await conn.query(`
            CREATE TABLE IF NOT EXISTS config.steno_template (
                st_group varchar(500) NOT NULL,
                st_name varchar(500) NOT NULL,
                st_sql text,
                st_version bigint DEFAULT 1,
                st_create_dt TIMESTAMP DEFAULT NOW(),
                st_update_dt TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (st_group, st_name)
            );`);

            await conn.query(`
            CREATE TABLE IF NOT EXISTS config.steno_template_log (
                st_id serial NOT NULL PRIMARY KEY,
                st_group VARCHAR(500) NOT NULL,
                st_name VARCHAR(500) NOT NULL,
                st_sql text,
                st_version BIGINT DEFAULT 1,
                st_create_dt TIMESTAMP NOT NULL,
                st_update_dt TIMESTAMP NOT NULL
            );`);

            await conn.query(`
            CREATE TABLE IF NOT EXISTS config.steno_prepared_template (
                spt_name varchar(500) NOT NULL,
                spt_template text,
                spt_version bigint DEFAULT 1,
                spt_create_dt TIMESTAMP DEFAULT NOW(),
                spt_update_dt TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (spt_name)
            );`);

            await conn.query(
            `CREATE TABLE IF NOT EXISTS config.steno_prepared_template_log (
                spt_id serial NOT NULL PRIMARY KEY,
                spt_name VARCHAR(500) NOT NULL,
                spt_template text,
                spt_version BIGINT NOT NULL,
                spt_create_dt TIMESTAMP NOT NULL,
                spt_update_dt TIMESTAMP NOT NULL
            );`);
        })
        .then(() => console.log('done initialize steno db'))
        .catch((err) => console.error('error initializing db', err));
    }

}