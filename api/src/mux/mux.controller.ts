import {
  Controller,
  Post,
  UseGuards,
  Req,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { AdminJwtGuard } from '../auth/guards/jwt.guard';
import { MuxService } from './mux.service';

@Controller('mux')
export class MuxController {
  constructor(private muxService: MuxService) {}

  /** Admin-only: get a direct-upload URL so the browser sends the file straight to Mux. */
  @UseGuards(AdminJwtGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('create-upload')
  createUpload() {
    return this.muxService.createDirectUpload();
  }

  /**
   * Mux webhook receiver. Public route (Mux servers call it) — authenticity is
   * enforced by verifying the Mux signature against the raw request body.
   */
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const rawBody = req.rawBody;
    if (!rawBody || !(await this.muxService.verifyWebhookSignature(rawBody, req.headers))) {
      throw new UnauthorizedException('Invalid Mux webhook signature');
    }
    const event = JSON.parse(rawBody.toString('utf8'));
    await this.muxService.handleEvent(event);
    return { received: true };
  }
}
