import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3005;

  if (process.env.NODE_ENV === 'development') {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Inference Service')
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

  await app.listen(port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Inference Service is running on: http://localhost:${port}`);
}
void bootstrap();
