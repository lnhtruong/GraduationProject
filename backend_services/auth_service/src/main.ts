import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Behind api_gateway (http-proxy-middleware), trust forwarded headers so
  // req.ip resolves to the real client and the per-IP rate limiter works.
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  const corsOrigins = process.env.CORS_ORIGINS?.split(',') ?? [];

  app.use(cookieParser());

  // CORS is fully handled at the API Gateway layer (see api_gateway/src/index.ts).
  // Auth service is only reached through the gateway proxy, so it should mirror
  // any browser Origin to avoid stripping the Access-Control-Allow-Origin header
  // that the gateway has already set on the response.
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 8001;
  await app.listen(port, '0.0.0.0');
  console.log(`Auth Service is running on: http://localhost:${port}`);
}
bootstrap();
