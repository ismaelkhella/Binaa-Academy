"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
function validateSecrets() {
    const MIN_LENGTH = 128;
    const required = ['JWT_SECRET', 'ADMIN_JWT_SECRET'];
    const errors = [];
    for (const key of required) {
        const value = process.env[key];
        if (!value) {
            errors.push(`${key} is not set`);
        }
        else if (value.length < MIN_LENGTH) {
            errors.push(`${key} is too short (${value.length} chars). ` +
                `Must be at least ${MIN_LENGTH} characters. ` +
                `Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`);
        }
    }
    if (errors.length > 0) {
        console.error('FATAL — weak or missing JWT secrets:');
        for (const e of errors)
            console.error(`  • ${e}`);
        process.exit(1);
    }
}
async function bootstrap() {
    validateSecrets();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    const isProd = process.env.NODE_ENV === 'production';
    app.set('trust proxy', 1);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                mediaSrc: ["'self'", 'blob:', 'https:'],
                connectSrc: ["'self'", 'https://storage.googleapis.com', 'https://*.mux.com'],
                frameAncestors: ["'self'"],
            },
        },
        frameguard: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
    }));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/api/uploads/',
    });
    if (isProd) {
        const adminDist = (0, path_1.join)(process.cwd(), '..', 'admin', 'dist');
        app.useStaticAssets(adminDist);
        app.use((req, res, next) => {
            const isPageRequest = (req.method === 'GET' || req.method === 'HEAD') &&
                !req.path.startsWith('/api') &&
                !req.path.startsWith('/uploads') &&
                !req.path.split('/').pop()?.includes('.');
            if (isPageRequest)
                return res.sendFile((0, path_1.join)(adminDist, 'index.html'));
            next();
        });
    }
    app.use((req, res, next) => {
        res.on('finish', () => {
            console.log(`[HTTP] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
        });
        next();
    });
    app.setGlobalPrefix('api');
    const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
    app.enableCors({
        origin: corsOrigins?.length ? corsOrigins : (isProd ? false : ['http://localhost:5173', 'http://localhost:5000']),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Bina Academy API running on http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map