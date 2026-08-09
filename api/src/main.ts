import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import helmet from 'helmet';
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

  // rawBody: needed to verify Mux webhook signatures against the exact bytes.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const isProd = process.env.NODE_ENV === 'production';

  // Behind Replit's proxy (dev preview + published autoscale): trust the first
  // proxy hop so req.ip is the real client IP — without this, rate limiting
  // would count ALL users against one shared proxy IP in production.
  app.set('trust proxy', 1);

  // Security headers. CSP is tuned for the admin SPA (self JS bundles, React
  // inline style attributes, Google Fonts) and lesson media on external https hosts.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          mediaSrc: ["'self'", 'blob:', 'https:'],
          // Mux direct uploads: the browser PUTs video files straight to
          // Mux's upload endpoint (Google Cloud Storage), bypassing our API.
          connectSrc: ["'self'", 'https://storage.googleapis.com', 'https://*.mux.com'],
          // Clickjacking protection: in production the admin panel must not be
          // frameable by anyone else. Replit domains are only needed for the
          // workspace preview iframe during development.
          frameAncestors: isProd
            ? ["'self'"]
            : ["'self'", 'https://*.replit.dev', 'https://*.replit.com', 'https://*.replit.app'],
        },
      },
      // frame-ancestors above is the modern control; X-Frame-Options would
      // conflict with the Replit workspace preview iframe.
      frameguard: false,
      // uploads/media must stay loadable from the mobile app (different origin)
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Serve uploaded media files — available at both /uploads/ and /api/uploads/
  // so that mobile clients using either the root URL or the /api base URL can access files.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads/',
  });

  // In production, serve the built admin panel with an SPA fallback: deep
  // links like /login or /students must load the app (index.html), not 404.
  if (isProd) {
    const adminDist = join(process.cwd(), '..', 'admin', 'dist');
    app.useStaticAssets(adminDist);
    app.use((req: Request, res: Response, next: NextFunction) => {
      const isPageRequest =
        (req.method === 'GET' || req.method === 'HEAD') &&
        !req.path.startsWith('/api') &&
        !req.path.startsWith('/uploads') &&
        !req.path.split('/').pop()?.includes('.'); // real files (js/css/svg) 404 if missing
      if (isPageRequest) return res.sendFile(join(adminDist, 'index.html'));
      next();
    });
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    });
    next();
  });

  app.setGlobalPrefix('api');
  // CORS: explicit origins from env only. In production the admin panel is
  // served same-origin (no CORS needed) and native mobile apps don't enforce
  // CORS, so default to NO cross-origin access instead of a localhost fallback.
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : (isProd ? false : ['http://localhost:5173', 'http://localhost:5000']),
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
  await app.listen(port, '0.0.0.0');
  console.log(`Bina Academy API running on http://localhost:${port}/api`);
}

bootstrap();
