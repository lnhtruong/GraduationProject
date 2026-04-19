import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { config } from '../config';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

const rateLimitJson = {
  success: false,
  message: 'Too many requests from this IP, please try again later.',
};

function isMutating(req: Request): boolean {
  return MUTATING.has(req.method);
}

function isAuthMutating(req: Request): boolean {
  // console.log("check isAuthMutating: ", req.path, req.path.startsWith('/api/auth') && isMutating(req));
  return req.path.startsWith('/api/auth') && isMutating(req);
}

/** Upload / chỉnh media: bỏ webhook (callback từ Cloudinary, AI, …). */
function isMediaMutatingHeavy(req: Request): boolean {
  if (!isMutating(req)) return false;
  // if (!req.path.startsWith('/api/media')) return false;
  if (req.path.startsWith('/api/media/webhooks')) return false;
  // console.log("check isMediaMutatingHeavy: ", req.path, isMutating(req) && req.path.startsWith('/api/media') && !req.path.startsWith('/api/media/webhooks'));
  return true;
}

export const authMutatingRateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMutatingMax,
  message: rateLimitJson,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isAuthMutating(req as Request),
});

export const mediaMutatingRateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.mediaMutatingMax,
  message: rateLimitJson,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isMediaMutatingHeavy(req as Request),
});
