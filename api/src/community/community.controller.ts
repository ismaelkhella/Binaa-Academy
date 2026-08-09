import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { CommunityService, MAX_ATTACHMENT_BYTES, safeServeHeaders } from './community.service';
import { CommunityGateway } from './community.gateway';
import { UserJwtGuard, AdminJwtGuard } from '../auth/guards/jwt.guard';

/** Streams from object storage; legacy rows (bytes still in the DB) are buffered as a fallback. */
async function serveAttachment(
  community: CommunityService,
  a: { id: string; storageKey: string | null },
  res: Response,
) {
  const source = community.streamAttachment(a);
  if (source.kind === 'stream') {
    source.stream.on('error', () => {
      if (!res.headersSent) res.status(502);
      res.end();
    });
    source.stream.pipe(res);
  } else {
    res.send(await community.getLegacyAttachmentData(a.id));
  }
}

@Controller('community')
@UseGuards(UserJwtGuard)
export class CommunityController {
  constructor(private community: CommunityService, private gateway: CommunityGateway) {}

  @Get('subjects')
  listSubjects(@Req() req: any) {
    return this.community.listSubjects(req.user.sub, req.user.role);
  }

  @Get('attachments/:id')
  async getAttachment(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const a = await this.community.getAttachment(req.user.sub, req.user.role, id);
    const { contentType, disposition } = safeServeHeaders(a.mimeType);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(a.size));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(a.fileName)}`);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    await serveAttachment(this.community, a, res);
  }

  @Get(':subjectId/messages')
  getMessages(
    @Req() req: any,
    @Param('subjectId') subjectId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.community.getMessages(req.user.sub, req.user.role, subjectId, before, limit ? parseInt(limit, 10) : 50);
  }

  // 20 messages per minute per IP
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post(':subjectId/messages')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_BYTES } }))
  async sendMessage(
    @Req() req: any,
    @Param('subjectId') subjectId: string,
    @Body() body: { content?: string; type?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const message = await this.community.sendMessage(req.user.sub, req.user.role, subjectId, body?.content, file, body?.type);
    this.gateway.broadcastNewMessage(subjectId, message);
    return message;
  }
}

@Controller('admin/community')
@UseGuards(AdminJwtGuard)
export class AdminCommunityController {
  constructor(private community: CommunityService, private gateway: CommunityGateway) {}

  @Get(':subjectId/messages')
  getMessages(
    @Param('subjectId') subjectId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.community.adminGetMessages(subjectId, before, limit ? parseInt(limit, 10) : 50);
  }

  @Get('attachments/:id')
  async getAttachment(@Param('id') id: string, @Res() res: Response) {
    const a = await this.community.adminGetAttachment(id);
    const { contentType, disposition } = safeServeHeaders(a.mimeType);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(a.size));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(a.fileName)}`);
    await serveAttachment(this.community, a, res);
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string) {
    const result = await this.community.adminDeleteMessage(id);
    this.gateway.broadcastDeletedMessage(result.subjectId, id);
    return { success: true };
  }
}
