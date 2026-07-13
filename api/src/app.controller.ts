import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

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

  // Serve the admin SPA for all non-API routes in production
  @Get('*path')
  serveAdmin(@Res() res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.sendFile(join(process.cwd(), '..', 'admin', 'dist', 'index.html'));
    }
    return res.status(404).json({ message: 'Not found' });
  }
}
