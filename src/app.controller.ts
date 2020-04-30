import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { SqlTemplate, StenoTemplate, StenoRequest } from './steno/model';
import { StenoTemplateProvider } from './steno/steno-template.provider';
import { StenoProvider } from './steno/steno-service.provider';

@Controller('steno')
export class AppController {
  constructor(private readonly appService: AppService,
              private readonly stenoSvc: StenoProvider,
              private readonly stenoTemplateService: StenoTemplateProvider) {}

  @Get('tables')
  async getTables() {
    return await this.stenoTemplateService.getTables();
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
