import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust exactly 1 proxy hop (the api_gateway) so req.ip resolves to
  // the real client IP for per-IP rate limiting. Using `true` would trust
  // the entire X-Forwarded-For chain and allow IP spoofing.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

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

  if (process.env.NODE_ENV === 'development') {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Auth Service')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurityRequirements({ bearer: [] })
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const INTERNAL = ['x-user-id','x-user-role','x-user-email','x-forwarded-for','user-agent'];
    for (const path of Object.values((document.paths ?? {}) as Record<string, any>)) {
      for (const op of Object.values(path as object) as any[]) {
        if (op?.parameters) op.parameters = op.parameters.filter((p: any) => !(p.in === 'header' && INTERNAL.includes(p.name)));
      }
    }
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = process.env.PORT || 8001;
  await app.listen(port, '0.0.0.0');
  console.log(`Auth Service is running on: http://localhost:${port}`);
}
bootstrap();
