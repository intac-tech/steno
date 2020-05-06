import { Controller, Get, Post, Body, Param, Header, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { SqlTemplate, StenoTemplate, StenoRequest } from './steno/model';
import { StenoTemplateProvider } from './steno/steno-template.provider';
import { StenoProvider } from './steno/steno-service.provider';
import * as rawbody from 'raw-body';

@Controller('steno')
export class AppController {
  constructor(private readonly appService: AppService,
              private readonly stenoSvc: StenoProvider,
              private readonly stenoTemplateService: StenoTemplateProvider) {}

  @Get('tables')
  async getTables() {
    return await this.stenoTemplateService.getTables();
  }

  @Post('executeSql')
  @Header('content-type', 'text/plain')
  async executeSql(@Req() req) {
    if (req.readable) {
      // body is ignored by NestJS -> get raw body from request
      const raw = await rawbody(req);
      const text = raw.toString().trim();
      return await this.stenoTemplateService.executeSQL(text);
    }
  }

  @Post('console')
  async saveTemplate(@Body() request: SqlTemplate) {
    return await this.stenoTemplateService.saveTemplate(request);
  }

  @Post('console/:name')
  async savePsTemplate(@Body() request: StenoRequest, @Param('name') name) {
    const template: StenoTemplate = {
      name,
      template: JSON.stringify(request, null,  4)
    };

    return await this.stenoTemplateService.saveStenoTemplate(template);
  }

  @Post('api')
  async execute(@Body() request: StenoRequest) {
    return await this.stenoSvc.execute(request);
  }

  @Post('api/:name')
  async executePs(@Body() variables: any, @Param('name') name) {
    return await this.stenoSvc.executePs(name, variables);
  }

}
