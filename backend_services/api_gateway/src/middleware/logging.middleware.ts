import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

export const loggingMiddleware = morgan('combined', {
  skip: (req: Request, res: Response) => {
    // Skip logging for health check endpoints
    return req.url === '/health';
  },
});

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );
  });

  next();
};




