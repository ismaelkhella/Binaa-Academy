import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

function validateSecrets() {
  const MIN_LENGTH = 128;
  const required = ['JWT_SECRET', 'ADMIN_JWT_SECRET'];
  const errors: string[] = [];

  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      errors.push(`${key} is not set`);
    } else if (value.length < MIN_LENGTH) {
      errors.push(
        `${key} is too short (${value.length} chars). ` +
        `Must be at least ${MIN_LENGTH} characters. ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
      );
    }
  }

  if (errors.length > 0) {
    console.error('FATAL — weak or missing JWT secrets:');
    for (const e of errors) console.error(`  • ${e}`);
    process.exit(1);
  }
}

async function bootstrap() {
  validateSecrets();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Bina Academy API running on http://localhost:${port}/api`);
}

bootstrap();
