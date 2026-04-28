import { NextFunction, Request, Response } from 'express';
import { AuthRequest, authMiddleware } from './auth.middleware';
import { getAccessRule, UserRole } from './access-policy';

function deny(res: Response, message: string): Response {
  return res.status(403).json({
    success: false,
    message,
  });
}

export function authorizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.path.startsWith('/socket.io')) {
    return next();
  }

  const rule = getAccessRule(req);

  if (!rule) {
    return deny(res, 'Endpoint access is not configured');
  }

  if (rule.access === 'public') {
    return next();
  }

  return authMiddleware(req as AuthRequest, res, () => {
    if (rule.access === 'authenticated') {
      return next();
    }

    const currentRole = (req as AuthRequest).user?.role as UserRole | undefined;

    if (!currentRole || !rule.roles?.includes(currentRole)) {
      return deny(res, 'Insufficient role permission');
    }

    return next();
  });
}
