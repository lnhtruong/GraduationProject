import { NextFunction, Request, Response } from 'express';
import { AuthRequest, authMiddleware, optionalAuthMiddleware } from './auth.middleware';
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
    return optionalAuthMiddleware(req as AuthRequest, res, next);
  }

  return authMiddleware(req as AuthRequest, res, () => {
    const authReq = req as AuthRequest;
    const normalizedPath = req.path.length > 1 && req.path.endsWith('/')
      ? req.path.slice(0, -1)
      : req.path;

    const userUpdatePathMatch = normalizedPath.match(/^\/api\/users\/(\d+)$/);
    if (req.method === 'PATCH' && userUpdatePathMatch) {
      // const targetId = Number(req.originalUrl.split('/').pop());
      const targetId = Number(userUpdatePathMatch[1]);
      const currentUser = authReq.user;

      if (!Number.isInteger(targetId) || !currentUser) {
        return deny(res, 'Invalid update target');
      }

      const isAdmin = currentUser.role === UserRole.ADMIN;
      const isSelfUpdate = currentUser.userId === targetId;
      if (!isAdmin && !isSelfUpdate) {
        return deny(res, 'You can only update your own profile');
      }
    }

    if (rule.access === 'authenticated') {
      return next();
    }

    const currentRole = authReq.user?.role as UserRole | undefined;

    if (!currentRole || !rule.roles?.includes(currentRole)) {
      return deny(res, 'Insufficient role permission');
    }

    return next();
  });
}
