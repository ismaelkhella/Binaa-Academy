import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

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

  // Unknown /api/* GET routes return a JSON 404. (The SPA page-route fallback
  // is an express middleware in main.ts, outside the /api prefix.)
  @Get('*path')
  apiNotFound(@Res() res: Response) {
    return res.status(404).json({ message: 'Not found' });
  }
}
