import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

// Global exception filter để CATCH mọi error (kể cả body-parser 400)
// và log ra console với chi tiết URL + headers + error message.
@Catch()
class GlobalErrorLogger implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : String(exception);

    if (req.url?.includes('/webhooks/') || status >= 400) {
      console.error(
        '[media-service ERR]',
        req.method,
        req.url,
        'status=',
        status,
        'CL=',
        req.headers['content-length'],
        'ct=',
        req.headers['content-type'],
        'sig=',
        req.headers['upstash-signature'] ? 'present' : 'missing',
        'msg=',
        message,
      );
    }

    res
      .status(status)
      .json(
        typeof message === 'object' ? message : { statusCode: status, message },
      );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.useGlobalFilters(new GlobalErrorLogger());

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
      .setTitle('Media Service')
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

  const port = process.env.PORT || 8003;
  await app.listen(port, '0.0.0.0');
  console.log(`Media Service is running on: http://localhost:${port}`);
}
bootstrap();
