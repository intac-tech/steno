import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StenoModule } from './steno/steno.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    StenoModule,
    ChatModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
