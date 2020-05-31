import { Controller, Get, Post, Body, Param, Header, Req, Delete } from '@nestjs/common';
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

  @Get('sql/:group')
  async getSqlTemplates(@Param('group') group) {
    return await this.stenoTemplateService.getGroupSqlTemplates([group]);
  }

  @Delete('sql/:group/:name')
  async delteSqlTemplate(@Param('group') group: string, @Param('name') name: string) {
    return await this.stenoTemplateService.removeSqlTemplate(group, name);
  }

  @Post('execute')
  @Header('content-type', 'text/plain')
  async executeSql(@Req() req) {
    if (req.readable) {
      // body is ignored by NestJS -> get raw body from request
      const raw = await rawbody(req);
      const text = raw.toString().trim();
      return await this.stenoTemplateService.executeSQL(text);
    }
  }

  @Post('sql')
  async saveTemplate(@Body() request: SqlTemplate) {
    return await this.stenoTemplateService.saveTemplate(request);
  }

  @Post('templates/:name')
  async savePsTemplate(@Body() request: StenoRequest, @Param('name') name) {
    const template: StenoTemplate = {
      name,
      template: JSON.stringify(request, null,  4)
    };

    return await this.stenoTemplateService.saveStenoTemplate(template);
  }

  // api methods

  @Post('api')
  async execute(@Body() request: StenoRequest) {
    return await this.stenoSvc.execute(request);
  }

  @Post('api/:name')
  async executePs(@Body() variables: any, @Param('name') name) {
    return await this.stenoSvc.executePs(name, variables);
  }

  // groups methods

  @Post('groups')
  async createGroup(@Body() request: { group:string, description: string }) {
    return await this.stenoTemplateService.createGroup(request.group, request.description);
  }

  @Delete('groups/:group')
  async removeGroup(@Param('group') group: string) {
    return await this.stenoTemplateService.removeGroup(group);
  }

  @Get('groups')
  async getGroups() {
    return await this.stenoTemplateService.getGroups();
  }

  @Get('templates')
  async getTemplates() {
    return await this.stenoTemplateService.getStenoTemplateNames();
  }

  @Delete('templates/:name')
  async removeStenoTemplates(@Param('name') name: string) {
    return await this.stenoTemplateService.removeStenoTemplate(name);
  }

}
