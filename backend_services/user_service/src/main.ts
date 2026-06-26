import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
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
      .setTitle('User Service')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurityRequirements({ bearer: [] })
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const allExamples = JSON.parse(
      readFileSync(resolve(__dirname, '../../swagger-examples.json'), 'utf8'),
    );
    const swaggerExamples: Record<
      string,
      Record<string, unknown>
    > = allExamples['user'] ?? {};
    for (const [path, methods] of Object.entries(swaggerExamples)) {
      const pathObj = (document.paths as any)?.[path];
      if (!pathObj) continue;
      for (const [method, example] of Object.entries(
        methods as Record<string, unknown>,
      )) {
        const op = pathObj[method];
        if (op?.requestBody?.content?.['application/json']) {
          op.requestBody.content['application/json'].example = example;
        }
      }
    }
    const INTERNAL = [
      'x-user-id',
      'x-user-role',
      'x-user-email',
      'x-forwarded-for',
      'user-agent',
    ];
    for (const path of Object.values(
      (document.paths ?? {}) as Record<string, any>,
    )) {
      for (const op of Object.values(path as object) as any[]) {
        if (op?.parameters)
          op.parameters = op.parameters.filter(
            (p: any) => !(p.in === 'header' && INTERNAL.includes(p.name)),
          );
      }
    }
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = process.env.PORT || 8002;
  await app.listen(port, '0.0.0.0');
  console.log(`User Service is running on: http://localhost:${port}`);
}
bootstrap();
