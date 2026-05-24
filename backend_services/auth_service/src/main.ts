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

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (Postman, curl)
      if (!origin) {
        return callback(null, true);
      }
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  // app.enableCors({
  //   origin: true,
  //   credentials: true,
  // });

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
