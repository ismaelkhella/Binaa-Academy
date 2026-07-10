import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      status: 'ok',
      message: 'Bina Academy API is running successfully',
      documentation: '/api/openapi.json',
    };
  }
}
