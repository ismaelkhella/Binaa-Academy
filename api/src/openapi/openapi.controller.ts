import { Controller, Get, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * يقدّم ملف OpenAPI spec على /api/openapi.json ليستفيد مطوّر الموبايل من
 * خاصية URL Import في Apidog (مزامنة تلقائية عبر Scheduled Import).
 *
 * Serves the OpenAPI spec at /api/openapi.json so the mobile dev team can
 * Apidog's URL Import feature with auto-sync. Spec is read once at module
 * init via OnModuleInit — placing I/O in a lifecycle hook is the NestJS
 * convention and keeps the constructor side-effect-free for testing.
 */
@Controller('openapi.json')
export class OpenapiController implements OnModuleInit {
  private readonly logger = new Logger(OpenapiController.name);
  private cachedSpec: Record<string, unknown> = {};

  async onModuleInit(): Promise<void> {
    const filePath = join(process.cwd(), 'docs', 'openapi.json');
    const raw = readFileSync(filePath, 'utf-8');
    this.cachedSpec = JSON.parse(raw);
    this.logger.log(`OpenAPI spec loaded from ${filePath} (${raw.length} bytes)`);
  }

  @Get()
  getSpec(): Record<string, unknown> {
    return this.cachedSpec;
  }
}
