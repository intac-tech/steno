import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StenoModule } from './steno/steno.module';

@Module({
  imports: [
    StenoModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
