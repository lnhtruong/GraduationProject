import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

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
      .setTitle('Course Service')
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

  const port = process.env.PORT || 8008;
  await app.listen(port, '0.0.0.0');
  console.log(`Course Service is running on: http://localhost:${port}`);
}
bootstrap();
