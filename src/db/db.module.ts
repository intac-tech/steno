import { Module } from "@nestjs/common";
import { Connection } from "./connection";

@Module({
    providers: [Connection],
    exports: [Connection]
})
export class DBModule {
}